function starString(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

// Échappe le texte ET les guillemets : la sortie est sûre aussi bien entre
// deux balises que dans une valeur d'attribut (`data-x="${escapeHtml(v)}"`).
// Ne jamais revenir à l'astuce textContent/innerHTML, qui laisse passer " et '.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderReviews(reviews) {
  return reviews
    .map(
      (r) => `
        <div class="review">
          <div class="review-head">
            <strong>${escapeHtml(r.author)}</strong>
            <span class="stars small">${starString(r.rating)}</span>
            <span class="review-date">${escapeHtml(r.date)}</span>
          </div>
          <p>${escapeHtml(r.comment)}</p>
        </div>`
    )
    .join("");
}

/* ---------- Marques ---------- */

let brandsData = null;
let currentCategoryId = null;
const brandFilters = { maxPrice: null, minRating: 0, recommendedOnly: false };

function initBrands(data) {
  brandsData = data;
  const tabsEl = document.getElementById("categoryTabs");
  data.categories.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn" + (i === 0 ? " active" : "");
    btn.textContent = cat.label;
    btn.dataset.catId = cat.id;
    btn.addEventListener("click", () => selectCategory(cat.id));
    tabsEl.appendChild(btn);
  });
  selectCategory(data.categories[0].id);

  document.getElementById("brandGrid").addEventListener("click", (e) => {
    const addBtn = e.target.closest(".btn-add-cart");
    if (addBtn) {
      addToCart(addBtn.dataset.productId, 1);
      return;
    }
    const card = e.target.closest(".product-card");
    if (card) openProductDetail(card.dataset.productId);
  });
}

function brandMatchesFilters(brand) {
  if (brand.rating < brandFilters.minRating) return false;
  if (brandFilters.recommendedOnly && !brand.recommended) return false;
  if (brandFilters.maxPrice != null) {
    const products = productsForBrand(brand.id);
    const hasAffordable = products.some((p) => computeSellPrice(p.prixAchat) <= brandFilters.maxPrice);
    if (products.length > 0 && !hasAffordable) return false;
  }
  return true;
}

function renderBrandGrid(catId) {
  const cat = brandsData.categories.find((c) => c.id === catId);
  const gridEl = document.getElementById("brandGrid");
  const filtered = cat.brands.filter(brandMatchesFilters);
  gridEl.innerHTML = filtered.length
    ? filtered.map(renderBrandCard).join("")
    : '<p class="empty-state">Aucune marque ne correspond aux filtres sélectionnés.</p>';
}

function selectCategory(catId) {
  currentCategoryId = catId;
  document.querySelectorAll("#categoryTabs .tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.catId === catId);
  });

  const cat = brandsData.categories.find((c) => c.id === catId);
  document.getElementById("categoryDesc").textContent = cat.description;

  renderBrandGrid(catId);
}

function initBrandFilters() {
  const maxPriceInput = document.getElementById("filterMaxPrice");
  const maxPriceValue = document.getElementById("filterMaxPriceValue");
  const minRatingSelect = document.getElementById("filterMinRating");
  const recommendedCheckbox = document.getElementById("filterRecommended");
  const resetBtn = document.getElementById("filterReset");

  const allPrices = productsData ? productsData.products.map((p) => computeSellPrice(p.prixAchat)) : [];
  const maxPossible = allPrices.length ? Math.ceil(Math.max(...allPrices) / 10) * 10 : 1500;
  maxPriceInput.max = String(maxPossible);
  maxPriceInput.value = String(maxPossible);
  brandFilters.maxPrice = maxPossible;
  maxPriceValue.textContent = formatPrice(maxPossible);

  maxPriceInput.addEventListener("input", () => {
    brandFilters.maxPrice = Number(maxPriceInput.value);
    maxPriceValue.textContent = formatPrice(brandFilters.maxPrice);
    renderBrandGrid(currentCategoryId);
  });

  minRatingSelect.addEventListener("change", () => {
    brandFilters.minRating = Number(minRatingSelect.value);
    renderBrandGrid(currentCategoryId);
  });

  recommendedCheckbox.addEventListener("change", () => {
    brandFilters.recommendedOnly = recommendedCheckbox.checked;
    renderBrandGrid(currentCategoryId);
  });

  resetBtn.addEventListener("click", () => {
    maxPriceInput.value = String(maxPossible);
    brandFilters.maxPrice = maxPossible;
    maxPriceValue.textContent = formatPrice(maxPossible);
    minRatingSelect.value = "0";
    brandFilters.minRating = 0;
    recommendedCheckbox.checked = false;
    brandFilters.recommendedOnly = false;
    renderBrandGrid(currentCategoryId);
  });
}

