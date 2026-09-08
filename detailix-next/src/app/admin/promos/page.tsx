import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PromoForm } from "./PromoForm";
import { togglePromoAction, deletePromoAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";
import { formatPrice } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Codes promo", robots: { index: false } };

export default async function AdminPromosPage() {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1>Codes promo</h1>

      <div className="admin-card">
        <h2>Nouveau code</h2>
        <PromoForm />
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Remise</th>
            <th>Panier min.</th>
            <th>Livraison offerte</th>
            <th>Expire</th>
            <th>Statut</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {promos.map((p) => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.type === "PERCENT" ? `${p.value}%` : formatPrice(p.value)}</td>
              <td>{formatPrice(p.minSubtotal)}</td>
              <td>{p.freeShipping ? "Oui" : "Non"}</td>
              <td>{p.expiresAt ? p.expiresAt.toLocaleDateString("fr-FR") : "—"}</td>
              <td>{p.active ? "Actif" : "Inactif"}</td>
              <td className="admin-actions-row">
                <form action={togglePromoAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="link-button">
                    {p.active ? "Désactiver" : "Activer"}
                  </button>
                </form>
                <ConfirmDeleteForm action={deletePromoAction} hiddenFields={{ id: p.id }} confirmMessage={`Supprimer le code "${p.code}" ?`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
