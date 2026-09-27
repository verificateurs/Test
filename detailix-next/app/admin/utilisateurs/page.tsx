import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { updateUserRoleAction } from "./actions";
import { RoleSelect } from "./RoleSelect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Utilisateurs" };

export default async function AdminUsers() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Utilisateurs ({users.length})</h1>

      <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Rôle</th>
            <th>Commandes</th>
            <th>Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ fontWeight: 500 }}>{u.email}</td>
              <td>
                <RoleSelect userId={u.id} role={u.role} action={updateUserRoleAction} />
              </td>
              <td style={{ color: "var(--text-muted)" }}>{u._count.orders}</td>
              <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {u.createdAt.toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
