"use client";

import { useMemo, useState } from "react";
import type { Departement } from "@/lib/departements-france";
import type { PreparateurCentre } from "@/lib/preparateurs-geo";
import { distanceKm } from "@/lib/preparateurs-geo";

interface PreparateurSearchProps {
  centres: PreparateurCentre[];
  departements: Departement[];
}

const RADIUS_STEPS = [50, 100, 150, 200] as const;

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span className="stars" aria-label={`Note : ${rating} sur 5`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

export function PreparateurSearch({ centres, departements }: PreparateurSearchProps) {
  const [deptCode, setDeptCode] = useState("");
  const [radius, setRadius] = useState<number>(RADIUS_STEPS[0]);

  const sortedDepartements = useMemo(
    () => [...departements].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [departements]
  );

  const selectedDept = departements.find((d) => d.code === deptCode) ?? null;

  const results = useMemo(() => {
    if (!selectedDept) return [];
    return centres
      .map((c) => ({
        ...c,
        distance: distanceKm(selectedDept.latitude, selectedDept.longitude, c.latitude, c.longitude),
      }))
      .filter((c) => c.departement === selectedDept.code || c.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }, [centres, selectedDept, radius]);

  function onSelectDept(code: string) {
    setDeptCode(code);
    setRadius(RADIUS_STEPS[0]);
  }

  const maxRadius = RADIUS_STEPS[RADIUS_STEPS.length - 1];

  return (
    <div className="preparateur-search">
      <div className="ps-notice">
        Données de démonstration : centres, coordonnées, avis et disponibilités sont des exemples
        fictifs à titre d&apos;illustration, en attente de validation des réseaux partenaires.
      </div>

      <div className="ps-controls">
        <div className="ps-field">
          <label htmlFor="ps-departement">Votre département</label>
          <select
            id="ps-departement"
            value={deptCode}
            onChange={(e) => onSelectDept(e.target.value)}
          >
            <option value="">Sélectionner un département</option>
            {sortedDepartements.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.nom}
              </option>
            ))}
          </select>
        </div>

        {selectedDept && (
          <div className="ps-field">
            <span className="ps-radius-label">Rayon de recherche</span>
            <div className="ps-radius-group" role="group" aria-label="Rayon de recherche">
              {RADIUS_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`ps-radius-btn${radius === step ? " active" : ""}`}
                  onClick={() => setRadius(step)}
                >
                  {step} km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!selectedDept && (
        <div className="ps-empty">
          Choisissez votre département pour voir les préparateurs partenaires à proximité.
        </div>
      )}

      {selectedDept && results.length > 0 && (
        <>
          <p className="ps-count">
            {results.length} préparateur{results.length !== 1 ? "s" : ""} trouvé{results.length !== 1 ? "s" : ""}{" "}
            dans un rayon de {radius} km autour de {selectedDept.nom} ({selectedDept.code}).
          </p>
          <div className="ps-grid">
            {results.map((c) => {
              const recentReviews = [...c.reviews]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 2);
              return (
                <div key={c.id} className="tile reveal ps-card">
                  <div className="ps-card-header">
                    <div>
                      <h2>{c.reseauName}</h2>
                      <span className="ps-ville">{c.ville}</span>
                    </div>
                    <span className="badge badge-compat">
                      {c.departement === selectedDept.code ? "Dans le département" : `≈ ${Math.round(c.distance)} km`}
                    </span>
                  </div>

                  <p className="ps-specialite">{c.specialite}</p>

                  <div className="ps-rating">
                    <Stars rating={c.rating} />
                    <strong>{c.rating}</strong>
                    <span>({c.reviewCount} avis)</span>
                  </div>

                  <div className="ps-infos">
                    <span>{c.adresse}</span>
                    <a href={`tel:${c.telephone.replace(/\s+/g, "")}`}>{c.telephone}</a>
                    <a href={`https://${c.siteWeb}`} target="_blank" rel="noopener noreferrer">
                      {c.siteWeb} →
                    </a>
                  </div>

                  {recentReviews.length > 0 && (
                    <div className="ps-reviews">
                      {recentReviews.map((rv, i) => (
                        <div key={i} className="ps-review">
                          <div className="ps-review-head">
                            <strong>{rv.author}</strong>
                            <Stars rating={rv.rating} />
                          </div>
                          <p>{rv.comment}</p>
                          <span className="ps-review-date">{rv.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedDept && results.length === 0 && (
        <div className="ps-empty">
          {radius < maxRadius ? (
            <>
              <p>Aucun préparateur trouvé dans un rayon de {radius} km autour de {selectedDept.nom}.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setRadius(maxRadius)}
              >
                Agrandir la recherche à {maxRadius} km
              </button>
            </>
          ) : (
            <p>
              Aucun préparateur trouvé, même dans un rayon de {maxRadius} km autour de {selectedDept.nom}.
              Notre réseau ne couvre pas encore votre secteur.
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .preparateur-search {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }
        .ps-notice {
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-md) var(--space-lg);
          font-size: var(--text-sm);
          line-height: 1.6;
        }
        .ps-controls {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xl);
          align-items: flex-end;
        }
        .ps-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .ps-field label,
        .ps-radius-label {
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-weight: 500;
        }
        .ps-field select {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: var(--text-sm);
          padding: 10px 12px;
          min-width: 260px;
          outline: none;
        }
        .ps-field select:focus {
          border-color: var(--accent);
        }
        .ps-radius-group {
          display: flex;
          gap: var(--space-sm);
        }
        .ps-radius-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: var(--text-sm);
          padding: 8px 14px;
          cursor: pointer;
          transition: background 0.2s var(--ease), border-color 0.2s var(--ease);
        }
        .ps-radius-btn:hover {
          background: var(--bg-card);
        }
        .ps-radius-btn.active {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
          font-weight: 600;
        }
        .ps-count {
          color: var(--text-muted);
          font-size: var(--text-sm);
        }
        .ps-empty {
          padding: var(--space-3xl) 0;
          text-align: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .ps-grid {
          display: grid;
          gap: var(--space-lg);
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        }
        .ps-card {
          padding: var(--space-xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .ps-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-sm);
        }
        .ps-card-header h2 {
          font-size: var(--text-lg);
          margin: 0;
        }
        .ps-ville {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .ps-specialite {
          color: var(--text-muted);
          font-size: var(--text-sm);
          margin: 0;
        }
        .ps-rating {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: var(--text-sm);
        }
        .ps-rating span {
          color: var(--text-muted);
        }
        .ps-infos {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: var(--text-sm);
        }
        .ps-infos span {
          color: var(--text-muted);
        }
        .ps-infos a {
          color: var(--accent);
          text-decoration: none;
        }
        .ps-infos a:hover {
          text-decoration: underline;
        }
        .ps-reviews {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          padding-top: var(--space-sm);
          border-top: 1px solid var(--border);
        }
        .ps-review-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ps-review p {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.5;
          margin: 4px 0;
        }
        .ps-review-date {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
