"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "./actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, dispatch, pending] = useActionState(resetPasswordAction, null);

  return (
    <>
      {state?.error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
          {state.error}
        </div>
      )}

      <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
        <input type="hidden" name="token" value={token} />

        <div className="form-field">
          <label htmlFor="password">Nouveau mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            placeholder="12 car. min, 1 majuscule, 1 chiffre"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending}
          style={{ width: "100%", justifyContent: "center", padding: "12px" }}
        >
          {pending ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </>
  );
}
