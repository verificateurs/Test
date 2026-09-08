"use client";

import { useComparator, COMPARATOR_MAX_ITEMS } from "@/lib/comparator/ComparatorContext";

export function CompareToggle({ productId }: { productId: string }) {
  const { has, toggle, ids } = useComparator();
  const checked = has(productId);
  const disabled = !checked && ids.length >= COMPARATOR_MAX_ITEMS;

  return (
    <label className="compare-toggle" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(productId)} />
      Comparer
    </label>
  );
}
