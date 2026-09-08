"use client";

import { useActionState } from "react";
import { updateSettingsAction, type SettingsActionState } from "./actions";

const initialState: SettingsActionState = { error: null, success: false };

export function SettingsForm({
  marginPercent,
  freeShippingThreshold,
  proDiscountPercent,
}: {
  marginPercent: number;
  freeShippingThreshold: number;
  proDiscountPercent: number;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);

  return (
    <form action={formAction} className="checkout-form">
      <label>
        Marge globale (%)
        <input type="number" name="marginPercent" required min={0} max={500} step="0.1" defaultValue={marginPercent} />
      </label>
      <label>
        Seuil de livraison offerte (€)
        <input type="number" name="freeShippingThreshold" required min={0} step="0.01" defaultValue={freeShippingThreshold} />
      </label>
      <label>
        Remise espace pro (%)
        <input type="number" name="proDiscountPercent" required min={0} max={90} step="0.1" defaultValue={proDiscountPercent} />
      </label>
      <p className="form-hint">
        Appliquée automatiquement à la validation de commande pour tout compte au rôle « Pro » (voir Utilisateurs).
        Ne s&apos;affiche pas sur les fiches produit (statiques, communes à tous les visiteurs).
      </p>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="admin-flash">Réglages enregistrés.</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
