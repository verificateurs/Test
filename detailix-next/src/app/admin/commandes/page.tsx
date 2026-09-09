import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/catalogue";
import { ADMIN_PAGE_SIZE, clampPage, parsePage, parseSearchQuery } from "@/lib/admin/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";

export const metadata: Metadata = { title: "Commandes", robots: { index: false } };

const STATUS_LABELS: Record<string, string> = { PENDING: "En attente", PAID: "Payée", SHIPPED: "Expédiée", CANCELLED: "Annulée", REFUNDED: "Remboursée" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page: rawPage, q: rawQ } = await searchParams;
  const requestedPage = parsePage(rawPage);
  const q = parseSearchQuery(rawQ);
  const where = q ? { OR: [{ reference: { contains: q } }, { email: { contains: q } }] } : {};
  const total = await prisma.order.count({ where });
  const page = clampPage(requestedPage, total, ADMIN_PAGE_SIZE);
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
  });

  return (
    <div>
      <h1>Commandes ({total})</h1>
      <AdminSearchForm q={q} placeholder="Rechercher par référence ou email…" />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Date</th>
            <th>Client</th>
            <th>Total</th>
            <th>Statut</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.reference}</td>
              <td>{o.createdAt.toLocaleString("fr-FR")}</td>
              <td>{o.email}</td>
              <td>{formatPrice(o.total)}</td>
              <td>{STATUS_LABELS[o.status] ?? o.status}</td>
              <td>
                <Link href={`/admin/commandes/${o.id}`}>Voir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AdminPagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/commandes" query={q ? { q } : {}} />
    </div>
  );
}
