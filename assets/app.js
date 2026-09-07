function starString(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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
    const btn = e.target.closest(".btn-add-cart");
    if (btn) addToCart(btn.dataset.productId, 1);
  });
}

function selectCategory(catId) {
  document.querySelectorAll("#categoryTabs .tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.catId === catId);
  });

  const cat = brandsData.categories.find((c) => c.id === catId);
  document.getElementById("categoryDesc").textContent = cat.description;

  const gridEl = document.getElementById("brandGrid");
  gridEl.innerHTML = cat.brands.map(renderBrandCard).join("");
}

function productsForBrand(brandId) {
  if (!productsData) return [];
  return productsData.products.filter((p) => p.brandId === brandId);
}

function renderProductCard(product) {
  const price = computeSellPrice(product.prixAchat);
  const outOfStock = product.stock === false;
  return `
    <div class="product-card">
      <div class="product-info">
        <span class="product-name">${escapeHtml(product.name)}</span>
        <span class="product-format">${escapeHtml(product.format)}</span>
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

function renderBrandCard(brand) {
  const products = productsForBrand(brand.id);
  return `
    <article class="brand-card">
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
    .map((c) => `<option value="${c.id}">${escapeHtml(c.ville)}</option>`)
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
  const [brandsRes, prepRes, productsRes, pricingRes] = await Promise.all([
    fetch("data/brands.json"),
    fetch("data/preparateurs.json"),
    fetch("data/products.json"),
    fetch("data/pricing-config.json"),
  ]);
  pricingConfig = await pricingRes.json();
  productsData = await productsRes.json();
  initBrands(await brandsRes.json());
  initPreparateurs(await prepRes.json());
  initCart();
  initCheckout();
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollEffects();
  loadData().catch((err) => {
    console.error("Erreur de chargement des données :", err);
  });
});
