import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { deleteMakeAction, deleteModelAction, deleteMotorisationAction } from "./actions";
import { AddMakeForm, AddModelForm, AddMotorisationForm } from "./VehicleForms";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Véhicules", robots: { index: false } };

export default async function AdminVehiclesPage() {
  const makes = await prisma.vehicleMake.findMany({
    orderBy: { name: "asc" },
    include: { models: { orderBy: { name: "asc" }, include: { motorisations: { orderBy: { label: "asc" } } } } },
  });

  return (
    <div>
      <h1>Véhicules</h1>
      <p className="form-hint">
        Les codes moteur saisis ici sont ceux référencés dans la compatibilité des produits (fiche produit,
        marge admin).
      </p>

      <div className="admin-card">
        <h2>Nouvelle marque véhicule</h2>
        <AddMakeForm />
      </div>

      {makes.map((make) => (
        <div className="admin-card" key={make.id}>
          <div className="admin-actions-row">
            <h2 style={{ margin: 0 }}>{make.name}</h2>
            <ConfirmDeleteForm
              action={deleteMakeAction}
              hiddenFields={{ id: make.id }}
              confirmMessage={`Supprimer la marque "${make.name}" et tous ses modèles ?`}
            />
          </div>

          {make.models.map((model) => (
            <div key={model.id} style={{ marginLeft: 16, marginTop: 12, paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
              <div className="admin-actions-row">
                <strong>{model.name}</strong>
                <ConfirmDeleteForm
                  action={deleteModelAction}
                  hiddenFields={{ id: model.id }}
                  confirmMessage={`Supprimer le modèle "${model.name}" et ses motorisations ?`}
                />
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Motorisation</th>
                    <th>Code moteur</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {model.motorisations.map((m) => (
                    <tr key={m.id}>
                      <td>{m.label}</td>
                      <td>{m.codeMoteur}</td>
                      <td>
                        <ConfirmDeleteForm
                          action={deleteMotorisationAction}
                          hiddenFields={{ id: m.id }}
                          confirmMessage={`Supprimer "${m.label}" ?`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddMotorisationForm modelId={model.id} />
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <AddModelForm makeId={make.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
