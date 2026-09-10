"use client";

import { useActionState } from "react";
import { verify2faAction } from "./actions";

export function TwoFactorForm() {
  const [state, dispatch, pending] = useActionState(verify2faAction, null);

  return (
    <>
      {state?.error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
          {state.error}
        </div>
      )}

      <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
        <div className="form-field">
          <label htmlFor="code">Code de vérification</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            placeholder="123456"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending}
          style={{ width: "100%", justifyContent: "center", padding: "12px" }}
        >
          {pending ? "Vérification…" : "Vérifier"}
        </button>
      </form>
    </>
  );
}
