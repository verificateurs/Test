/**
 * Accès centralisé au localStorage.
 *
 * Deux raisons d'exister :
 *  1. localStorage peut lever (navigation privée, quota, stockage désactivé) —
 *     un échec ne doit jamais casser le rendu de la page.
 *  2. Son contenu est modifiable à la main par le visiteur : tout ce qui en sort
 *     est une donnée NON FIABLE et doit être validé avant usage.
 */

const STORAGE_KEYS = {
  cart: "detailix_cart_v1",
  garage: "detailix_garage_v1",
  account: "detailix_account_v1",
  orders: "detailix_orders_v1",
};

/**
 * Lit une clé, la parse, puis la valide.
 * @param {string} key
 * @param {(parsed: unknown) => boolean} isValid - garde de forme
 * @param {*} fallback - valeur retournée si absent, illisible ou invalide
 */
function readStorage(key, isValid, fallback) {
  let parsed;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn(`Stockage local indisponible ou illisible pour « ${key} ».`, err);
    return fallback;
  }
  if (!isValid(parsed)) {
    console.warn(`Contenu invalide pour « ${key} » : valeur ignorée.`);
    return fallback;
  }
  return parsed;
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Impossible d'enregistrer « ${key} » (stockage plein ou désactivé).`, err);
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Impossible de supprimer « ${key} ».`, err);
  }
}

/** Efface toutes les données locales du site (panier, garage, compte, commandes). */
function clearAllLocalData() {
  Object.values(STORAGE_KEYS).forEach(removeStorage);
}

/* ---------- Gardes de forme ---------- */

const isPositiveInt = (n) => Number.isInteger(n) && n > 0;
const isNonEmptyString = (s) => typeof s === "string" && s.length > 0;

function isValidCart(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => item && isNonEmptyString(item.productId) && isPositiveInt(item.qty))
  );
}

function isValidGarage(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Number.isInteger(value.activeIndex) &&
    Array.isArray(value.vehicles) &&
    value.vehicles.every((v) => v && isNonEmptyString(v.codeMoteur) && isNonEmptyString(v.label))
  );
}

function isValidAccount(value) {
  return value !== null && typeof value === "object" && isNonEmptyString(value.displayName);
}

function isValidOrders(value) {
  return (
    Array.isArray(value) &&
    value.every((o) => o && isNonEmptyString(o.orderNumber) && Array.isArray(o.lines))
  );
}
