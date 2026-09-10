import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Réinitialiser le mot de passe" };

export default async function ReinitialiserMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-xl)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ marginBottom: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-2xl)" }}>Réinitialiser le mot de passe</h1>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="alert alert-error">Lien de réinitialisation manquant ou invalide.</div>
        )}
      </div>
    </div>
  );
}
