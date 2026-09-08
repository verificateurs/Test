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
 *   4. next start sur un port dédié, attente de disponibilité
 *   5. tests/run.js contre ce serveur
 *   6. arrêt du serveur + suppression de la base jetable, dans tous les cas
 *
 * Usage : npm run test:e2e [-- <motif de fichier de test>]
 */

const { spawnSync, spawn } = require("node:child_process");
const { existsSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.TEST_PORT || "3100";
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

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() > deadline) reject(new Error(`Le serveur ne répond pas sur ${url} après ${timeoutMs}ms`));
          else setTimeout(attempt, 500);
        });
    };
    attempt();
  });
}

function cleanupDb() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = TEST_DB + suffix;
    if (existsSync(file)) rmSync(file, { force: true });
  }
}

async function main() {
  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);
  run("node", ["--experimental-strip-types", "prisma/seed.ts"]);
  run("npm", ["run", "build"]);

  const server = spawn("npx", ["next", "start", "-p", PORT], { cwd: ROOT, env, stdio: "inherit" });
  let serverExited = false;
  server.on("exit", () => {
    serverExited = true;
  });

  let exitCode = 1;
  try {
    await waitForServer(BASE_URL, 30000);
    if (serverExited) throw new Error("Le serveur de test s'est arrêté avant d'avoir pu être testé.");

    const filterArgs = process.argv.slice(2);
    const testRun = spawnSync(process.execPath, ["tests/run.js", ...filterArgs], {
      cwd: ROOT,
      env: { ...env, BASE_URL },
      stdio: "inherit",
    });
    exitCode = testRun.status ?? 1;
  } finally {
    if (!serverExited) server.kill();
    cleanupDb();
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error("Échec de l'orchestration des tests e2e :", err);
  cleanupDb();
  process.exit(1);
});
