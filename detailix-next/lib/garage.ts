import { cookies } from "next/headers";
import { z } from "zod";

export interface GarageVehicle {
  /** Identifiant de motorisation (Vehicle.id en base) — pas codeMoteur, qui n'est pas unique. */
  id: string;
  marque: string;
  modele: string;
  codeMoteur: string;
  /** Code châssis/plateforme (ex: "EK", "8N"), pour la compat des pièces liées au châssis. */
  platform?: string | null;
  motorisation: string;
}

// Le cookie est entièrement sous contrôle du visiteur (non httpOnly — le JS
// client doit pouvoir le lire/écrire, voir components/garage/GarageStore.ts).
// Sans validation stricte des types, un cookie forgé (ex: `{"codeMoteur":
// {"not":""}, ...}`) atteindrait directement une clause Prisma `where` (voir
// app/categories/[id]/page.tsx, lib/catalog-query.ts) : pas une injection SQL
// (Prisma paramètre toujours la requête finale) mais une injection de logique
// de requête qui contourne le filtre prévu. `.strict()` rejette toute clé
// additionnelle plutôt que de l'ignorer silencieusement.
const garageVehicleSchema = z
  .object({
    id: z.string().min(1).max(100),
    marque: z.string().min(1).max(100),
    modele: z.string().min(1).max(100),
    codeMoteur: z.string().min(1).max(100),
    platform: z.string().max(100).nullable().optional(),
    motorisation: z.string().min(1).max(200),
  })
  .strict();

export async function getGarageVehicle(): Promise<GarageVehicle | null> {
  const jar = await cookies();
  const raw = jar.get("detailix_garage")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    const result = garageVehicleSchema.safeParse(parsed);
    // Rejeté (type forgé, ou cookie pré-migration sans id/platform) : traité
    // comme "pas de véhicule sélectionné", jamais transmis tel quel.
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
