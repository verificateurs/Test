import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BrandForm } from "../BrandForm";
import { updateBrandAction } from "../actions";

export const metadata: Metadata = { title: "Modifier une marque", robots: { index: false } };

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [brand, categories] = await Promise.all([
    prisma.brand.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } }),
  ]);
  if (!brand) notFound();

  return (
    <div>
      <h1>Modifier « {brand.name} »</h1>
      <div className="admin-card">
        <BrandForm action={updateBrandAction} categories={categories} brand={brand} />
      </div>
    </div>
  );
}
