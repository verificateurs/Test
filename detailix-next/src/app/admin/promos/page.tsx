import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, parsePage, parseSearchQuery } from "@/lib/admin/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { PromoForm } from "./PromoForm";
import { togglePromoAction, deletePromoAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";
import { formatPrice } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Codes promo", robots: { index: false } };

export default async function AdminPromosPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page: rawPage, q: rawQ } = await searchParams;
  const page = parsePage(rawPage);
  const q = parseSearchQuery(rawQ);
  const where = q ? { code: { contains: q } } : {};
  const [promos, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.promoCode.count({ where }),
  ]);

  return (
    <div>
      <h1>Codes promo ({total})</h1>

      <div className="admin-card">
        <h2>Nouveau code</h2>
        <PromoForm />
      </div>
      <AdminSearchForm q={q} placeholder="Rechercher un code…" />
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
      <AdminPagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/promos" query={q ? { q } : {}} />
    </div>
  );
}
