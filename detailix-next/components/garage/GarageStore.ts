"use client";

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

const COOKIE_NAME = "detailix_garage";
const LISTENERS = new Set<(v: GarageVehicle | null) => void>();

function parseCookie(): GarageVehicle | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(COOKIE_NAME + "="));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.slice(COOKIE_NAME.length + 1)));
  } catch {
    return null;
  }
}

function writeCookie(v: GarageVehicle | null) {
  if (v === null) {
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Strict`;
  } else {
    const encoded = encodeURIComponent(JSON.stringify(v));
    // 1 year TTL, SameSite Strict, no HttpOnly so client can read it
    document.cookie = `${COOKIE_NAME}=${encoded}; Max-Age=31536000; path=/; SameSite=Strict`;
  }
}

export const GarageStore = {
  get(): GarageVehicle | null {
    return parseCookie();
  },

  set(v: GarageVehicle | null) {
    writeCookie(v);
    LISTENERS.forEach((fn) => fn(v));
  },

  subscribe(fn: (v: GarageVehicle | null) => void) {
    LISTENERS.add(fn);
    return () => { LISTENERS.delete(fn); };
  },
};
