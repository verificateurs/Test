import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getMarginPercent,
  computeSellPrice,
  formatPrice,
  deliveryEstimate,
  parseCompatibilite,
  compatibilityStatus,
  COMPAT_LABELS,
  HOMOLOGATION_LABELS,
} from "@/lib/catalogue";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Comparateur", robots: { index: false, follow: true } };

const MAX_ITEMS = 4;

// Piloté uniquement par l'URL (?compare=id1,id2,...) — aucun état serveur,
// donc partageable telle quelle. La sélection elle-même vit en localStorage
// côté client (ComparatorContext) et ne fait que construire ce lien.
export default async function ComparateurPage({ searchParams }: { searchParams: Promise<{ compare?: string }> }) {
  const { compare } = await searchParams;
  const ids = (compare ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS);

  const [products, marginPercent] = await Promise.all([
    ids.length > 0 ? prisma.product.findMany({ where: { id: { in: ids } }, include: { brand: true, category: true } }) : Promise.resolve([]),
    getMarginPercent(),
  ]);
  // Conserve l'ordre choisi par l'utilisateur, pas l'ordre de retour de la requête.
  const ordered = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Comparateur</h1>

            {ordered.length === 0 ? (
              <p className="section-intro">
                Aucun produit sélectionné. Cochez « Comparer » sur les fiches produit ou pages catégorie/marque, puis
                revenez ici. <Link href="/categories">Parcourir le catalogue</Link>.
              </p>
            ) : (
              <div className="cart-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>—</th>
                      {ordered.map((p) => (
                        <th key={p.id}>
                          <Link href={`/produits/${p.id}`}>{p.name}</Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Marque</td>
                      {ordered.map((p) => (
                        <td key={p.id}>{p.brand.name}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Catégorie</td>
                      {ordered.map((p) => (
                        <td key={p.id}>{p.category.label}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Format</td>
                      {ordered.map((p) => (
                        <td key={p.id}>{p.format}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Prix</td>
                      {ordered.map((p) => (
                        <td key={p.id}>
                          <strong>{formatPrice(computeSellPrice(p.prixAchat, marginPercent))}</strong>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Disponibilité</td>
                      {ordered.map((p) => (
                        <td key={p.id}>{deliveryEstimate(p.stock).label}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Compatibilité</td>
                      {ordered.map((p) => (
                        <td key={p.id}>{COMPAT_LABELS[compatibilityStatus(parseCompatibilite(p.compatibilite), null)].label}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Homologation</td>
                      {ordered.map((p) => (
                        <td key={p.id}>{p.homologation ? HOMOLOGATION_LABELS[p.homologation]?.label : "—"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Description</td>
                      {ordered.map((p) => (
                        <td key={p.id}>{p.description}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
