import "server-only";
import { Resend } from "resend";
import { absoluteUrl } from "@/lib/site";
import type { Order, OrderLine } from "@/generated/prisma/client";

/**
 * Emails transactionnels via Resend, strictement best-effort : sans
 * RESEND_API_KEY (mode démo/dev), on log et on continue — un email qui ne
 * part pas ne doit jamais faire échouer une commande déjà enregistrée en
 * base. Toute erreur Resend est aussi avalée pour la même raison.
 */
function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export async function sendOrderConfirmationEmail(order: Order & { lines: OrderLine[] }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY absent — email de confirmation non envoyé pour ${order.reference}.`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL ?? "commandes@detailix.fr";
    const linesHtml = order.lines
      .map((l) => `<tr><td>${l.qty} × ${l.name} (${l.format})</td><td style="text-align:right">${formatPrice(l.lineTotal)}</td></tr>`)
      .join("");

    await resend.emails.send({
      from,
      to: order.email,
      subject: `Confirmation de commande ${order.reference}`,
      html: `
        <h1>Merci pour votre commande</h1>
        <p>Référence : <strong>${order.reference}</strong></p>
        <table style="width:100%;border-collapse:collapse">${linesHtml}</table>
        <p>Sous-total : ${formatPrice(order.subtotal)}<br/>
        Livraison : ${order.shippingCost === 0 ? "Offerte" : formatPrice(order.shippingCost)}<br/>
        ${order.discount > 0 ? `Remise : -${formatPrice(order.discount)}<br/>` : ""}
        <strong>Total : ${formatPrice(order.total)}</strong></p>
        <p>Livraison à : ${order.shippingName}, ${order.shippingAddr}, ${order.shippingZip} ${order.shippingCity}</p>
        <p><a href="${absoluteUrl(`/commande/confirmation/${order.reference}`)}">Voir ma commande</a></p>
      `,
    });
  } catch (err) {
    console.error(`[email] Échec d'envoi pour la commande ${order.reference} :`, err);
  }
}
