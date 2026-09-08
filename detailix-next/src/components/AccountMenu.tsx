"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

type SessionInfo = { loggedIn: boolean; displayName?: string; role?: string };

/**
 * Île cliente : les pages catalogue restent statiques (force-static), donc
 * l'état de connexion ne peut pas être lu au rendu serveur de ces pages sans
 * les rendre dynamiques. On l'interroge après hydratation via /api/session
 * (le cookie de session est httpOnly, illisible en JS — cette route le lit
 * côté serveur et ne renvoie que des champs non sensibles).
 */
export function AccountMenu() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession({ loggedIn: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session) return <span className="account-menu-placeholder" aria-hidden="true" />;

  if (!session.loggedIn) {
    return (
      <Link href="/connexion" className="site-nav-account">
        Connexion
      </Link>
    );
  }

  return (
    <div className="account-menu">
      <Link href="/compte" className="site-nav-account">
        {session.displayName}
      </Link>
      {session.role === "ADMIN" && <Link href="/admin">Admin</Link>}
      <form action={logoutAction}>
        <button type="submit" className="link-button">
          Déconnexion
        </button>
      </form>
    </div>
  );
}
