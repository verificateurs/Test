"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GarageStore } from "./garage/GarageStore";
import { WishlistButton } from "./wishlist/WishlistButton";

interface ProductCardProps {
  id: string;
  name: string;
  brandName: string;
  categoryId: string;
  price: number;
  stockQty: number;
  /** "universel" or array of compatible engine codes */
  compatCodes?: string[] | "universel";
  /** Whether the current visitor already has this product in their wishlist (absent = not saved; for an anonymous visitor, clicking the button redirects to /connexion). */
  wishlisted?: boolean;
}

function ProductImagePlaceholder() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="400" height="300" fill="var(--bg-elevated)" />
      <rect x="170" y="110" width="60" height="80" rx="8" fill="var(--border)" />
      <circle cx="200" cy="100" r="20" fill="var(--border)" />
      <path d="M140 220 C140 180 260 180 260 220" stroke="var(--border)" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function ProductCard({
  id,
  name,
  brandName,
  categoryId,
  price,
  stockQty,
  compatCodes,
  wishlisted,
}: ProductCardProps) {
  const inStock = stockQty > 0;
  const [compatible, setCompatible] = useState<boolean | null>(null);

  useEffect(() => {
    function check() {
      if (!compatCodes) { setCompatible(null); return; }
      if (compatCodes === "universel") { setCompatible(true); return; }
      const garage = GarageStore.get();
      if (!garage) { setCompatible(null); return; }
      setCompatible(compatCodes.includes(garage.codeMoteur));
    }
    check();
    return GarageStore.subscribe(check);
  }, [compatCodes]);

  return (
    <Link href={`/produits/${id}`} className="tile" aria-label={`${name} — ${brandName}`}>
      <div className="tile-media">
        <Image
          src={`/api/product-image/${id}`}
          alt={name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"
          style={{ objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: -1 }}>
          <ProductImagePlaceholder />
        </div>

        {compatible === true && (
          <span className="badge badge-compat" style={{ position: "absolute", top: 8, left: 8 }}>
            ✓ Compatible
          </span>
        )}
        {compatible === false && (
          <span className="badge badge-incompat" style={{ position: "absolute", top: 8, left: 8 }}>
            ✗ Non compatible
          </span>
        )}

        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <WishlistButton productId={id} initialSaved={wishlisted ?? false} />
        </div>
      </div>

      <div className="tile-body">
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>
          {brandName}
        </div>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>
          {name}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--accent)" }}>
            {price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </span>
          <span className={`badge ${inStock ? "badge-stock" : "badge-no-stock"}`}>
            {inStock ? "En stock" : "Rupture"}
          </span>
        </div>
      </div>
    </Link>
  );
}
