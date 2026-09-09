"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="auth-form">
      {next && <input type="hidden" name="next" value={next} />}
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" defaultValue={state.values?.email ?? ""} />
      </label>
      <label>
        Mot de passe
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <p className="auth-switch">
        <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
      </p>
      <p className="auth-switch">
        Pas de compte ? <Link href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"}>Créer un compte</Link>
      </p>
    </form>
  );
}
