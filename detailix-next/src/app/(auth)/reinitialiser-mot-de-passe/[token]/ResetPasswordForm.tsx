"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "../../actions";

const initialState: ResetPasswordState = { error: null, success: false };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="auth-form" data-testid="reset-success">
        <p>Mot de passe mis à jour. Toutes vos sessions précédentes ont été déconnectées.</p>
        <Link href="/connexion" className="btn-primary">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <label>
        Nouveau mot de passe
        <input type="password" name="password" required minLength={10} autoComplete="new-password" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Mise à jour…" : "Choisir ce mot de passe"}
      </button>
    </form>
  );
}
