import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../CategoryForm";
import { updateCategoryAction } from "../actions";

export const metadata: Metadata = { title: "Modifier une catégorie", robots: { index: false } };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <h1>Modifier « {category.label} »</h1>
      <div className="admin-card">
        <CategoryForm action={updateCategoryAction} category={category} />
      </div>
    </div>
  );
}
