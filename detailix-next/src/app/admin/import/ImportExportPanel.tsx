"use client";

import { useActionState, useState } from "react";
import { importProductsAction, exportProductsAction, type ImportActionState } from "./actions";

const initialState: ImportActionState = { error: null, success: null };

export function ImportExportPanel() {
  const [state, formAction, pending] = useActionState(importProductsAction, initialState);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const json = await exportProductsAction();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `detailix-produits-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="admin-card">
        <h2>Export</h2>
        <p className="form-hint">Télécharge tous les produits au format JSON (même structure que l&apos;import ci-dessous).</p>
        <button type="button" className="btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? "Génération…" : "Exporter les produits"}
        </button>
      </div>

      <div className="admin-card">
        <h2>Import</h2>
        <p className="form-hint">
          Fichier JSON <code>{"{ products: [...] }"}</code>. Chaque produit doit référencer une marque existante
          (categoryId doit correspondre à la catégorie réelle de cette marque). 2 Mo maximum.
        </p>
        <form action={formAction} className="checkout-form">
          <label>
            Fichier
            <input type="file" name="file" accept="application/json" required />
          </label>
          <label>
            Mode
            <select name="mode" defaultValue="create">
              <option value="create">Création — échoue si un identifiant existe déjà</option>
              <option value="update">Mise à jour — crée ou écrase les identifiants existants</option>
            </select>
          </label>
          {state.error && <p className="form-error">{state.error}</p>}
          {state.success && <p className="admin-flash">{state.success}</p>}
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Import…" : "Importer"}
          </button>
        </form>
      </div>
    </div>
  );
}
