"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export function SignupForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="auth-form">
      {next && <input type="hidden" name="next" value={next} />}
      <label>
        Nom d&apos;affichage
        <input
          type="text"
          name="displayName"
          required
          maxLength={80}
          autoComplete="name"
          defaultValue={state.values?.displayName ?? ""}
        />
      </label>
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" defaultValue={state.values?.email ?? ""} />
      </label>
      <label>
        Mot de passe
        <input type="password" name="password" required minLength={10} autoComplete="new-password" />
      </label>
      <p className="form-hint">10 caractères minimum.</p>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <p className="auth-switch">
        Déjà un compte ? <Link href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"}>Se connecter</Link>
      </p>
    </form>
  );
}