function productsForBrand(brandId) {
  if (!productsData) return [];
  return productsData.products.filter((p) => p.brandId === brandId);
}

const COMPATIBILITY_LABELS = {
  universel: { label: "Universel", className: "compat-universel" },
  compatible: { label: "Compatible avec votre véhicule", className: "compat-compatible" },
  incompatible: { label: "Non compatible", className: "compat-incompatible" },
  "a-verifier": { label: "Compatibilité à vérifier", className: "compat-a-verifier" },
};

function compatibilityStatus(product) {
  if (product.compatibilite === "universel") return "universel";
  // Donnée absente ou mal formée (catalogue édité à la main / import partiel) :
  // on n'affirme rien plutôt que de planter le rendu de toute la grille.
  const codes = product.compatibilite && product.compatibilite.codes;
  if (!Array.isArray(codes)) return "a-verifier";
  const activeVehicle = typeof getActiveVehicle === "function" ? getActiveVehicle() : null;
  if (!activeVehicle) return "a-verifier";
  return codes.includes(activeVehicle.codeMoteur) ? "compatible" : "incompatible";
}

function renderCompatibilityBadge(product) {
  const status = COMPATIBILITY_LABELS[compatibilityStatus(product)];
  return `<span class="compat-badge ${status.className}">${escapeHtml(status.label)}</span>`;
}

function renderProductCard(product) {
  const price = computeSellPrice(product.prixAchat);
  const outOfStock = product.stock === false;
  const delivery = deliveryEstimate(product);
  return `
    <div class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="product-info">
        <span class="product-name">${escapeHtml(product.name)}</span>
        <span class="product-format">${escapeHtml(product.format)}</span>
        <span class="delivery-badge ${delivery.className}">${escapeHtml(delivery.label)}</span>
        ${renderCompatibilityBadge(product)}
      </div>
      <div class="product-buy">
        <span class="product-price">${formatPrice(price)}</span>
        ${
          outOfStock
            ? '<span class="out-of-stock">Rupture de stock</span>'
            : `<button type="button" class="btn-add-cart" data-product-id="${escapeHtml(product.id)}">Ajouter</button>`
        }
      </div>
    </div>`;
}

function findProductInCatalog(productId) {
  if (!productsData) return null;
  return productsData.products.find((p) => p.id === productId) || null;
}

function renderProductDetail(product) {
  const brand = brandsData
    ? brandsData.categories.flatMap((c) => c.brands).find((b) => b.id === product.brandId)
    : null;
  const price = computeSellPrice(product.prixAchat);
  const outOfStock = product.stock === false;
  const delivery = deliveryEstimate(product);
  return `
    <p class="product-detail-brand">${brand ? escapeHtml(brand.name) : ""}</p>
    <h3>${escapeHtml(product.name)}</h3>
    <p class="product-format">${escapeHtml(product.format)}</p>
    <p class="product-detail-description">${escapeHtml(product.description)}</p>
    <div class="product-detail-badges">
      <span class="delivery-badge ${delivery.className}">${escapeHtml(delivery.label)}</span>
      ${renderCompatibilityBadge(product)}
    </div>
    <div class="product-detail-buy">
      <span class="product-detail-price">${formatPrice(price)}</span>
      ${
        outOfStock
          ? '<span class="out-of-stock">Rupture de stock</span>'
          : `<button type="button" class="btn-primary btn-add-cart" data-product-id="${escapeHtml(product.id)}">Ajouter au panier</button>`
      }
    </div>`;
}

function openProductDetail(productId) {
  const product = findProductInCatalog(productId);
  if (!product) return;
  document.getElementById("productModalBody").innerHTML = renderProductDetail(product);
  document.getElementById("productModal").hidden = false;
  requestAnimationFrame(() => document.getElementById("productModal").classList.add("visible"));
}

function closeProductDetail() {
  const modal = document.getElementById("productModal");
  modal.classList.remove("visible");
  setTimeout(() => {
    modal.hidden = true;
  }, 250);
}

