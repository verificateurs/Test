import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { RoleForm } from "./RoleForm";

export const metadata: Metadata = { title: "Utilisateurs", robots: { index: false } };

const ROLE_LABELS: Record<string, string> = { CUSTOMER: "Client", PRO: "Pro", ADMIN: "Admin" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const currentAdmin = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h1>Utilisateurs ({users.length})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <p className="form-hint">
        Un compte « Pro » bénéficie automatiquement de la remise définie dans Réglages, appliquée à la validation
        de commande.
      </p>
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
    </div>
  );
}
