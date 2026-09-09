import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { ADMIN_PAGE_SIZE, parsePage, parseSearchQuery } from "@/lib/admin/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { RoleForm } from "./RoleForm";

export const metadata: Metadata = { title: "Utilisateurs", robots: { index: false } };

const ROLE_LABELS: Record<string, string> = { CUSTOMER: "Client", PRO: "Pro", ADMIN: "Admin" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ erreur?: string; page?: string; q?: string }> }) {
  const { erreur, page: rawPage, q: rawQ } = await searchParams;
  const page = parsePage(rawPage);
  const q = parseSearchQuery(rawQ);
  const where = q ? { OR: [{ email: { contains: q } }, { displayName: { contains: q } }] } : {};
  const currentAdmin = await requireAdmin();
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div>
      <h1>Utilisateurs ({total})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <p className="form-hint">
        Un compte « Pro » bénéficie automatiquement de la remise définie dans Réglages, appliquée à la validation
        de commande.
      </p>
      <AdminSearchForm q={q} placeholder="Rechercher un utilisateur…" />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Commandes</th>
            <th>Inscrit le</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.displayName}</td>
              <td>{ROLE_LABELS[u.role] ?? u.role}</td>
              <td>{u._count.orders}</td>
              <td>{u.createdAt.toLocaleDateString("fr-FR")}</td>
              <td>
                <RoleForm userId={u.id} role={u.role} isSelf={u.id === currentAdmin.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AdminPagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/utilisateurs" query={q ? { q } : {}} />
    </div>
  );
}