function initProductModal() {
  document.getElementById("productModalClose").addEventListener("click", closeProductDetail);
  document.getElementById("productModal").addEventListener("click", (e) => {
    if (e.target.id === "productModal") closeProductDetail();
  });
  document.getElementById("productModalBody").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-add-cart");
    if (btn) addToCart(btn.dataset.productId, 1);
  });
}

function renderBrandCard(brand) {
  const products = productsForBrand(brand.id);
  return `
    <article class="brand-card" data-brand-id="${escapeHtml(brand.id)}">
      <div class="brand-card-header">
        <h3>${escapeHtml(brand.name)}</h3>
        ${brand.recommended ? '<span class="badge">Recommandé</span>' : ""}
      </div>
      <div class="brand-meta">${escapeHtml(brand.origine)} · ${escapeHtml(brand.gamme)}</div>
      <div class="rating-row">
        <span class="stars">${starString(brand.rating)}</span>
        <span class="rating-value">${brand.rating.toFixed(1)}</span>
        <span class="review-count">(${brand.reviewCount} avis)</span>
      </div>
      <p class="preference">${escapeHtml(brand.preference)}</p>
      ${products.length ? `<div class="product-list">${products.map(renderProductCard).join("")}</div>` : ""}
      <div class="reviews">${renderReviews(brand.reviews)}</div>
    </article>`;
}

/* ---------- Préparateurs ---------- */

let prepData = null;

function initPreparateurs(data) {
  prepData = data;
  const tabsEl = document.getElementById("reseauTabs");
  data.reseaux.forEach((reseau, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn" + (i === 0 ? " active" : "");
    btn.textContent = reseau.name;
    btn.dataset.reseauId = reseau.id;
    btn.addEventListener("click", () => selectReseau(reseau.id));
    tabsEl.appendChild(btn);
  });
  selectReseau(data.reseaux[0].id);
}

function selectReseau(reseauId) {
  document.querySelectorAll("#reseauTabs .tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.reseauId === reseauId);
  });

  const reseau = prepData.reseaux.find((r) => r.id === reseauId);
  document.getElementById("reseauDesc").textContent = reseau.description;

  const citySelect = document.getElementById("citySelect");
  citySelect.innerHTML = reseau.centres
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.ville)}</option>`)
    .join("");
  citySelect.onchange = () => renderCentre(reseauId, citySelect.value);

  renderCentre(reseauId, reseau.centres[0].id);
}

function renderCentre(reseauId, centreId) {
  const reseau = prepData.reseaux.find((r) => r.id === reseauId);
  const centre = reseau.centres.find((c) => c.id === centreId);
  const el = document.getElementById("centreCard");
  el.innerHTML = `
    <div class="centre-header">
      <h3>${escapeHtml(reseau.name)} — ${escapeHtml(centre.ville)}</h3>
      <div class="rating-row">
        <span class="stars">${starString(centre.rating)}</span>
        <span class="rating-value">${centre.rating.toFixed(1)}</span>
        <span class="review-count">(${centre.reviewCount} avis)</span>
      </div>
    </div>
    <div class="reviews">${renderReviews(centre.reviews)}</div>`;
}

/* ---------- Produits & panier (données) ---------- */

let productsData = null;

/* ---------- Effets visuels ---------- */

function initScrollEffects() {
  const header = document.querySelector(".site-header");
  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 8);
    },
    { passive: true }
  );

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));
}

/* ---------- Bootstrap ---------- */

async function loadData() {
  const [brandsRes, prepRes, productsRes, pricingRes, vehiclesRes] = await Promise.all([
    fetch("data/brands.json"),
    fetch("data/preparateurs.json"),
    fetch("data/products.json"),
    fetch("data/pricing-config.json"),
    fetch("data/vehicles.json"),
  ]);
  pricingConfig = await pricingRes.json();
  productsData = await productsRes.json();
  initGarage(await vehiclesRes.json());
  window.addEventListener("garage:changed", () => {
    if (currentCategoryId) renderBrandGrid(currentCategoryId);
  });
  initBrands(await brandsRes.json());
  initBrandFilters();
  initPreparateurs(await prepRes.json());
  initCart();
  initCheckout();
  initAccount();
  initProductModal();
  initSearch();
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollEffects();
  loadData().catch((err) => {
    console.error("Erreur de chargement des données :", err);
  });
});
