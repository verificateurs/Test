"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestResetAction } from "./actions";

export default function MotDePasseOubliePage() {
  const [state, dispatch, pending] = useActionState(requestResetAction, null);

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-xl)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ marginBottom: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-2xl)" }}>Mot de passe oublié</h1>

        {state?.message && (
          <div className="alert alert-success" style={{ marginBottom: "var(--space-lg)" }}>
            {state.message}
          </div>
        )}

        <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
          <div className="form-field">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              placeholder="vous@exemple.com"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
            style={{ width: "100%", justifyContent: "center", padding: "12px" }}
          >
            {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
          </button>
        </form>

        <p style={{ marginTop: "var(--space-lg)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          <Link href="/connexion" style={{ color: "var(--accent)" }}>Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
