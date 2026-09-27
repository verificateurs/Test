"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";

export default function ConnexionPage() {
  const [state, dispatch, pending] = useActionState(loginAction, null);

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-xl)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ marginBottom: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-2xl)" }}>Connexion</h1>

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
              maxLength={128}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
            style={{ width: "100%", justifyContent: "center", padding: "12px" }}
          >
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p style={{ marginTop: "var(--space-lg)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          <Link href="/mot-de-passe-oublie" style={{ color: "var(--accent)" }}>Mot de passe oublié ?</Link>
        </p>

        <p style={{ marginTop: "var(--space-sm)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/inscription" style={{ color: "var(--accent)" }}>S&apos;inscrire</Link>
        </p>
      </div>
    </div>
  );
}
