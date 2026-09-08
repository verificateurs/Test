import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseCompatibilite } from "@/lib/catalogue";
import { ProductForm } from "../ProductForm";
import { updateProductAction } from "../actions";

export const metadata: Metadata = { title: "Modifier un produit", robots: { index: false } };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } }),
  ]);
  if (!product) notFound();

  const compat = parseCompatibilite(product.compatibilite);

  return (
    <div>
      <h1>Modifier « {product.name} »</h1>
      <div className="admin-card">
        <ProductForm
          action={updateProductAction}
          brands={brands}
          categories={categories}
          product={{
            ...product,
            compatibiliteType: compat === "universel" ? "universel" : "codesMoteurs",
            compatibiliteCodes: compat === "universel" ? "" : compat.codes.join(", "),
          }}
        />
      </div>
    </div>
  );
}
