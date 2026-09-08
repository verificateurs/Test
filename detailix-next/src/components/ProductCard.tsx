import Link from "next/link";
import {
  computeSellPrice,
  formatPrice,
  deliveryEstimate,
  parseCompatibilite,
  compatibilityStatus,
  COMPAT_LABELS,
  HOMOLOGATION_LABELS,
} from "@/lib/catalogue";
import { CompareToggle } from "@/components/CompareToggle";

type ProductLike = {
  id: string;
  name: string;
  format: string;
  prixAchat: number;
  stock: boolean;
  compatibilite: string;
  homologation: string | null;
};

/** Carte produit en lien vers sa fiche. Compatibilité calculée hors véhicule
 *  actif (page statique) : "universel" ou "à vérifier", jamais bloquante. */
export function ProductCard({ product, marginPercent }: { product: ProductLike; marginPercent: number }) {
  const price = computeSellPrice(product.prixAchat, marginPercent);
  const delivery = deliveryEstimate(product.stock);
  const compat = COMPAT_LABELS[compatibilityStatus(parseCompatibilite(product.compatibilite), null)];
  const homolog = product.homologation ? HOMOLOGATION_LABELS[product.homologation] : null;

  return (
    <div className="tile">
      <Link href={`/produits/${product.id}`} className="tile-link">
        <h3>{product.name}</h3>
        <p>{product.format}</p>
        <div className="badge-row">
          <span className="product-price">{formatPrice(price)}</span>
          <span className={`delivery-badge ${delivery.className}`}>{delivery.label}</span>
          <span className={`compat-badge ${compat.className}`}>{compat.label}</span>
          {homolog && <span className={`homolog-badge ${homolog.className}`}>{homolog.label}</span>}
          {product.stock === false && <span className="out-of-stock">Rupture de stock</span>}
        </div>
      </Link>
      <CompareToggle productId={product.id} />
    </div>
  );
}
