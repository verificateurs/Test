"use client";

import { useActionState } from "react";
import type { Homologation } from "@/app/generated/prisma/client";

type Brand = { id: string; name: string };
type Category = { id: string; label: string };

type ProductData = {
  id: string;
  brandId: string;
  categoryId: string;
  name: string;
  format: string;
  description: string;
  prixAchat: number;
  stockQty: number;
  compatibilite: string;
  homologation: Homologation | null;
};

type FormState = { error?: string; success?: string } | null;

type Props = {
  action: (prevState: FormState, fd: FormData) => Promise<FormState>;
  brands: Brand[];
  categories: Category[];
  initialPriceTTC?: number;
  product?: ProductData;
  idEditable: boolean;
  submitLabel: string;
};

const HOMOLOGATION_LABELS: Record<Homologation, string> = {
  route_ouverte: "Route ouverte",
  usage_piste: "Usage piste uniquement",
  non_applicable: "Non applicable",
};

export function ProductForm({ action, brands, categories, initialPriceTTC, product, idEditable, submitLabel }: Props) {
  const [state, dispatch, pending] = useActionState(action, null);

  return (
    <div>
      {state?.error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="alert alert-success" style={{ marginBottom: "var(--space-lg)" }}>
          {state.success}
        </div>
      )}

      <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)", maxWidth: 560 }}>
        <div className="form-field">
          <label htmlFor="id">Identifiant</label>
          {idEditable ? (
            <input
              id="id"
              name="id"
              type="text"
              required
              maxLength={100}
              pattern="^[a-z0-9-]+$"
              title="Lettres minuscules, chiffres et tirets uniquement (ex : huile-moteur-5w30)"
              placeholder="huile-moteur-5w30"
            />
          ) : (
            <input id="id" name="id" type="text" readOnly value={product?.id} style={{ color: "var(--text-muted)", cursor: "not-allowed" }} />
          )}
        </div>

        <div className="form-field">
          <label htmlFor="brandId">Marque</label>
          <select id="brandId" name="brandId" required defaultValue={product?.brandId ?? ""}>
            <option value="" disabled>Sélectionner une marque</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="categoryId">Catégorie</label>
          <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ""}>
            <option value="" disabled>Sélectionner une catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="name">Nom</label>
          <input id="name" name="name" type="text" required maxLength={200} defaultValue={product?.name} />
        </div>

        <div className="form-field">
          <label htmlFor="format">Format</label>
          <input id="format" name="format" type="text" required maxLength={100} defaultValue={product?.format} placeholder="ex : 5 L" />
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" required maxLength={1000} rows={4} defaultValue={product?.description} />
        </div>

        <div className="form-field">
          <label htmlFor="prixAchat">Prix d&apos;achat (HT)</label>
          <input
            id="prixAchat"
            name="prixAchat"
            type="number"
            step="0.01"
            min="0.01"
            max="100000"
            required
            defaultValue={product?.prixAchat}
          />
          {initialPriceTTC !== undefined && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              Aperçu prix TTC (au chargement) : {initialPriceTTC.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              {" — recalculé après enregistrement"}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="stockQty">Stock</label>
          <input
            id="stockQty"
            name="stockQty"
            type="number"
            step="1"
            min={0}
            max={9999}
            required
            defaultValue={product?.stockQty ?? 10}
          />
        </div>

        <div className="form-field">
          <label htmlFor="compatibilite">Compatibilité (JSON)</label>
          <textarea
            id="compatibilite"
            name="compatibilite"
            required
            rows={3}
            defaultValue={product?.compatibilite ?? '"universel"'}
            placeholder='"universel" ou {"type":"codesMoteurs","codes":["ABC","DEF"]}'
          />
        </div>

        <div className="form-field">
          <label htmlFor="homologation">Homologation</label>
          <select id="homologation" name="homologation" required defaultValue={product?.homologation ?? "non_applicable"}>
            {(Object.keys(HOMOLOGATION_LABELS) as Homologation[]).map((h) => (
              <option key={h} value={h}>{HOMOLOGATION_LABELS[h]}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={pending} style={{ justifyContent: "center", padding: "12px" }}>
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
