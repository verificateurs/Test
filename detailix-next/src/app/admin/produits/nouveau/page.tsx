import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";
import { createProductAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau produit", robots: { index: false } };

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } }),
  ]);

  return (
    <div>
      <h1>Nouveau produit</h1>
      <div className="admin-card">
        <ProductForm action={createProductAction} brands={brands} categories={categories} />
      </div>
    </div>
  );
}
