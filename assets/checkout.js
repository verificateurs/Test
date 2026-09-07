const checkoutState = {
  livraison: null,
};

function goToStep(stepNumber) {
  document.querySelectorAll(".checkout-step").forEach((el) => {
    const isActive = Number(el.dataset.step) === stepNumber;
    el.classList.toggle("active", isActive);
    el.hidden = !isActive;
  });
  document.querySelectorAll(".step").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.step) <= stepNumber);
  });
}

function openCheckout() {
  if (getCartLines().length === 0) return;
  closeCart();
  goToStep(1);
  document.getElementById("checkoutModal").hidden = false;
  requestAnimationFrame(() => document.getElementById("checkoutModal").classList.add("visible"));
}

function closeCheckout() {
  const modal = document.getElementById("checkoutModal");
  modal.classList.remove("visible");
  setTimeout(() => {
    modal.hidden = true;
  }, 250);
}

function submitLivraison(e) {
  e.preventDefault();
  const form = e.target;
  checkoutState.livraison = {
    nom: form.nom.value,
    adresse: form.adresse.value,
    codePostal: form.codePostal.value,
    ville: form.ville.value,
  };
  goToStep(2);
}

function submitPaiement(e) {
  e.preventDefault();
  goToStep(3);
  finalizeOrder();
}

function finalizeOrder() {
  const lines = getCartLines();
  const orderNumber = "AP-" + Date.now().toString(36).toUpperCase();
  document.getElementById("orderNumber").textContent = orderNumber;
  document.getElementById("orderRecap").innerHTML =
    renderOrderLines(lines, { readOnly: true }) +
    `<div class="cart-subtotal-row order-total-row">
      <span>Total payé (simulation)</span>
      <span>${formatPrice(getCartTotal())}</span>
    </div>`;
  clearCart();
}

function resetCheckoutForms() {
  document.getElementById("checkoutStepLivraison").reset();
  document.getElementById("checkoutStepPaiement").reset();
  checkoutState.livraison = null;
}

function initCheckout() {
  document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
  document.getElementById("checkoutClose").addEventListener("click", closeCheckout);
  document.getElementById("checkoutStepLivraison").addEventListener("submit", submitLivraison);
  document.getElementById("checkoutStepPaiement").addEventListener("submit", submitPaiement);
  document.getElementById("checkoutDone").addEventListener("click", () => {
    resetCheckoutForms();
    closeCheckout();
  });
}
