import { requireAdminRole } from "@/lib/auth/session";
import { generateSecret, buildOtpauthUri } from "@/lib/auth/totp";
import { Enable2faForm } from "./Enable2faForm";
import { Disable2faForm } from "./Disable2faForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sécurité du compte" };

// Cette page utilise requireAdminRole() (rôle seul, sans exiger la 2FA) et non
// requireAdmin() : requireAdmin() redirige désormais ICI quand un ADMIN n'a
// pas activé sa 2FA (voir lib/auth/session.ts) — avec requireAdmin() ici, ce
// serait une boucle de redirection infinie pour exactement le cas qu'on veut
// débloquer.
export default async function SecuritePage({
  searchParams,
}: {
  searchParams: Promise<{ admin2fa?: string }>;
}) {
  const user = await requireAdminRole();
  const { admin2fa } = await searchParams;
  const pendingSecret = user.totpEnabled ? null : generateSecret();

  return (
    <div className="page-enter" style={{ padding: "var(--space-3xl) 0" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: "var(--space-xl)" }}>Sécurité</h1>

        {admin2fa === "required" && !user.totpEnabled && (
          <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "var(--radius)", padding: "var(--space-lg)", marginBottom: "var(--space-lg)", fontSize: "var(--text-sm)" }}>
            La double authentification est obligatoire pour les comptes administrateur. Activez-la ci-dessous pour accéder au back-office.
          </div>
        )}

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
