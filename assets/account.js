const ACCOUNT_STORAGE_KEY = "detailix_account_v1";
const ORDERS_STORAGE_KEY = "detailix_orders_v1";
const MAX_ORDERS_STORED = 20;

let accountState = null;
let ordersState = [];

function loadAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    accountState = raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Compte : localStorage indisponible.", err);
    accountState = null;
  }
}

function saveAccount(account) {
  accountState = account;
  try {
    if (account) localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
    else localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  } catch (err) {
    console.warn("Compte : impossible d'enregistrer dans localStorage.", err);
  }
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    ordersState = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Historique de commandes : localStorage indisponible.", err);
    ordersState = [];
  }
}

function saveOrders() {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersState));
  } catch (err) {
    console.warn("Historique de commandes : impossible d'enregistrer dans localStorage.", err);
  }
}

function login(displayName) {
  saveAccount({ displayName });
  renderAccountUI();
}

function logout() {
  saveAccount(null);
  renderAccountUI();
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
    total: lines.reduce((sum, line) => sum + line.lineTotal, 0),
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
}
