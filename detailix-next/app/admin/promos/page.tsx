import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { createPromoAction, deletePromoAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promos" };

export default async function AdminPromos() {
  await requireAdmin();

  const promos = await db.promo.findMany({ orderBy: { id: "desc" } });

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Codes promo</h1>

      {/* Create form */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-xl)", border: "1px solid var(--border)", marginBottom: "var(--space-xl)", maxWidth: 480 }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-lg)" }}>Nouveau code</h2>
        <form action={createPromoAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div className="form-field">
            <label htmlFor="code">Code (majuscules)</label>
            <input id="code" name="code" type="text" required maxLength={50} style={{ textTransform: "uppercase" }} placeholder="DÉTAILIX10" />
          </div>
          <div className="form-field">
            <label htmlFor="discountPercent">Remise (%)</label>
            <input id="discountPercent" name="discountPercent" type="number" required min={1} max={99} placeholder="10" />
          </div>
          <div className="form-field">
            <label htmlFor="maxUses">Utilisations max</label>
            <input id="maxUses" name="maxUses" type="number" required min={1} max={99999} defaultValue={100} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Créer</button>
        </form>
      </div>

      {/* List */}
      <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Remise</th>
            <th>Utilisations</th>
            <th>Actif</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {promos.map((p) => (
            <tr key={p.id}>
              <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)" }}>{p.code}</td>
              <td>{p.discountPercent}%</td>
              <td style={{ color: "var(--text-muted)" }}>{p.usedCount} / {p.maxUses}</td>
              <td>
                <span className={`badge ${p.active ? "badge-stock" : "badge-no-stock"}`}>
                  {p.active ? "Actif" : "Inactif"}
                </span>
              </td>
              <td>
                <form action={deletePromoAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}>
                    Supprimer
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
