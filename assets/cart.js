const CART_STORAGE_KEY = STORAGE_KEYS.cart;
const MAX_QTY_PER_LINE = 99;

let cartItems = [];

function loadCart() {
  cartItems = readStorage(CART_STORAGE_KEY, isValidCart, []);
  pruneOrphanCartItems();
}

/**
 * Retire les lignes dont le produit n'existe plus au catalogue.
 * Sans ça elles disparaissent de l'affichage mais restent indéfiniment stockées.
 */
function pruneOrphanCartItems() {
  const before = cartItems.length;
  cartItems = cartItems.filter((item) => findProductById(item.productId) !== null);
  if (cartItems.length !== before) saveCart();
}

function saveCart() {
  writeStorage(CART_STORAGE_KEY, cartItems);
}

function findProductById(productId) {
  if (!productsData) return null;
  return productsData.products.find((p) => p.id === productId) || null;
}

function addToCart(productId, qty = 1) {
  const product = findProductById(productId);
  if (!product || product.stock === false) return;

  const existing = cartItems.find((item) => item.productId === productId);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, MAX_QTY_PER_LINE);
  } else {
    cartItems.push({ productId, qty: Math.min(qty, MAX_QTY_PER_LINE) });
  }
  saveCart();
  renderCartBadge();
  if (document.getElementById("cartDrawer").classList.contains("open")) {
    renderCartDrawer();
  }
  showToast(`${product.name} ajouté au panier`);
  pulseCartBadge();
}

function removeFromCart(productId) {
  cartItems = cartItems.filter((item) => item.productId !== productId);
  saveCart();
  renderCartBadge();
  renderCartDrawer();
}

function updateQty(productId, qty) {
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  const item = cartItems.find((i) => i.productId === productId);
  if (item) {
    item.qty = Math.min(qty, MAX_QTY_PER_LINE);
    saveCart();
    renderCartBadge();
    renderCartDrawer();
  }
}

function clearCart() {
  cartItems = [];
  saveCart();
  renderCartBadge();
  renderCartDrawer();
}

function getCartLines() {
  return cartItems
    .map((item) => {
      const product = findProductById(item.productId);
      if (!product) return null;
      const unitPrice = computeSellPrice(product.prixAchat);
      return {
        product,
        qty: item.qty,
        unitPrice,
        lineTotal: Math.round(unitPrice * item.qty * 100) / 100,
        delivery: deliveryEstimate(product),
      };
    })
    .filter(Boolean);
}

function getCartTotal() {
  return Math.round(getCartLines().reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
}

function getCartCount() {
  return cartItems.reduce((sum, item) => sum + item.qty, 0);
}

function renderCartBadge() {
  const countEl = document.getElementById("cartCount");
  const count = getCartCount();
  countEl.textContent = String(count);
  countEl.hidden = count === 0;
}

function pulseCartBadge() {
  const countEl = document.getElementById("cartCount");
  countEl.classList.remove("pulse");
  void countEl.offsetWidth;
  countEl.classList.add("pulse");
}

function renderOrderLines(lines, options = {}) {
  const readOnly = options.readOnly === true;
  if (lines.length === 0) {
    return '<p class="cart-empty">Votre panier est vide.</p>';
  }
  return lines
    .map(
      (line) => `
      <div class="cart-line${readOnly ? " cart-line-readonly" : ""}" data-product-id="${escapeHtml(line.product.id)}">
        <div class="cart-line-info">
          <span class="cart-line-name">${escapeHtml(line.product.name)}</span>
          <span class="cart-line-format">${escapeHtml(line.product.format)} · x${line.qty}</span>
          ${line.delivery ? `<span class="delivery-badge ${line.delivery.className}">${escapeHtml(line.delivery.label)}</span>` : ""}
        </div>
        ${
          readOnly
            ? ""
            : `<div class="cart-line-qty">
          <button type="button" class="qty-btn" data-action="decrement" aria-label="Diminuer la quantité">−</button>
          <span class="qty-value">${line.qty}</span>
          <button type="button" class="qty-btn" data-action="increment" aria-label="Augmenter la quantité">+</button>
        </div>`
        }
        <div class="cart-line-total">${formatPrice(line.lineTotal)}</div>
        ${readOnly ? "" : '<button type="button" class="cart-line-remove" data-action="remove" aria-label="Retirer du panier">✕</button>'}
      </div>`
    )
    .join("");
}

function renderCartDrawer() {
  const lines = getCartLines();
  document.getElementById("cartItems").innerHTML = renderOrderLines(lines);
  document.getElementById("cartSubtotal").textContent = formatPrice(getCartTotal());
  const checkoutBtn = document.getElementById("checkoutBtn");
  checkoutBtn.disabled = lines.length === 0;
}

function openCart() {
  renderCartDrawer();
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").hidden = false;
  requestAnimationFrame(() => document.getElementById("cartOverlay").classList.add("visible"));
}

function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  const overlay = document.getElementById("cartOverlay");
  overlay.classList.remove("visible");
  setTimeout(() => {
    if (!document.getElementById("cartDrawer").classList.contains("open")) {
      overlay.hidden = true;
    }
  }, 250);
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function initCart() {
  loadCart();
  renderCartBadge();

  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);

  document.getElementById("cartItems").addEventListener("click", (e) => {
    const line = e.target.closest(".cart-line");
    if (!line) return;
    const productId = line.dataset.productId;
    const action = e.target.dataset.action;
    if (action === "increment") {
      const item = cartItems.find((i) => i.productId === productId);
      updateQty(productId, (item ? item.qty : 0) + 1);
    } else if (action === "decrement") {
      const item = cartItems.find((i) => i.productId === productId);
      updateQty(productId, (item ? item.qty : 0) - 1);
    } else if (action === "remove") {
      removeFromCart(productId);
    }
  });
}
