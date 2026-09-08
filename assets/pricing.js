let pricingConfig = null;

function computeSellPrice(prixAchat) {
  const margin = pricingConfig && typeof pricingConfig.marginPercent === "number" ? pricingConfig.marginPercent : 0;
  return Math.round(prixAchat * (1 + margin / 100) * 100) / 100;
}

function formatPrice(amount) {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function deliveryEstimate(product) {
  return product.stock === false
    ? { label: "Sur commande, 5-7 jours", className: "delivery-slow" }
    : { label: "Expédié sous 24h", className: "delivery-fast" };
}
