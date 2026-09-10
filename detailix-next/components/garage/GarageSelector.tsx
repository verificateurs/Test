"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GarageStore, type GarageVehicle } from "./GarageStore";
import type { VehiculeTree } from "@/app/api/vehicules/route";

export function GarageSelector() {
  const [open, setOpen] = useState(false);
  const [vehicle, setVehicle] = useState<GarageVehicle | null>(null);
  const [tree, setTree] = useState<VehiculeTree | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);

  const [selMarque, setSelMarque] = useState("");
  const [selModele, setSelModele] = useState("");
  const [selCode, setSelCode] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync with cookie
  useEffect(() => {
    setVehicle(GarageStore.get());
    return GarageStore.subscribe(setVehicle);
  }, []);

  // Open/close dialog
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal?.();
      if (!tree && !loadingTree) {
        setLoadingTree(true);
        fetch("/api/vehicules")
          .then((r) => r.json())
          .then((data: VehiculeTree) => {
            setTree(data);
            if (vehicle) {
              setSelMarque(vehicle.marque);
              setSelModele(vehicle.modele);
              setSelCode(vehicle.codeMoteur);
            }
          })
          .finally(() => setLoadingTree(false));
      } else if (tree && vehicle) {
        setSelMarque(vehicle.marque);
        setSelModele(vehicle.modele);
        setSelCode(vehicle.codeMoteur);
      }
    } else {
      el.close?.();
    }
  }, [open]);

  // Close on backdrop click
  const onDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) setOpen(false);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const currentMarque = tree?.marques.find((m) => m.label === selMarque);
  const currentModele = currentMarque?.modeles.find((m) => m.label === selModele);

  function handleSave() {
    if (!selCode || !currentModele) return;
    const moto = currentModele.motorisations.find((m) => m.codeMoteur === selCode);
    if (!moto) return;
    GarageStore.set({
      marque: selMarque,
      modele: selModele,
      codeMoteur: selCode,
      motorisation: moto.label,
    });
    setOpen(false);
  }

  const canSave = selMarque && selModele && selCode;

  const label = vehicle
    ? `${vehicle.marque} ${vehicle.modele}`
    : "Mon véhicule";

  return (
    <>
      <button
        className={`btn btn-ghost btn-sm garage-btn${vehicle ? " garage-btn--active" : ""}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        title={vehicle ? `${vehicle.marque} ${vehicle.modele} — ${vehicle.motorisation}` : "Sélectionner mon véhicule"}
      >
        <span className="garage-icon" aria-hidden>🚗</span>
        <span className="garage-label">{label}</span>
      </button>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <dialog ref={dialogRef} className="garage-dialog" onClick={onDialogClick} aria-label="Sélecteur de véhicule">
        <div className="garage-dialog-inner" onClick={(e) => e.stopPropagation()}>
          <div className="garage-dialog-header">
            <h2>Mon véhicule</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
          </div>

          {loadingTree && (
            <div style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--text-muted)" }}>
              Chargement…
            </div>
          )}

          {tree && (
            <div className="garage-selects">
              <div className="form-field">
                <label htmlFor="sel-marque">Marque</label>
                <select
                  id="sel-marque"
                  value={selMarque}
                  onChange={(e) => { setSelMarque(e.target.value); setSelModele(""); setSelCode(""); }}
                >
                  <option value="">— Choisir —</option>
                  {tree.marques.map((m) => (
                    <option key={m.label} value={m.label}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="sel-modele">Modèle</label>
                <select
                  id="sel-modele"
                  value={selModele}
                  onChange={(e) => { setSelModele(e.target.value); setSelCode(""); }}
                  disabled={!selMarque}
                >
                  <option value="">— Choisir —</option>
                  {currentMarque?.modeles.map((m) => (
                    <option key={m.label} value={m.label}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="sel-moto">Motorisation</label>
                <select
                  id="sel-moto"
                  value={selCode}
                  onChange={(e) => setSelCode(e.target.value)}
                  disabled={!selModele}
                >
                  <option value="">— Choisir —</option>
                  {currentModele?.motorisations.map((m) => (
                    <option key={m.codeMoteur} value={m.codeMoteur}>
                      {m.label} ({m.codeMoteur})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-lg)" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!canSave}
                  style={{ flex: 1 }}
                >
                  Enregistrer
                </button>
                {vehicle && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => { GarageStore.set(null); setSelMarque(""); setSelModele(""); setSelCode(""); setOpen(false); }}
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </dialog>

      <style jsx>{`
        .garage-btn { gap: 6px; }
        .garage-btn--active { color: var(--accent); border-color: var(--accent); }
        .garage-label { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 480px) { .garage-label { display: none; } }

        .garage-dialog {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 0;
          color: var(--text);
          max-width: 440px;
          width: calc(100% - 32px);
          box-shadow: var(--shadow-md);
        }
        .garage-dialog::backdrop {
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
        }
        .garage-dialog-inner { padding: var(--space-xl); }
        .garage-dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-xl);
        }
        .garage-dialog-header h2 { margin: 0; font-size: var(--text-xl); }
        .garage-selects { display: flex; flex-direction: column; gap: var(--space-lg); }
        @media (max-width: 480px) {
          .garage-dialog-inner { padding: var(--space-lg); }
        }
      `}</style>
    </>
  );
}
