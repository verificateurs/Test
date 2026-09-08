"use strict";

/**
 * Orchestrateur de bout en bout pour `npm run test:e2e`.
 *
 * L'application pré-rend l'essentiel du catalogue en statique au build
 * (generateStaticParams interroge la base) : la base de test doit donc être
 * seedée AVANT `next build`, pas seulement avant `next start`. Séquence :
 *
 *   1. base SQLite jetable (hors dépôt, supprimée à la fin)
 *   2. prisma db push (schéma) + seed (catalogue + compte ADMIN de test)
 *   3. npm run build (prisma generate + next build, contre cette base)
 *   4. libération du port cible puis next start dessus, attente du signal
 *      de disponibilité émis par Next lui-même (pas un simple sondage HTTP,
 *      qui se laisserait tromper par un serveur orphelin déjà présent sur
 *      ce port depuis une exécution précédente interrompue)
 *   5. tests/run.js contre ce serveur
 *   6. arrêt du serveur + suppression de la base jetable, dans tous les cas
 *      (y compris sur Ctrl-C ou arrêt externe du processus)
 *
 * Usage : npm run test:e2e [-- <motif de fichier de test>]
 */

const { spawnSync, spawn } = require("node:child_process");
const { existsSync, readFileSync, readdirSync, readlinkSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || "3100");
const BASE_URL = `http://localhost:${PORT}`;
const TEST_DB = path.join(os.tmpdir(), `detailix-e2e-${process.pid}-${Date.now()}.db`);

const env = {
  ...process.env,
  DATABASE_URL: `file:${TEST_DB}`,
  SEED_ADMIN_EMAIL: ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
  NEXT_PUBLIC_SITE_URL: BASE_URL,
};

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: ROOT, env, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    throw new Error(`La commande a échoué (code ${result.status}) : ${command} ${args.join(" ")}`);
  }
}

// Un `next start` précédent, interrompu (Ctrl-C sur l'orchestrateur, session
// coupée...), laisse parfois un `next-server` orphelin sur le port de test —
// Next ré-exécute le process sous ce nom, qui n'apparaît donc plus dans les
// arguments de lancement d'origine (`pkill -f "next start"` ne le retrouve
// pas). On identifie plutôt le(s) PID via /proc/net/tcp, sans dépendre
// d'outils externes (lsof/fuser) qui peuvent être absents de l'image.
function findPidsListeningOnPort(port) {
  const hexPort = port.toString(16).toUpperCase().padStart(4, "0");
  const pids = new Set();
  for (const proto of ["tcp", "tcp6"]) {
    let content;
    try {
      content = readFileSync(`/proc/net/${proto}`, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n").slice(1)) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 10) continue;
      const [, localAddr, , st, , , , , , inode] = cols;
      if (!localAddr || st !== "0A" || inode === "0") continue; // 0A = LISTEN
      if (localAddr.split(":")[1] !== hexPort) continue;

      for (const pidDir of readdirSync("/proc")) {
        if (!/^\d+$/.test(pidDir)) continue;
        try {
          const fdDir = `/proc/${pidDir}/fd`;
          for (const fd of readdirSync(fdDir)) {
            if (readlinkSync(`${fdDir}/${fd}`) === `socket:[${inode}]`) {
              pids.add(pidDir);
              break;
            }
          }
        } catch {
          // PID disparu entre-temps, ou fd non lisible (process d'un autre utilisateur) : ignorer.
        }
      }
    }
  }
  return [...pids];
}

function freePort(port) {
  const pids = findPidsListeningOnPort(port);
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGKILL");
      console.log(`Port ${port} déjà occupé par le PID ${pid} (exécution précédente interrompue ?) — arrêté.`);
    } catch {
      // déjà arrêté entre la détection et le kill.
    }
  }
}

function cleanupDb() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = TEST_DB + suffix;
    if (existsSync(file)) rmSync(file, { force: true });
  }
}

// Attend le message de disponibilité émis par `next start` lui-même plutôt
// que de sonder le port en HTTP : un sondage HTTP se contenterait de
// n'importe quel serveur répondant sur ce port, orphelin compris.
function startServerAndWaitReady(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Le serveur n'a pas signalé être prêt sur le port ${PORT} après ${timeoutMs}ms.`));
    }, timeoutMs);

    const onChunk = (chunk) => {
      process.stdout.write(chunk);
      if (!settled && /✓ Ready in/.test(chunk.toString())) {
        settled = true;
        clearTimeout(timer);
        resolve(child);
      }
    };
    child.stdout.on("data", onChunk);
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));

    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Le serveur s'est arrêté prématurément (code ${code}) avant d'être prêt.`));
    });
  });
}

let activeServer = null;

function cleanupAndExit(code) {
  if (activeServer && activeServer.exitCode === null) activeServer.kill("SIGKILL");
  cleanupDb();
  process.exit(code);
}
process.on("SIGINT", () => cleanupAndExit(130));
process.on("SIGTERM", () => cleanupAndExit(143));

async function main() {
  freePort(PORT);

  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);
  run("node", ["--experimental-strip-types", "prisma/seed.ts"]);
  run("npm", ["run", "build"]);

  freePort(PORT); // dernière vérification juste avant le bind, au cas où.
  console.log(`\n$ npx next start -p ${PORT}`);
  const server = await startServerAndWaitReady("npx", ["next", "start", "-p", String(PORT)], 30000);
  activeServer = server;

  let exitCode = 1;
  try {
    const filterArgs = process.argv.slice(2);
    const testRun = spawnSync(process.execPath, ["tests/run.js", ...filterArgs], {
      cwd: ROOT,
      env: { ...env, BASE_URL },
      stdio: "inherit",
    });
    exitCode = testRun.status ?? 1;
  } finally {
    if (server.exitCode === null) server.kill();
    cleanupDb();
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error("Échec de l'orchestration des tests e2e :", err);
  if (activeServer && activeServer.exitCode === null) activeServer.kill("SIGKILL");
  cleanupDb();
  process.exit(1);
});
