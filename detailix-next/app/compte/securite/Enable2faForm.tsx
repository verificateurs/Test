"use client";

import { useActionState } from "react";
import { enable2faAction } from "./actions";

export function Enable2faForm({ secret, otpauthUri }: { secret: string; otpauthUri: string }) {
  const [state, dispatch, pending] = useActionState(enable2faAction, null);

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-xl)", border: "1px solid var(--border)" }}>
      <h2 style={{ marginBottom: "var(--space-md)", fontSize: "var(--text-xl)" }}>Activer la double authentification</h2>
      <p style={{ marginBottom: "var(--space-md)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        Ajoutez cette clé dans votre application d&apos;authentification (Google Authenticator, Authy, etc.), puis saisissez le code généré pour confirmer.
      </p>

      <div className="form-field">
        <label htmlFor="secret-display">Clé secrète (Base32)</label>
        <input id="secret-display" readOnly value={secret} style={{ fontFamily: "monospace" }} />
      </div>

      <div className="form-field">
        <label htmlFor="otpauth-uri">URI otpauth://</label>
        <input id="otpauth-uri" readOnly value={otpauthUri} style={{ fontFamily: "monospace", fontSize: "var(--text-xs)" }} />
      </div>

      {state?.error && (
        <div className="alert alert-error" style={{ marginTop: "var(--space-md)", marginBottom: "var(--space-md)" }}>
          {state.error}
        </div>
      )}

      <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", marginTop: "var(--space-lg)" }}>
        <input type="hidden" name="secret" value={secret} />

        <div className="form-field">
          <label htmlFor="code">Code de confirmation</label>
          <input
            id="code"
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

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Activation…" : "Activer la 2FA"}
        </button>
      </form>
    </div>
  );
}
