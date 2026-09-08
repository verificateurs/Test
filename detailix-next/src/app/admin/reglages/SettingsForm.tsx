"use client";

import { useActionState } from "react";
import { updateSettingsAction, type SettingsActionState } from "./actions";

const initialState: SettingsActionState = { error: null, success: false };

export function SettingsForm({ marginPercent, freeShippingThreshold }: { marginPercent: number; freeShippingThreshold: number }) {
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
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="admin-flash">Réglages enregistrés.</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
