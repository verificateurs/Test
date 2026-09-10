import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s — Admin Detailix", default: "Admin Detailix" },
  robots: { index: false, follow: false },
};

const NAV_LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/marques", label: "Marques" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/promos", label: "Promos" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // Every admin page behind this layout requires ADMIN role

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <Link href="/" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>← Retour au site</Link>
          <div style={{ marginTop: "var(--space-sm)", fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--accent)", fontSize: "var(--text-lg)" }}>
            Admin
          </div>
        </div>
        <nav className="admin-nav">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ padding: "var(--space-sm) var(--space-lg)", fontSize: "var(--text-sm)", color: "var(--text-muted)", borderLeft: "2px solid transparent", transition: "all 0.15s" }}
              className="admin-nav-link"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="admin-main" style={{ overflowX: "auto" }}>
        {children}
      </main>
    </div>
  );
}
