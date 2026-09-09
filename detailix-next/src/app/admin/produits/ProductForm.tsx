"use client";

import { useActionState, useState } from "react";
import type { ProductActionState } from "./actions";

type Brand = { id: string; name: string };
type Category = { id: string; label: string };

type Product = {
  id: string;
  name: string;
  format: string;
  description: string;
  prixAchat: number;
  stockQty: number;
  homologation: string | null;
  brandId: string;
  categoryId: string;
  compatibiliteType: "universel" | "codesMoteurs";
  compatibiliteCodes: string;
};

const initialState: ProductActionState = { error: null };

export function ProductForm({
  action,
  brands,
  categories,
  product,
}: {
  action: (prev: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  brands: Brand[];
  categories: Category[];
  product?: Product;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [compatType, setCompatType] = useState<"universel" | "codesMoteurs">(product?.compatibiliteType ?? "universel");

  return (
    <form action={formAction} className="checkout-form">
      {product && <input type="hidden" name="id" value={product.id} />}

      <label>
        Nom
        <input type="text" name="name" required maxLength={160} defaultValue={product?.name} />
      </label>
      <label>
        Format
        <input type="text" name="format" required maxLength={80} defaultValue={product?.format} placeholder="ex. 500 ml" />
      </label>
      <label>
        Description
        <textarea name="description" required maxLength={2000} rows={4} defaultValue={product?.description} />
      </label>
      <div className="form-row">
        <label>
          Prix d&apos;achat HT (€)
          <input type="number" name="prixAchat" required min={0.01} step="0.01" defaultValue={product?.prixAchat} />
        </label>
        <label>
          Quantité en stock
          <input type="number" name="stockQty" required min={0} step="1" defaultValue={product?.stockQty ?? 0} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Marque
          <select name="brandId" required defaultValue={product?.brandId ?? ""}>
            <option value="" disabled>
              Choisir…
            </option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Catégorie
          <select name="categoryId" required defaultValue={product?.categoryId ?? ""}>
            <option value="" disabled>
              Choisir…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Compatibilité
        <select name="compatibiliteType" value={compatType} onChange={(e) => setCompatType(e.target.value as "universel" | "codesMoteurs")}>
          <option value="universel">Universel (tous véhicules)</option>
          <option value="codesMoteurs">Codes moteur spécifiques</option>
        </select>
      </label>
      {compatType === "codesMoteurs" && (
        <label>
          Codes moteur compatibles (séparés par des virgules)
          <input type="text" name="compatibiliteCodes" defaultValue={product?.compatibiliteCodes} placeholder="ex. DKR, CZPB" />
        </label>
      )}

      <label>
        Homologation
        <select name="homologation" defaultValue={product?.homologation ?? ""}>
          <option value="">Non applicable</option>
          <option value="route-ouverte">Homologué route ouverte</option>
          <option value="usage-piste">Usage circuit uniquement</option>
        </select>
      </label>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : product ? "Mettre à jour" : "Créer le produit"}
      </button>
    </form>
  );
}
