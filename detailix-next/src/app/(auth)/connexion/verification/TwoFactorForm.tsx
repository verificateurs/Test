"use client";

import { useActionState } from "react";
import { verifyTwoFactorAction, type TwoFactorState } from "../../actions";

const initialState: TwoFactorState = { error: null };

export function TwoFactorForm() {
  const [state, formAction, pending] = useActionState(verifyTwoFactorAction, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        Code de l&apos;application d&apos;authentification
        <input
          type="text"
          name="code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoComplete="one-time-code"
          autoFocus
        />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Vérification…" : "Valider"}
      </button>
    </form>
  );
}
