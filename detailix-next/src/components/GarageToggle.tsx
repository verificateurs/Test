"use client";

import { useEffect, useRef, useState } from "react";
import { useGarage } from "@/lib/garage/GarageContext";

type VehicleTree = {
  makes: Array<{
    id: string;
    name: string;
    models: Array<{
      id: string;
      name: string;
      motorisations: Array<{ id: string; label: string; codeMoteur: string }>;
    }>;
  }>;
};

/**
 * Sélecteur "mon garage" — île client posée dans le header, sur des pages
 * statiques. L'arbre marque/modèle/motorisation vient de /api/vehicules-arbre
 * (Prisma n'est jamais importable depuis un composant client), chargé à la
 * première ouverture du panneau plutôt qu'à chaque chargement de page.
 */
export function GarageToggle() {
  const { vehicles, activeIndex, hydrated, addVehicle, removeVehicle, setActiveIndex } = useGarage();
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<VehicleTree | null>(null);
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [motorId, setMotorId] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !tree) {
      fetch("/api/vehicules-arbre")
        .then((r) => r.json())
        .then((data: VehicleTree) => setTree(data))
        .catch(() => setTree({ makes: [] }));
    }
  }, [open, tree]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  const make = tree?.makes.find((m) => m.id === makeId) ?? null;
  const model = make?.models.find((m) => m.id === modelId) ?? null;
  const motorisation = model?.motorisations.find((m) => m.id === motorId) ?? null;

  function resetForm() {
    setMakeId("");
    setModelId("");
    setMotorId("");
  }

  function handleAdd() {
    if (!make || !model || !motorisation) return;
    addVehicle({
      makeId: make.id,
      makeName: make.name,
      modelId: model.id,
      modelName: model.name,
      motorisationId: motorisation.id,
      codeMoteur: motorisation.codeMoteur,
      label: `${make.name} ${model.name} · ${motorisation.label}`,
    });
    resetForm();
  }

  const activeCount = hydrated && vehicles.length > 0 ? vehicles.length : 0;

  return (
    <div className="garage-wrap" ref={panelRef}>
      <button
        type="button"
        className={`cart-link${hydrated && activeIndex >= 0 ? " has-active" : ""}`}
        aria-label="Mon garage"
        onClick={() => setOpen((v) => !v)}
      >
        🚗{activeCount > 0 && <span className="cart-count">{activeCount}</span>}
      </button>

      {open && (
        <div className="garage-panel visible">
          <h3>Mon garage</h3>
          <p className="garage-intro">Enregistrez votre véhicule pour voir sa compatibilité sur chaque produit.</p>

          <div className="garage-form">
            <select
              value={makeId}
              onChange={(e) => {
                setMakeId(e.target.value);
                setModelId("");
                setMotorId("");
              }}
            >
              <option value="">Marque</option>
              {(tree?.makes ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={modelId}
              disabled={!make}
              onChange={(e) => {
                setModelId(e.target.value);
                setMotorId("");
              }}
            >
              <option value="">Modèle</option>
              {(make?.models ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select value={motorId} disabled={!model} onChange={(e) => setMotorId(e.target.value)}>
              <option value="">Motorisation</option>
              {(model?.motorisations ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="veh-code-moteur">{motorisation ? `Code moteur : ${motorisation.codeMoteur}` : ""}</p>
            <button type="button" className="btn-secondary" disabled={!motorisation} onClick={handleAdd}>
              Ajouter à mon garage
            </button>
          </div>

          <div className="garage-list">
            {!hydrated || vehicles.length === 0 ? (
              <p className="garage-empty">Aucun véhicule enregistré.</p>
            ) : (
              vehicles.map((v, i) => (
                <div key={`${v.motorisationId}-${i}`} className={`garage-chip${i === activeIndex ? " active" : ""}`}>
                  <button type="button" className="garage-chip-select" onClick={() => setActiveIndex(i)}>
                    {v.label}
                  </button>
                  <button
                    type="button"
                    className="garage-chip-remove"
                    aria-label="Retirer ce véhicule"
                    onClick={() => removeVehicle(i)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
