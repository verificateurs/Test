"use client";

import { useActionState } from "react";
import { createMakeAction, createModelAction, createMotorisationAction, type VehicleActionState } from "./actions";

const initialState: VehicleActionState = { error: null };

export function AddMakeForm() {
  const [state, formAction, pending] = useActionState(createMakeAction, initialState);
  return (
    <form action={formAction} className="admin-actions-row">
      <input type="text" name="name" required placeholder="Nouvelle marque véhicule (ex. Audi)" maxLength={120} />
      <button type="submit" className="btn-secondary" disabled={pending}>
        Ajouter
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}

export function AddModelForm({ makeId }: { makeId: string }) {
  const [state, formAction, pending] = useActionState(createModelAction, initialState);
  return (
    <form action={formAction} className="admin-actions-row">
      <input type="hidden" name="makeId" value={makeId} />
      <input type="text" name="name" required placeholder="Nouveau modèle (ex. A3 8Y)" maxLength={120} />
      <button type="submit" className="btn-secondary" disabled={pending}>
        Ajouter
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}

export function AddMotorisationForm({ modelId }: { modelId: string }) {
  const [state, formAction, pending] = useActionState(createMotorisationAction, initialState);
  return (
    <form action={formAction} className="admin-actions-row">
      <input type="hidden" name="modelId" value={modelId} />
      <input type="text" name="label" required placeholder="Libellé (ex. 2.0 TDI 150)" maxLength={120} />
      <input type="text" name="codeMoteur" required placeholder="Code moteur (ex. DKR)" maxLength={40} />
      <button type="submit" className="btn-secondary" disabled={pending}>
        Ajouter
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}
