"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "./actions";

export default function InscriptionPage() {
  const [state, dispatch, pending] = useActionState(registerAction, null);

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-xl)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ marginBottom: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-2xl)" }}>Créer un compte</h1>

        {state?.error && (
          <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
            {state.error}
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

          <div className="form-field">
            <label htmlFor="password">Mot de passe</label>
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
            {pending ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p style={{ marginTop: "var(--space-lg)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          Déjà inscrit ?{" "}
          <Link href="/connexion" style={{ color: "var(--accent)" }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
