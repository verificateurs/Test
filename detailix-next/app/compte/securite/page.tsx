import { requireAdmin } from "@/lib/auth/session";
import { generateSecret, buildOtpauthUri } from "@/lib/auth/totp";
import { Enable2faForm } from "./Enable2faForm";
import { Disable2faForm } from "./Disable2faForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sécurité du compte" };

export default async function SecuritePage() {
  const user = await requireAdmin();
  const pendingSecret = user.totpEnabled ? null : generateSecret();

  return (
    <div className="page-enter" style={{ padding: "var(--space-3xl) 0" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: "var(--space-xl)" }}>Sécurité</h1>

        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-xl)", border: "1px solid var(--border)", marginBottom: "var(--space-lg)" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 2 }}>Double authentification (TOTP)</div>
          <span className={`badge ${user.totpEnabled ? "badge-stock" : "badge-no-stock"}`}>
            {user.totpEnabled ? "Activée" : "Désactivée"}
          </span>
        </div>

        {user.totpEnabled || !pendingSecret ? (
          <Disable2faForm />
        ) : (
          <Enable2faForm secret={pendingSecret} otpauthUri={buildOtpauthUri(pendingSecret, user.email)} />
        )}
      </div>
    </div>
  );
}
