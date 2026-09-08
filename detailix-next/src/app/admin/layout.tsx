import { requireAdmin } from "@/lib/auth/rbac";
import Link from "next/link";

// Contrôle serveur faisant autorité pour tout /admin/** — voir middleware.ts
// pour le filtre rapide côté Edge (non faisant autorité) qui précède celui-ci.
// Chaque Server Action sous admin/ revérifie en plus requireAdmin() elle-même
// (défense en profondeur : une action reste en principe invocable directement).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-nav-brand">
          <span className="brand-mark-accent">DETAIL</span>IX admin
        </div>
        <nav>
          <Link href="/admin">Tableau de bord</Link>
          <Link href="/admin/produits">Produits</Link>
          <Link href="/admin/marques">Marques</Link>
          <Link href="/admin/categories">Catégories</Link>
          <Link href="/admin/vehicules">Véhicules</Link>
          <Link href="/admin/promos">Codes promo</Link>
          <Link href="/admin/commandes">Commandes</Link>
          <Link href="/admin/utilisateurs">Utilisateurs</Link>
          <Link href="/admin/reglages">Réglages</Link>
          <Link href="/admin/import">Import / export</Link>
        </nav>
        <div className="admin-nav-user">
          Connecté : {admin.displayName}
          <Link href="/">Retour au site</Link>
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
