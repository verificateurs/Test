let searchDebounceTimer = null;

function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q || !brandsData || !productsData) return [];

  const brandResults = brandsData.categories
    .flatMap((cat) => cat.brands.map((b) => ({ ...b, categoryId: cat.id, categoryLabel: cat.label })))
    .filter((b) => b.name.toLowerCase().includes(q) || b.origine.toLowerCase().includes(q))
    .map((b) => ({ type: "brand", id: b.id, name: b.name, meta: b.categoryLabel, categoryId: b.categoryId }));

  const productResults = productsData.products
    .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    .map((p) => {
      const brand = brandsData.categories.flatMap((c) => c.brands).find((b) => b.id === p.brandId);
      return {
        type: "product",
        id: p.id,
        name: p.name,
        meta: brand ? brand.name : "",
        price: formatPrice(computeSellPrice(p.prixAchat)),
      };
    });

  return [...brandResults, ...productResults].slice(0, 8);
}

function renderSearchResults(results, query) {
  const container = document.getElementById("searchResults");
  if (!query.trim()) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  if (results.length === 0) {
    container.innerHTML = '<p class="search-no-results">Aucun résultat.</p>';
    return;
  }
  container.innerHTML = results
    .map(
      (r) => `
      <button type="button" class="search-result-item" data-type="${escapeHtml(r.type)}" data-id="${escapeHtml(r.id)}"${r.categoryId ? ` data-category-id="${escapeHtml(r.categoryId)}"` : ""}>
        <span class="search-result-name">${escapeHtml(r.name)}</span>
        <span class="search-result-meta">${escapeHtml(r.meta)}${r.price ? ` · ${r.price}` : ""}</span>
      </button>`
    )
    .join("");
}

function selectSearchResult(type, id, categoryId) {
  const searchInput = document.getElementById("searchInput");
  const container = document.getElementById("searchResults");
  container.hidden = true;
  searchInput.value = "";

  if (type === "product") {
    openProductDetail(id);
  } else if (type === "brand") {
    selectCategory(categoryId);
    document.getElementById("marques").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      // On compare les dataset plutôt que d'interpoler l'id dans un sélecteur CSS :
      // un id contenant un guillemet ferait échouer (ou détourner) le querySelector.
      const card = [...document.querySelectorAll(".brand-card")].find((el) => el.dataset.brandId === id);
      if (card) {
        card.classList.add("highlight");
        setTimeout(() => card.classList.remove("highlight"), 1500);
      }
    }, 300);
  }
}

function initSearch() {
  const input = document.getElementById("searchInput");
  const container = document.getElementById("searchResults");

  input.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    const query = input.value;
    searchDebounceTimer = setTimeout(() => {
      renderSearchResults(searchCatalog(query), query);
    }, 250);
  });

  container.addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (!item) return;
    selectSearchResult(item.dataset.type, item.dataset.id, item.dataset.categoryId);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) {
      container.hidden = true;
    }
  });
}
