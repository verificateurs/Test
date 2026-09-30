import { cookies } from "next/headers";

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

export async function getGarageVehicle(): Promise<GarageVehicle | null> {
  const jar = await cookies();
  const raw = jar.get("detailix_garage")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as GarageVehicle;
  } catch {
    return null;
  }
}
