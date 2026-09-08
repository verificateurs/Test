"use client";

import { useActionState } from "react";
import { updateOrderStatusAction, type OrderActionState } from "../actions";

const initialState: OrderActionState = { error: null };
const STATUSES = [
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payée" },
  { value: "SHIPPED", label: "Expédiée" },
  { value: "CANCELLED", label: "Annulée" },
];

export function StatusForm({ id, status }: { id: string; status: string }) {
  const [state, formAction, pending] = useActionState(updateOrderStatusAction, initialState);

  return (
    <form action={formAction} className="admin-actions-row">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status}>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? "…" : "Mettre à jour"}
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}
