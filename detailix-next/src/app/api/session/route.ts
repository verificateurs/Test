import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Renseigne l'état de connexion pour les îles clientes (menu compte) posées
 * sur des pages catalogue statiques. Ne jamais renvoyer passwordHash ni id
 * technique interne au-delà de ce qui est nécessaire à l'affichage.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ loggedIn: false });
  return NextResponse.json({
    loggedIn: true,
    displayName: session.user.displayName,
    role: session.user.role,
    email: session.user.email,
  });
}
