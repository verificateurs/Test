import { requireUser } from "@/lib/auth/rbac";

// Contrôle serveur faisant autorité pour tout /compte/** — voir middleware.ts
// pour le filtre rapide côté Edge (non faisant autorité) qui précède celui-ci.
export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/compte");
  return <>{children}</>;
}
