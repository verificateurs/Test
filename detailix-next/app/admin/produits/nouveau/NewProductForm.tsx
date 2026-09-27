"use client";

import type { Brand, Category } from "@prisma/client";
import { ProductForm } from "../ProductForm";
import { createProductAction } from "../actions";

type Props = {
  brands: Brand[];
  categories: Category[];
};

export function NewProductForm({ brands, categories }: Props) {
  return (
    <ProductForm
      action={createProductAction}
      brands={brands}
      categories={categories}
      idEditable
      submitLabel="Créer"
    />
  );
}
