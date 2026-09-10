import { redirect } from "next/navigation";
import { readPending2fa } from "@/lib/auth/twofactor";
import { TwoFactorForm } from "./TwoFactorForm";

export const metadata = { title: "Vérification en deux étapes" };

export default async function Connexion2faPage() {
  const pendingUserId = await readPending2fa();
  if (!pendingUserId) redirect("/connexion");

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-xl)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ marginBottom: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-2xl)" }}>Vérification en deux étapes</h1>
        <p style={{ marginBottom: "var(--space-lg)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          Saisissez le code à 6 chiffres généré par votre application d&apos;authentification.
        </p>
        <TwoFactorForm />
      </div>
    </div>
  );
}
