"use client";

import { useActionState } from "react";
import { disable2faAction } from "./actions";

export function Disable2faForm() {
  const [state, dispatch, pending] = useActionState(disable2faAction, null);

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-xl)", border: "1px solid var(--border)" }}>
      <h2 style={{ marginBottom: "var(--space-md)", fontSize: "var(--text-xl)" }}>Désactiver la double authentification</h2>
      <p style={{ marginBottom: "var(--space-md)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        Saisissez un code de votre application d&apos;authentification pour confirmer la désactivation.
      </p>

      {state?.error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-md)" }}>
          {state.error}
        </div>
      )}

      <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div className="form-field">
          <label htmlFor="disable-code">Code de vérification</label>
          <input
            id="disable-code"
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

        <button type="submit" className="btn btn-ghost" disabled={pending} style={{ color: "var(--danger)" }}>
          {pending ? "Désactivation…" : "Désactiver la 2FA"}
        </button>
      </form>
    </div>
  );
}
