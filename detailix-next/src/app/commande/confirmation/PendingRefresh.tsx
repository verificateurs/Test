"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 3000;
const MAX_ATTEMPTS = 8; // ~24s : largement suffisant, le webhook Stripe arrive en général en 1-2s

/** Re-render la page serveur tant que la commande n'est pas encore PAID,
 * pour refléter la confirmation du webhook Stripe sans que l'utilisateur ait
 * à recharger manuellement. S'arrête de lui-même après quelques essais. */
export function PendingRefresh({ isPending }: { isPending: boolean }) {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > MAX_ATTEMPTS) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [isPending, router]);

  return null;
}
