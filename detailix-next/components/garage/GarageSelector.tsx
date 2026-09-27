"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { GarageStore, type GarageVehicle } from "./GarageStore";
import type { VehiculeTree } from "@/app/api/vehicules/route";
import { isValidPlateFormat, lookupPlate } from "@/lib/plate-lookup";

type GarageMode = "manuel" | "plaque";
type PlateStatus = "idle" | "not-found" | "found";

// GarageStore.get() parses the cookie into a new object on every call, so
// useSyncExternalStore needs a cached snapshot to avoid re-rendering (and
// looping) forever — it compares snapshots by reference, not deep equality.
let cachedVehicleKey = "null";
let cachedVehicle: GarageVehicle | null = null;
function getVehicleSnapshot(): GarageVehicle | null {
  const vehicle = GarageStore.get();
  const key = JSON.stringify(vehicle);
  if (key !== cachedVehicleKey) {
    cachedVehicleKey = key;
    cachedVehicle = vehicle;
  }
  return cachedVehicle;
}

export function GarageSelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const vehicle = useSyncExternalStore(GarageStore.subscribe, getVehicleSnapshot, () => null);
  const [tree, setTree] = useState<VehiculeTree | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);

  const [mode, setMode] = useState<GarageMode>("manuel");

  const [selMarque, setSelMarque] = useState("");
  const [selModele, setSelModele] = useState("");
  const [selCode, setSelCode] = useState("");

  const [plateInput, setPlateInput] = useState("");
  const [plateStatus, setPlateStatus] = useState<PlateStatus>("idle");
  const [plateMatch, setPlateMatch] = useState<GarageVehicle | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Show/hide the native <dialog> element to match the `open` state
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal?.();
    else el.close?.();
  }, [open]);

  function openDialog() {
    setOpen(true);
    if (tree) {
      if (vehicle) {
        setSelMarque(vehicle.marque);
        setSelModele(vehicle.modele);
        setSelCode(vehicle.codeMoteur);
      }
      return;
    }
    if (loadingTree) return;
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
  }

  function closeDialog() {
    setOpen(false);
    setPlateInput("");
    setPlateStatus("idle");
    setPlateMatch(null);
  }

  // Close on backdrop click
  const onDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) closeDialog();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDialog(); };
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
    closeDialog();
    // Les pages produit/catégorie calculent la compatibilité côté serveur
    // à partir du cookie garage — sans refresh, elles resteraient périmées
    // jusqu'à la prochaine navigation complète.
    router.refresh();
  }

  const canSave = selMarque && selModele && selCode;

  const plateFormatValid = isValidPlateFormat(plateInput);

  function handlePlateSearch() {
    if (!tree || !plateFormatValid) return;
    const codeMoteur = lookupPlate(plateInput);
    let found: GarageVehicle | null = null;

    if (codeMoteur) {
      for (const marque of tree.marques) {
        for (const modele of marque.modeles) {
          const moto = modele.motorisations.find((m) => m.codeMoteur === codeMoteur);
          if (moto) {
            found = { marque: marque.label, modele: modele.label, codeMoteur, motorisation: moto.label };
            break;
          }
        }
        if (found) break;
      }
    }

    if (found) {
      setSelMarque(found.marque);
      setSelModele(found.modele);
      setSelCode(found.codeMoteur);
      setPlateMatch(found);
      setPlateStatus("found");
    } else {
      setPlateMatch(null);
      setPlateStatus("not-found");
    }
  }

  function handlePlateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePlateSearch();
    }
  }

  const label = vehicle
    ? `${vehicle.marque} ${vehicle.modele}`
    : "Mon véhicule";

  return (
    <>
      <button
        className={`btn btn-ghost btn-sm garage-btn${vehicle ? " garage-btn--active" : ""}`}
        onClick={openDialog}
        aria-haspopup="dialog"
        title={vehicle ? `${vehicle.marque} ${vehicle.modele} — ${vehicle.motorisation}` : "Sélectionner mon véhicule"}
      >
        <span className="garage-icon" aria-hidden>🚗</span>
        <span className="garage-label">{label}</span>
      </button>

      <dialog ref={dialogRef} className="garage-dialog" onClick={onDialogClick} aria-label="Sélecteur de véhicule">
        <div className="garage-dialog-inner" onClick={(e) => e.stopPropagation()}>
          <div className="garage-dialog-header">
            <h2>Mon véhicule</h2>
            <button className="btn btn-ghost btn-sm" onClick={closeDialog} aria-label="Fermer">✕</button>
          </div>

          <div className="garage-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "manuel"}
              className={`garage-tab${mode === "manuel" ? " garage-tab--active" : ""}`}
              onClick={() => setMode("manuel")}
            >
              Par véhicule
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "plaque"}
              className={`garage-tab${mode === "plaque" ? " garage-tab--active" : ""}`}
              onClick={() => setMode("plaque")}
            >
              Par plaque
            </button>
          </div>

          {loadingTree && (
            <div style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--text-muted)" }}>
              Chargement…
            </div>
          )}

          {tree && mode === "plaque" && (
            <div className="garage-selects">
              <p className="plate-disclaimer">
                Démo — plaque fictive, non connectée au fichier SIV officiel.
              </p>

              <div className="form-field">
                <label htmlFor="plate-input">Plaque d&rsquo;immatriculation</label>
                <input
                  id="plate-input"
                  type="text"
                  className="plate-input"
                  placeholder="AA-123-AA"
                  value={plateInput}
                  onChange={(e) => {
                    setPlateInput(e.target.value.toUpperCase());
                    setPlateStatus("idle");
                    setPlateMatch(null);
                  }}
                  onKeyDown={handlePlateKeyDown}
                  maxLength={9}
                />
                {plateInput.length > 0 && !plateFormatValid && (
                  <span className="plate-hint">Format attendu : AA-123-AA</span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePlateSearch}
                disabled={!plateFormatValid}
              >
                Rechercher
              </button>

              {plateStatus === "found" && plateMatch && (
                <div className="plate-result plate-result--found">
                  {plateMatch.marque} {plateMatch.modele} — {plateMatch.motorisation} détectée
                </div>
              )}

              {plateStatus === "not-found" && (
                <div className="plate-result plate-result--empty">
                  Aucun véhicule trouvé pour cette plaque dans la démo. Utilisez plutôt l&rsquo;onglet « Par véhicule » pour une sélection manuelle.
                </div>
              )}

              <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-lg)" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!canSave || plateStatus !== "found"}
                  style={{ flex: 1 }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {tree && mode === "manuel" && (
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
                    onClick={() => { GarageStore.set(null); setSelMarque(""); setSelModele(""); setSelCode(""); closeDialog(); router.refresh(); }}
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

        .garage-tabs {
          display: flex;
          gap: var(--space-sm);
          border-bottom: 1px solid var(--border);
          margin-bottom: var(--space-xl);
        }
        .garage-tab {
          flex: 1;
          padding: var(--space-sm) var(--space-md);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-size: var(--text-sm);
          cursor: pointer;
        }
        .garage-tab--active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        .plate-disclaimer {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .plate-input { text-transform: uppercase; }
        .plate-hint {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .plate-result {
          padding: var(--space-md);
          border-radius: var(--radius);
          font-size: var(--text-sm);
        }
        .plate-result--found {
          background: var(--bg-card);
          border: 1px solid var(--accent);
          color: var(--text);
        }
        .plate-result--empty {
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
