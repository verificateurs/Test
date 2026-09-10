"use client";

import type { Brand, Category, Product } from "@/app/generated/prisma/client";
import { ProductForm } from "../ProductForm";
import { updateProductAction } from "../actions";

type Props = {
  product: Product;
  brands: Brand[];
  categories: Category[];
  initialPriceTTC: number;
};

export function EditProductForm({ product, brands, categories, initialPriceTTC }: Props) {
  return (
    <ProductForm
      action={updateProductAction}
      brands={brands}
      categories={categories}
      initialPriceTTC={initialPriceTTC}
      idEditable={false}
      submitLabel="Enregistrer"
      product={{
        id: product.id,
        brandId: product.brandId,
        categoryId: product.categoryId,
        name: product.name,
        format: product.format,
        description: product.description,
        prixAchat: product.prixAchat,
        stockQty: product.stockQty,
        compatibilite: product.compatibilite,
        homologation: product.homologation,
      }}
    />
  );
}
