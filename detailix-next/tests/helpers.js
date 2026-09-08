"use strict";

const fs = require("node:fs");

/**
 * Playwright est une devDependency (`npm ci` en CI, navigateur récupéré via
 * `npx playwright install` ou déjà présent sous PLAYWRIGHT_BROWSERS_PATH).
 * Dans l'environnement de développement conteneurisé où ce projet a été
 * écrit, il n'est parfois disponible qu'en global : on retombe dessus
 * plutôt que d'imposer une installation locale.
 */
function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    return require("/opt/node22/lib/node_modules/playwright");
  }
}

const LOCAL_CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

function launchOptions() {
  const options = { args: ["--no-sandbox"] };
  // En CI ou sur un poste standard, Playwright installe et localise son
  // propre Chromium (PLAYWRIGHT_BROWSERS_PATH) : on ne force le chemin que
  // si le binaire pré-installé de l'image de dev existe.
  if (fs.existsSync(LOCAL_CHROMIUM)) options.executablePath = LOCAL_CHROMIUM;
  return options;
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Le serveur testé doit avoir été seedé avec SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD
// réglés sur ces mêmes valeurs — voir `npm run test:e2e`, qui seed une base
// jetable avec exactement ces identifiants avant de lancer la suite.
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@detailix.test";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "mot-de-passe-admin-test-1";

class AssertionError extends Error {}

function assert(condition, message) {
  if (!condition) throw new AssertionError(message || "assertion échouée");
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new AssertionError(
      `${message || "valeurs différentes"} — attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`
    );
  }
}

module.exports = {
  loadPlaywright,
  launchOptions,
  BASE_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AssertionError,
  assert,
  assertEqual,
};
