import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BrandForm } from "../BrandForm";
import { createBrandAction } from "../actions";

export const metadata: Metadata = { title: "Nouvelle marque", robots: { index: false } };

export default async function NewBrandPage() {
  const categories = await prisma.category.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } });

  return (
    <div>
      <h1>Nouvelle marque</h1>
      <div className="admin-card">
        <BrandForm action={createBrandAction} categories={categories} />
      </div>
    </div>
  );
}
