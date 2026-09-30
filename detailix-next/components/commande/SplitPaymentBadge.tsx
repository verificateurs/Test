import { shouldShowSplitPayment, splitPaymentProvider } from "@/lib/split-payment";

interface Props {
  /** Montant TTC, en euros. */
  amountEur: number;
}

/**
 * Badge informatif "Paiement en 3x/4x sans frais".
 *
 * Purement additif : n'affiche rien quand le flag PAYMENT_SPLIT_ENABLED est
 * désactivé (comportement par défaut, voir lib/split-payment.ts) ou quand le
 * montant est sous le seuil minimum. Ne modifie en rien le flux de commande
 * existant — c'est un simple encart informatif.
 */
export function SplitPaymentBadge({ amountEur }: Props) {
  if (!shouldShowSplitPayment(amountEur)) return null;

  const amountCents = Math.round(amountEur * 100);
  const plans = splitPaymentProvider.computeInstallments(amountCents);
  if (plans.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        marginBottom: "var(--space-lg)",
        padding: "var(--space-sm) var(--space-md)",
        background: "var(--accent-soft)",
        borderRadius: "var(--radius)",
        fontSize: "var(--text-sm)",
        color: "var(--text)",
      }}
    >
      {plans.map((plan) => (
        <span key={plan.count}>
          Ou{" "}
          <strong>
            {plan.count}x{" "}
            {(plan.amountPerInstallment / 100).toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </strong>{" "}
          sans frais
        </span>
      ))}
    </div>
  );
}
