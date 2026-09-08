"use client";

import Link from "next/link";
import { useComparator } from "@/lib/comparator/ComparatorContext";

export function ComparatorLink() {
  const { ids } = useComparator();
  if (ids.length === 0) return null;

  return (
    <Link href={`/comparateur?compare=${ids.join(",")}`} className="cart-link" aria-label="Comparer les produits sélectionnés">
      ⚖️<span className="cart-count">{ids.length}</span>
    </Link>
  );
}
