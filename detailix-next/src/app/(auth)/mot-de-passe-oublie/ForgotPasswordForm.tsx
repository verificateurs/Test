"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type ForgotPasswordState } from "../actions";

const initialState: ForgotPasswordState = { submitted: false, error: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.submitted) {
    return (
      <div className="auth-form" data-testid="reset-requested">
        <p>Si un compte existe pour cette adresse, un lien de réinitialisation vient d&apos;être envoyé.</p>
        {/* Note affichée inconditionnellement (que le compte existe ou non) :
            un affichage conditionnel deviendrait lui-même un oracle
            d'énumération de comptes. */}
        <p className="form-hint">
          Mode démonstration : sans configuration email réelle, le lien de réinitialisation est disponible dans les
          logs serveur plutôt que par email.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="auth-form">
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
      </button>
    </form>
  );
}
