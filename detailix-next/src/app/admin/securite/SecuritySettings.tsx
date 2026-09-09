"use client";

import { useActionState, useState, useTransition } from "react";
import { generateTotpSecretAction, confirmTotpAction, disableTotpAction, type ConfirmTotpState } from "./actions";

const initialConfirmState: ConfirmTotpState = { error: null };

export function SecuritySettings({ totpEnabled }: { totpEnabled: boolean }) {
  const [enrollment, setEnrollment] = useState<{ secret: string; qrDataUri: string } | null>(null);
  const [generating, startGenerate] = useTransition();
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmTotpAction, initialConfirmState);

  if (totpEnabled) {
    return (
      <div data-testid="totp-enabled">
        <p>La vérification en deux étapes est activée sur ce compte.</p>
        <form action={disableTotpAction}>
          <button type="submit" className="btn-secondary">
            Désactiver la 2FA
          </button>
        </form>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div>
        <p>La vérification en deux étapes n&apos;est pas activée sur ce compte.</p>
        <button
          type="button"
          className="btn-primary"
          disabled={generating}
          onClick={() => startGenerate(async () => setEnrollment(await generateTotpSecretAction()))}
        >
          {generating ? "Génération…" : "Activer la 2FA"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Scannez ce QR code avec votre application d&apos;authentification (Google Authenticator, 1Password…), puis saisissez le code affiché pour confirmer.</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- data-URI générée à la volée, non éligible à next/image */}
      <img src={enrollment.qrDataUri} alt="QR code d'enrôlement 2FA" width={200} height={200} />
      <p className="form-hint" data-testid="totp-secret">
        Ou saisissez ce secret manuellement : {enrollment.secret}
      </p>
      <form action={confirmAction} className="auth-form">
        <label>
          Code à 6 chiffres
          <input type="text" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus />
        </label>
        {confirmState.error && <p className="form-error">{confirmState.error}</p>}
        <button type="submit" className="btn-primary" disabled={confirmPending}>
          {confirmPending ? "Vérification…" : "Confirmer"}
        </button>
      </form>
    </div>
  );
}
