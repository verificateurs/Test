import Image from "next/image";
import Link from "next/link";
import { computeSellPrice, formatPrice, deliveryEstimate, HOMOLOGATION_LABELS } from "@/lib/catalogue";
import { listProductImageFiles, resolveProductImage } from "@/lib/products/image";
import { ProductImagePlaceholder } from "@/components/ProductImagePlaceholder";
import { CompareToggle } from "@/components/CompareToggle";
import { CompatBadge } from "@/components/CompatBadge";

type ProductLike = {
  id: string;
  name: string;
  format: string;
  prixAchat: number;
  stockQty: number;
  compatibilite: string;
  homologation: string | null;
};

/** Carte produit en lien vers sa fiche. Le badge de compatibilité est rendu
 *  par défaut hors véhicule actif (page statique), puis recalculé côté
 *  client une fois le garage (localStorage) relu — voir CompatBadge. */
export function ProductCard({ product, marginPercent }: { product: ProductLike; marginPercent: number }) {
  const price = computeSellPrice(product.prixAchat, marginPercent);
  const delivery = deliveryEstimate(product.stockQty > 0);
  const homolog = product.homologation ? HOMOLOGATION_LABELS[product.homologation] : null;
  const imagePath = resolveProductImage(product.id, listProductImageFiles());

  return (
    <div className="tile">
      <Link href={`/produits/${product.id}`} className="tile-link">
        <div className="tile-media">
          {imagePath ? (
            <Image
              src={imagePath}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 900px) 30vw, 280px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <ProductImagePlaceholder className="tile-media-placeholder" />
          )}
        </div>
        <h3>{product.name}</h3>
        <p>{product.format}</p>
        <div className="badge-row">
          <span className="product-price">{formatPrice(price)}</span>
          <span className={`delivery-badge ${delivery.className}`}>{delivery.label}</span>
          <CompatBadge compatibilite={product.compatibilite} />
          {homolog && <span className={`homolog-badge ${homolog.className}`}>{homolog.label}</span>}
          {product.stockQty <= 0 && <span className="out-of-stock">Rupture de stock</span>}
        </div>
      </Link>
      <CompareToggle productId={product.id} />
    </div>
  );
}
