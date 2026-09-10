import { cookies } from "next/headers";

export interface GarageVehicle {
  marque: string;
  modele: string;
  codeMoteur: string;
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
