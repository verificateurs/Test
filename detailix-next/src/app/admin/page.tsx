import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tableau de bord", robots: { index: false } };

export default async function AdminDashboard() {
  const [products, brands, categories, orders, users] = await Promise.all([
    prisma.product.count(),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h1>Tableau de bord</h1>
      <div className="tile-grid">
        <div className="admin-card"><h3>{products}</h3><p>Produits</p></div>
        <div className="admin-card"><h3>{brands}</h3><p>Marques</p></div>
        <div className="admin-card"><h3>{categories}</h3><p>Catégories</p></div>
        <div className="admin-card"><h3>{orders}</h3><p>Commandes</p></div>
        <div className="admin-card"><h3>{users}</h3><p>Comptes clients</p></div>
      </div>
    </div>
  );
}
