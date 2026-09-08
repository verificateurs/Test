"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * « Mon garage » — véhicules mémorisés par l'internaute, 100% client
 * (Context + localStorage), même pattern que CartContext/ComparatorContext :
 * aucune table serveur, une île posée par-dessus des pages catalogue
 * statiques. `hydrated` doit être respecté par tout composant qui rendrait
 * différemment selon qu'un véhicule est actif ou non (CompatBadge) — voir le
 * bug déjà rencontré sur /commande et /panier avec CartContext : avant la
 * relecture depuis localStorage, `vehicles` vaut [] même si un garage existe
 * réellement, et l'afficher tel quel produirait un flash "à vérifier" suivi
 * d'un saut vers "compatible" à l'hydratation.
 */

export type Vehicle = {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  motorisationId: string;
  codeMoteur: string;
  label: string;
};

type GarageContextValue = {
  vehicles: Vehicle[];
  activeIndex: number;
  activeVehicle: Vehicle | null;
  hydrated: boolean;
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (index: number) => void;
  setActiveIndex: (index: number) => void;
};

const GarageContext = createContext<GarageContextValue | null>(null);

const STORAGE_KEY = "detailix:garage:v1";
const MAX_VEHICLES = 10;

type StoredState = { vehicles: Vehicle[]; activeIndex: number };

function isValidVehicle(v: unknown): v is Vehicle {
  const veh = v as Partial<Vehicle> | null;
  return (
    !!veh &&
    typeof veh.makeId === "string" &&
    typeof veh.makeName === "string" &&
    typeof veh.modelId === "string" &&
    typeof veh.modelName === "string" &&
    typeof veh.motorisationId === "string" &&
    typeof veh.codeMoteur === "string" &&
    typeof veh.label === "string"
  );
}

function loadFromStorage(): StoredState {
  if (typeof window === "undefined") return { vehicles: [], activeIndex: -1 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { vehicles: [], activeIndex: -1 };
    const parsed = JSON.parse(raw);
    const vehicles = Array.isArray(parsed?.vehicles) ? parsed.vehicles.filter(isValidVehicle) : [];
    let activeIndex = Number.isInteger(parsed?.activeIndex) ? parsed.activeIndex : -1;
    if (activeIndex >= vehicles.length) activeIndex = vehicles.length ? 0 : -1;
    return { vehicles, activeIndex };
  } catch {
    return { vehicles: [], activeIndex: -1 };
  }
}

export function GarageProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeIndex, setActiveIndexState] = useState(-1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    setVehicles(stored.vehicles);
    setActiveIndexState(stored.activeIndex);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ vehicles, activeIndex }));
    } catch {
      /* stockage indisponible (navigation privée, quota) : le garage reste en mémoire pour la session */
    }
  }, [vehicles, activeIndex, hydrated]);

  const addVehicle = useCallback((vehicle: Vehicle) => {
    setVehicles((prev) => {
      const next = [...prev, vehicle].slice(-MAX_VEHICLES);
      setActiveIndexState(next.length - 1);
      return next;
    });
  }, []);

  const removeVehicle = useCallback((index: number) => {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
    setActiveIndexState((prevActive) => {
      if (prevActive === index) return 0; // ajusté ci-dessous une fois vehicles recalculé
      if (prevActive > index) return prevActive - 1;
      return prevActive;
    });
  }, []);

  const setActiveIndex = useCallback((index: number) => setActiveIndexState(index), []);

  // Après un removeVehicle qui retirait le véhicule actif, activeIndex peut
  // pointer hors bornes (ou sur -1 forcé plus haut alors que la liste n'est
  // pas vide) : on corrige au rendu suivant, jamais de tableau vide actif.
  useEffect(() => {
    if (vehicles.length === 0 && activeIndex !== -1) setActiveIndexState(-1);
    else if (vehicles.length > 0 && activeIndex >= vehicles.length) setActiveIndexState(0);
  }, [vehicles, activeIndex]);

  const activeVehicle = activeIndex >= 0 && activeIndex < vehicles.length ? vehicles[activeIndex] : null;

  const value = useMemo(
    () => ({ vehicles, activeIndex, activeVehicle, hydrated, addVehicle, removeVehicle, setActiveIndex }),
    [vehicles, activeIndex, activeVehicle, hydrated, addVehicle, removeVehicle, setActiveIndex]
  );

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage(): GarageContextValue {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error("useGarage doit être utilisé sous GarageProvider");
  return ctx;
}
