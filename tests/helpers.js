"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

/**
 * Playwright est une devDependency (`npm ci` en CI). Dans l'environnement de
 * développement conteneurisé il n'est disponible qu'en global : on retombe
 * dessus plutôt que d'imposer une installation locale.
 */
function loadPlaywright() {
  try {
    return require("playwright");
  } catch (err) {
    return require("/opt/node22/lib/node_modules/playwright");
  }
}

const LOCAL_CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

function launchOptions() {
  const options = { args: ["--no-sandbox"] };
  // En CI, Playwright installe et localise son propre Chromium : on ne force le
  // chemin que si le binaire pré-installé de l'image de dev existe.
  if (fs.existsSync(LOCAL_CHROMIUM)) options.executablePath = LOCAL_CHROMIUM;
  return options;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

/** Serveur statique minimal (aucune dépendance) pour servir le site pendant les tests. */
function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const filePath = path.join(ROOT, relative);

    // Empêche toute sortie de la racine du site (../../etc/passwd).
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(content);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

/* ---------- Assertions ---------- */

class AssertionError extends Error {}

function assert(condition, message) {
  if (!condition) throw new AssertionError(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new AssertionError(`${message}\n    attendu : ${JSON.stringify(expected)}\n    obtenu  : ${JSON.stringify(actual)}`);
  }
}

/**
 * Charge une page et attend que le catalogue soit rendu.
 *
 * On n'utilise volontairement PAS `waitUntil: "networkidle"` : la suite doit
 * rester insensible à toute ressource tierce (une requête externe qui traîne ou
 * qui retente ferait expirer chaque test). L'attente porte sur un élément rendu
 * par notre propre code, ce qui est à la fois plus rapide et plus fiable.
 */
async function gotoSite(page, baseUrl, pathname = "/index.html") {
  await page.goto(baseUrl + pathname, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".brand-card", { timeout: 10000 });
}

module.exports = { ROOT, loadPlaywright, launchOptions, startServer, assert, assertEqual, AssertionError, gotoSite };
