"use client";

import { useActionState } from "react";
import { createPromoAction, type PromoActionState } from "./actions";

const initialState: PromoActionState = { error: null };

export function PromoForm() {
  const [state, formAction, pending] = useActionState(createPromoAction, initialState);

  return (
    <form action={formAction} className="checkout-form">
      <label>
        Code
        <input type="text" name="code" required minLength={3} maxLength={40} style={{ textTransform: "uppercase" }} placeholder="ex. ETE2026" />
      </label>
      <div className="form-row">
        <label>
          Type
          <select name="type" defaultValue="PERCENT">
            <option value="PERCENT">Pourcentage</option>
            <option value="FIXED">Montant fixe (€)</option>
          </select>
        </label>
        <label>
          Valeur
          <input type="number" name="value" required min={0.01} step="0.01" />
        </label>
      </div>
      <label>
        Panier minimum (€)
        <input type="number" name="minSubtotal" min={0} step="0.01" defaultValue={0} />
      </label>
      <label>
        Expire le (facultatif)
        <input type="date" name="expiresAt" />
      </label>
      <div className="form-row">
        <label>
          Livraison offerte
          <input type="checkbox" name="freeShipping" style={{ width: "auto" }} />
        </label>
        <label>
          Actif
          <input type="checkbox" name="active" defaultChecked style={{ width: "auto" }} />
        </label>
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Création…" : "Créer le code promo"}
      </button>
    </form>
  );
}
