"use client";

import { useActionState } from "react";
import { refundOrderAction, type OrderActionState } from "../actions";

const initialState: OrderActionState = { error: null };

export function RefundForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(refundOrderAction, initialState);

  return (
    <form action={formAction} className="admin-actions-row">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-secondary" disabled={pending}>
        {pending ? "…" : "Rembourser via Stripe"}
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
    </form>
  );
}
