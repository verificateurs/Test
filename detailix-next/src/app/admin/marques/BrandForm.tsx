"use client";

import { useActionState } from "react";
import type { BrandActionState } from "./actions";

type Category = { id: string; label: string };
type Brand = {
  id: string;
  name: string;
  origine: string;
  gamme: string;
  rating: number;
  reviewCount: number;
  recommended: boolean;
  preference: string;
  categoryId: string;
};

const initialState: BrandActionState = { error: null };

export function BrandForm({
  action,
  categories,
  brand,
}: {
  action: (prev: BrandActionState, formData: FormData) => Promise<BrandActionState>;
  categories: Category[];
  brand?: Brand;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="checkout-form">
      {brand && <input type="hidden" name="id" value={brand.id} />}

      <label>
        Nom
        <input type="text" name="name" required maxLength={120} defaultValue={brand?.name} />
      </label>
      <div className="form-row">
        <label>
          Origine
          <input type="text" name="origine" required maxLength={80} defaultValue={brand?.origine} placeholder="ex. France" />
        </label>
        <label>
          Gamme
          <input type="text" name="gamme" required maxLength={80} defaultValue={brand?.gamme} placeholder="ex. Premium" />
        </label>
      </div>
      <div className="form-row">
        <label>
          Note (0-5)
          <input type="number" name="rating" required min={0} max={5} step="0.1" defaultValue={brand?.rating ?? 4.5} />
        </label>
        <label>
          Nombre d&apos;avis
          <input type="number" name="reviewCount" required min={0} step="1" defaultValue={brand?.reviewCount ?? 0} />
        </label>
      </div>
      <label>
        Catégorie
        <select name="categoryId" required defaultValue={brand?.categoryId ?? ""}>
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
      <label>
        Recommandée
        <input type="checkbox" name="recommended" defaultChecked={brand?.recommended} style={{ width: "auto" }} />
      </label>
      <label>
        Texte de préférence (pourquoi cette marque)
        <textarea name="preference" required maxLength={500} rows={3} defaultValue={brand?.preference} />
      </label>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : brand ? "Mettre à jour" : "Créer la marque"}
      </button>
    </form>
  );
}
