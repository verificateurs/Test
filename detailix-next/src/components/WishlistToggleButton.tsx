"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { addToWishlistAction } from "@/app/compte/liste-envies/actions";
import { useToast } from "@/components/Toast";

export function WishlistToggleButton({ productId, nextPath }: { productId: string; nextPath: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.loggedIn)))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn === null) return <span aria-hidden="true" />;

  if (!loggedIn) {
    return (
      <Link href={`/connexion?next=${encodeURIComponent(nextPath)}`} className="btn-secondary">
        Se connecter pour ajouter à ma liste d&apos;envies
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await addToWishlistAction(productId);
          showToast(result.ok ? "Ajouté à votre liste d'envies" : result.error ?? "Une erreur est survenue");
        });
      }}
    >
      ♡ Ajouter à ma liste d&apos;envies
    </button>
  );
}
