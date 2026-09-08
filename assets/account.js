const ACCOUNT_STORAGE_KEY = STORAGE_KEYS.account;
const ORDERS_STORAGE_KEY = STORAGE_KEYS.orders;
const MAX_ORDERS_STORED = 20;

let accountState = null;
let ordersState = [];

function loadAccount() {
  accountState = readStorage(ACCOUNT_STORAGE_KEY, isValidAccount, null);
}

function saveAccount(account) {
  accountState = account;
  if (account) writeStorage(ACCOUNT_STORAGE_KEY, account);
  else removeStorage(ACCOUNT_STORAGE_KEY);
}

function loadOrders() {
  ordersState = readStorage(ORDERS_STORAGE_KEY, isValidOrders, []);
}

function saveOrders() {
  writeStorage(ORDERS_STORAGE_KEY, ordersState);
}

function login(displayName) {
  saveAccount({ displayName });
  renderAccountUI();
}

/**
 * La « connexion » n'est qu'un nom d'affichage : rien ne cloisonne réellement
 * les données entre deux pseudos. L'historique contenant nom et adresse de
 * livraison, on le purge à la déconnexion plutôt que de le laisser visible au
 * pseudo suivant sur le même navigateur.
 */
function logout() {
  saveAccount(null);
  ordersState = [];
  saveOrders();
  renderAccountUI();
  renderOrderHistory();
}

/** Efface panier, garage, compte et commandes, puis recharge la page. */
function eraseAllLocalData() {
  clearAllLocalData();
  window.location.reload();
}

function recordOrder(orderNumber, lines, livraison) {
  const order = {
    orderNumber,
    date: new Date().toISOString(),
    livraison,
    lines: lines.map((line) => ({
      product: { id: line.product.id, name: line.product.name, format: line.product.format },
      qty: line.qty,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      delivery: line.delivery,
    })),
    total: Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100,
  };
  ordersState.push(order);
  if (ordersState.length > MAX_ORDERS_STORED) {
    ordersState = ordersState.slice(-MAX_ORDERS_STORED);
  }
  saveOrders();
  renderOrderHistory();
}

function renderAccountUI() {
  const loginForm = document.getElementById("loginForm");
  const loggedInView = document.getElementById("accountLoggedIn");
  const displayNameEl = document.getElementById("accountDisplayName");
  if (accountState) {
    loginForm.hidden = true;
    loggedInView.hidden = false;
    displayNameEl.textContent = accountState.displayName;
  } else {
    loginForm.hidden = false;
    loggedInView.hidden = true;
  }
  document.getElementById("accountToggle").classList.toggle("has-active", !!accountState);
}

function renderOrderHistory() {
  const container = document.getElementById("orderHistoryList");
  if (ordersState.length === 0) {
    container.innerHTML = '<p class="cart-empty">Aucune commande pour le moment.</p>';
    return;
  }
  container.innerHTML = [...ordersState]
    .reverse()
    .map(
      (order) => `
      <div class="order-history-item">
        <div class="order-history-header">
          <strong>${escapeHtml(order.orderNumber)}</strong>
          <span class="order-history-date">${new Date(order.date).toLocaleDateString("fr-FR")}</span>
          <span class="order-history-total">${formatPrice(order.total)}</span>
        </div>
        <div class="order-history-lines">${renderOrderLines(order.lines, { readOnly: true })}</div>
      </div>`
    )
    .join("");
}

function openAccountPanel() {
  document.getElementById("accountModal").hidden = false;
  requestAnimationFrame(() => document.getElementById("accountModal").classList.add("visible"));
}

function closeAccountPanel() {
  const modal = document.getElementById("accountModal");
  modal.classList.remove("visible");
  setTimeout(() => {
    modal.hidden = true;
  }, 250);
}

function initAccount() {
  loadAccount();
  loadOrders();
  renderAccountUI();
  renderOrderHistory();

  document.getElementById("accountToggle").addEventListener("click", openAccountPanel);
  document.getElementById("accountModalClose").addEventListener("click", closeAccountPanel);

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.displayName.value.trim();
    if (!name) return;
    login(name);
    e.target.reset();
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
  });

  document.getElementById("eraseDataBtn").addEventListener("click", () => {
    const confirmed = window.confirm(
      "Effacer toutes vos données locales (panier, garage, compte, historique de commandes) ? Cette action est irréversible."
    );
    if (confirmed) eraseAllLocalData();
  });
}
