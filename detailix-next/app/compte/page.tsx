import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { destroySessionAction } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon compte" };

export default async function ComptePage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const { user } = session;

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { items: { select: { qty: true } } },
  });

  return (
    <div className="page-enter" style={{ padding: "var(--space-3xl) 0" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: "var(--space-xl)" }}>Mon compte</h1>

        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-xl)", border: "1px solid var(--border)", marginBottom: "var(--space-lg)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 2 }}>E-mail</div>
              <div>{user.email}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 2 }}>Rôle</div>
              <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
                <span className="badge badge-compat">{user.role}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 2 }}>Membre depuis</div>
              <div>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</div>
            </div>
          </div>
        </div>

        {user.role === "ADMIN" && (
          <Link href="/admin" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-lg)", display: "inline-block" }}>
            Tableau de bord admin →
          </Link>
        )}

        {user.role === "ADMIN" && (
          <Link href="/compte/securite" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-lg)", marginLeft: "var(--space-sm)", display: "inline-block" }}>
            Sécurité →
          </Link>
        )}

        {/* Historique commandes */}
        {orders.length > 0 && (
          <div style={{ marginTop: "var(--space-xl)" }}>
            <h2 style={{ marginBottom: "var(--space-lg)", fontSize: "var(--text-xl)" }}>Mes commandes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/commande/confirmation/${o.id}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-md) var(--space-lg)", background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", textDecoration: "none", color: "var(--text)", transition: "border-color 0.15s" }}
                >
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{o.id.slice(0, 12)}…</div>
                    <div style={{ fontSize: "var(--text-sm)", marginTop: 2 }}>
                      {o.items.reduce((s, i) => s + i.qty, 0)} article(s)
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--accent)" }}>
                      {o.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </div>
                    <span className={`badge ${o.status === "pending" ? "badge-no-stock" : "badge-stock"}`} style={{ fontSize: "var(--text-xs)" }}>
                      {o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "var(--space-xl)" }}>
          <form action={destroySessionAction}>
            <button type="submit" className="btn btn-ghost" style={{ color: "var(--danger)" }}>
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
