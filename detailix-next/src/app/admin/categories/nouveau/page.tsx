import type { Metadata } from "next";
import { CategoryForm } from "../CategoryForm";
import { createCategoryAction } from "../actions";

export const metadata: Metadata = { title: "Nouvelle catégorie", robots: { index: false } };

export default function NewCategoryPage() {
  return (
    <div>
      <h1>Nouvelle catégorie</h1>
      <div className="admin-card">
        <CategoryForm action={createCategoryAction} />
      </div>
    </div>
  );
}
