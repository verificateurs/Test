export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { parseCompatCodes } from "@/lib/compat";
import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const cats = await db.category.findMany({ select: { id: true } });
  return cats.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: cat.label,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const category = await db.category.findUnique({
    where: { id },
    include: { brands: true },
  });
  if (!category) notFound();

  const products = await db.product.findMany({
    where: { categoryId: id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, prixAchat: true, stockQty: true, categoryId: true, compatibilite: true, brand: { select: { name: true } } },
  });

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div className="container" style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-sm)" }}>
        <nav style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          <Link href="/">Accueil</Link>
          {" / "}
          <span style={{ color: "var(--text)" }}>{category.label}</span>
        </nav>
      </div>

      {/* Header catégorie */}
      <div className="container" style={{ paddingBottom: "var(--space-xl)" }}>
        <h1 style={{ marginBottom: "var(--space-sm)" }}>{category.label}</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 600 }}>{category.description}</p>
      </div>

      {/* Marques */}
      {category.brands.length > 0 && (
        <section style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "var(--space-lg) 0", marginBottom: "var(--space-xl)" }}>
          <div className="container">
            <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginRight: "var(--space-sm)" }}>Marques :</span>
              {category.brands.map((b) => (
                <Link key={b.id} href={`/marques/${b.id}`} className="badge badge-compat" style={{ textDecoration: "none" }}>
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grille produits */}
      <div className="container" style={{ paddingBottom: "var(--space-3xl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
          <h2 style={{ fontSize: "var(--text-xl)" }}>{products.length} produit{products.length !== 1 ? "s" : ""}</h2>
        </div>
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              brandName={p.brand.name}
              categoryId={p.categoryId}
              price={computePrice(p.prixAchat)}
              stockQty={p.stockQty}
              compatCodes={parseCompatCodes(p.compatibilite)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
