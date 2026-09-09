"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const { assert, assertEqual } = require("./helpers");

// Accès direct à la même base SQLite que le serveur testé (DATABASE_URL est
// partagé par l'orchestrateur e2e.js avec ce process de test — voir tests/e2e.js).
// Nécessaire pour fabriquer un jeton de réinitialisation valide sans boîte
// mail (le lien n'est, par design, jamais renvoyé dans la réponse HTTP — voir
// lib/email/index.ts::sendPasswordResetEmail), et pour promouvoir un compte de
// test en ADMIN sans jamais toucher le compte admin partagé utilisé par les
// autres suites.
const { PrismaClient } = require(path.join(__dirname, "..", "src", "generated", "prisma", "client"));
const prisma = new PrismaClient();

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

// Réimplémentation indépendante de src/lib/auth/totp.ts (RFC 6238, HMAC-SHA1)
// pour calculer un code à partir du secret affiché par la page d'enrôlement —
// délibérément pas un import du code applicatif qu'on est en train de tester.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Decode(input) {
  const clean = input.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
function totpCode(base32Secret, timeMs = Date.now()) {
  const counter = Math.floor(timeMs / 1000 / 30);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(base32Secret)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 1e6).padStart(6, "0");
}

async function signUp(page, baseUrl, { email, displayName, password }) {
  await page.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
  await page.fill('input[name="displayName"]', displayName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/compte", { timeout: 8000 });
}

module.exports = {
  name: "Durcissement authentification — mot de passe oublié, 2FA admin",
  tests: [
    {
      name: "la demande de réinitialisation répond de façon identique pour un compte existant et inexistant",
      fn: async ({ page, baseUrl }) => {
        const email = `pwreset-enum-${Date.now()}@example.com`;
        await signUp(page, baseUrl, { email, displayName: "Reset Enum", password: "motdepasse-solide-123" });
        await page.click('button:has-text("Déconnexion")');
        await page.waitForURL(`${baseUrl}/`, { timeout: 8000 });

        await page.goto(`${baseUrl}/mot-de-passe-oublie`, { waitUntil: "load" });
        await page.fill('input[name="email"]', email);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
        const textExisting = await page.$eval('[data-testid="reset-requested"]', (el) => el.textContent);

        await page.goto(`${baseUrl}/mot-de-passe-oublie`, { waitUntil: "load" });
        await page.fill('input[name="email"]', `inexistant-${Date.now()}@example.com`);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
        const textNonExisting = await page.$eval('[data-testid="reset-requested"]', (el) => el.textContent);

        assertEqual(textExisting, textNonExisting, "la réponse doit être strictement identique, compte existant ou non");
      },
    },

    {
      name: "un jeton de réinitialisation valide change le mot de passe et invalide les sessions existantes",
      fn: async ({ page, baseUrl }) => {
        const email = `pwreset-flow-${Date.now()}@example.com`;
        const oldPassword = "motdepasse-solide-123";
        const newPassword = "nouveau-mot-de-passe-456";
        await signUp(page, baseUrl, { email, displayName: "Reset Flow", password: oldPassword });

        const user = await prisma.user.findUnique({ where: { email } });
        assert(user, "l'utilisateur de test doit exister en base");

        const rawToken = randomToken();
        await prisma.passwordResetToken.create({
          data: { id: hashToken(rawToken), userId: user.id, expiresAt: new Date(Date.now() + 60_000) },
        });

        // Même contexte navigateur : le cookie de session ouvert par
        // l'inscription est toujours présent au moment de la réinitialisation
        // — donc SiteHeader affiche aussi le bouton Déconnexion (lui-même un
        // <button type="submit"> dans son propre <form>) : le sélecteur doit
        // cibler spécifiquement le formulaire de réinitialisation, pas le
        // premier bouton "submit" trouvé dans le DOM (celui du header).
        await page.goto(`${baseUrl}/reinitialiser-mot-de-passe/${rawToken}`, { waitUntil: "load" });
        await page.fill('input[name="password"]', newPassword);
        await page.click('form.auth-form button[type="submit"]');
        await page.waitForTimeout(500);
        const success = await page.$('[data-testid="reset-success"]');
        assert(success, "la réinitialisation doit afficher un message de succès");

        // L'ancienne session (cookie encore dans ce contexte) doit être morte.
        await page.goto(`${baseUrl}/compte`, { waitUntil: "load" });
        assert(page.url().includes("/connexion"), `/compte doit rediriger vers /connexion après la réinitialisation, url = ${page.url()}`);

        // L'ancien mot de passe ne fonctionne plus.
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', oldPassword);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
        assert(page.url().includes("/connexion"), "l'ancien mot de passe ne doit plus fonctionner");

        // Le nouveau mot de passe fonctionne.
        await page.fill('input[name="password"]', newPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });
      },
    },

    {
      name: "un jeton de réinitialisation expiré est rejeté",
      fn: async ({ page, baseUrl }) => {
        const email = `pwreset-expired-${Date.now()}@example.com`;
        await signUp(page, baseUrl, { email, displayName: "Reset Expired", password: "motdepasse-solide-123" });

        const user = await prisma.user.findUnique({ where: { email } });
        const rawToken = randomToken();
        await prisma.passwordResetToken.create({
          data: { id: hashToken(rawToken), userId: user.id, expiresAt: new Date(Date.now() - 1000) },
        });

        // L'utilisateur de test est toujours connecté (signUp() ne se
        // déconnecte pas) : SiteHeader affiche donc aussi un bouton
        // "submit" (Déconnexion) — cibler le formulaire de réinitialisation
        // explicitement pour ne pas cliquer le premier bouton du DOM.
        await page.goto(`${baseUrl}/reinitialiser-mot-de-passe/${rawToken}`, { waitUntil: "load" });
        await page.fill('input[name="password"]', "un-autre-mot-de-passe-789");
        await page.click('form.auth-form button[type="submit"]');
        await page.waitForTimeout(500);
        const errorText = await page.$eval(".form-error", (el) => el.textContent).catch(() => null);
        assert(!!errorText && errorText.includes("expiré"), `un jeton expiré doit être rejeté, obtenu « ${errorText} »`);
      },
    },

    {
      name: "un jeton de réinitialisation déjà utilisé ne peut pas être rejoué",
      fn: async ({ page, baseUrl }) => {
        const email = `pwreset-replay-${Date.now()}@example.com`;
        await signUp(page, baseUrl, { email, displayName: "Reset Replay", password: "motdepasse-solide-123" });

        const user = await prisma.user.findUnique({ where: { email } });
        const rawToken = randomToken();
        await prisma.passwordResetToken.create({
          data: { id: hashToken(rawToken), userId: user.id, expiresAt: new Date(Date.now() + 60_000) },
        });

        // Même remarque que le test précédent : sélecteur scopé au formulaire
        // de réinitialisation (le header affiche aussi un submit Déconnexion
        // tant que l'utilisateur reste connecté).
        await page.goto(`${baseUrl}/reinitialiser-mot-de-passe/${rawToken}`, { waitUntil: "load" });
        await page.fill('input[name="password"]', "premier-changement-123");
        await page.click('form.auth-form button[type="submit"]');
        await page.waitForTimeout(500);
        assert(await page.$('[data-testid="reset-success"]'), "le premier usage du jeton doit réussir");

        await page.goto(`${baseUrl}/reinitialiser-mot-de-passe/${rawToken}`, { waitUntil: "load" });
        await page.fill('input[name="password"]', "second-changement-456");
        await page.click('form.auth-form button[type="submit"]');
        await page.waitForTimeout(500);
        const errorText = await page.$eval(".form-error", (el) => el.textContent).catch(() => null);
        assert(!!errorText, "un jeton déjà utilisé ne doit pas pouvoir être rejoué");
      },
    },

    {
      name: "activer la 2FA sur un compte admin exige un code lors de la connexion suivante",
      fn: async ({ page, baseUrl }) => {
        // Compte admin dédié à ce test (jamais le compte admin partagé) :
        // inscription normale puis promotion directe en base, pour ne pas
        // risquer de laisser la 2FA activée sur le compte utilisé par toutes
        // les autres suites admin si ce test échoue en cours de route.
        const email = `2fa-admin-${Date.now()}@example.com`;
        const password = "motdepasse-solide-123";
        await signUp(page, baseUrl, { email, displayName: "2FA Admin", password });
        await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
        await page.click('button:has-text("Déconnexion")');
        await page.waitForURL(`${baseUrl}/`, { timeout: 8000 });

        try {
          await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
          await page.fill('input[name="email"]', email);
          await page.fill('input[name="password"]', password);
          await page.click('button[type="submit"]');
          // Pas de ?next= ici : la connexion normale retombe sur /compte par
          // défaut (voir actions.ts), même pour un ADMIN — /admin n'est
          // atteint qu'en y naviguant explicitement, ou via ?next=%2Fadmin.
          await page.waitForURL("**/compte", { timeout: 8000 });

          await page.goto(`${baseUrl}/admin/securite`, { waitUntil: "load" });
          await page.click('button:has-text("Activer la 2FA")');
          await page.waitForSelector('[data-testid="totp-secret"]', { timeout: 5000 });
          const hint = await page.$eval('[data-testid="totp-secret"]', (el) => el.textContent || "");
          const secret = hint.split(":").pop().trim();
          assert(/^[A-Z2-7]+$/.test(secret), `secret base32 attendu, obtenu « ${secret} »`);

          await page.fill('input[name="code"]', totpCode(secret));
          await page.click('button:has-text("Confirmer")');
          await page.waitForSelector('[data-testid="totp-enabled"]', { timeout: 5000 });

          await page.goto(`${baseUrl}/compte`, { waitUntil: "load" });
          await page.click('button:has-text("Déconnexion")');
          await page.waitForURL(`${baseUrl}/`, { timeout: 8000 });

          // Mot de passe seul ne suffit plus : redirection vers la vérification 2FA.
          await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
          await page.fill('input[name="email"]', email);
          await page.fill('input[name="password"]', password);
          await page.click('button[type="submit"]');
          await page.waitForURL("**/connexion/verification", { timeout: 8000 });

          // Code invalide refusé.
          await page.fill('input[name="code"]', "000000");
          await page.click('button[type="submit"]');
          await page.waitForTimeout(500);
          const errorText = await page.$eval(".form-error", (el) => el.textContent).catch(() => null);
          assert(!!errorText, "un code TOTP invalide doit être rejeté");

          // Code valide accepté -> session créée, accès admin.
          await page.fill('input[name="code"]', totpCode(secret));
          await page.click('button[type="submit"]');
          await page.waitForURL("**/admin", { timeout: 8000 });
        } finally {
          // Ce compte est dédié à ce test (jamais le compte admin partagé),
          // mais on nettoie quand même la 2FA en base par hygiène.
          await prisma.user.update({ where: { email }, data: { totpEnabled: false, totpSecret: null } }).catch(() => {});
        }
      },
    },
  ],
};
