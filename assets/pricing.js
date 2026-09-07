let pricingConfig = null;

function computeSellPrice(prixAchat) {
  const margin = pricingConfig && typeof pricingConfig.marginPercent === "number" ? pricingConfig.marginPercent : 0;
  return Math.round(prixAchat * (1 + margin / 100) * 100) / 100;
}

function formatPrice(amount) {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
