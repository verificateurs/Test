export const dynamic = "force-dynamic";
export const metadata = { title: "Nouveau produit" };

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { NewProductForm } from "./NewProductForm";

export default async function NewProductPage() {
  await requireAdmin();

  const [brands, categories] = await Promise.all([
    db.brand.findMany(),
    db.category.findMany(),
  ]);

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Nouveau produit</h1>
      <NewProductForm brands={brands} categories={categories} />
    </div>
  );
}
