import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/rbac";
import { SecuritySettings } from "./SecuritySettings";

export const metadata: Metadata = { title: "Sécurité", robots: { index: false } };

export default async function SecuritePage() {
  const admin = await requireAdmin();

  return (
    <div>
      <h1>Sécurité</h1>
      <div className="admin-card">
        <h2>Vérification en deux étapes (2FA)</h2>
        <SecuritySettings totpEnabled={admin.totpEnabled} />
      </div>
    </div>
  );
}
