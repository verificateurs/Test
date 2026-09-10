export const dynamic = "force-dynamic";
export const metadata = { title: "Éditer un produit" };

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { computePrice } from "@/lib/pricing";
import { EditProductForm } from "./EditProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;

  const [product, brands, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { brand: true, category: true } }),
    db.brand.findMany(),
    db.category.findMany(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Éditer « {product.name} »</h1>
      <EditProductForm
        product={product}
        brands={brands}
        categories={categories}
        initialPriceTTC={computePrice(product.prixAchat)}
      />
    </div>
  );
}
