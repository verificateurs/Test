"use client";

import { useEffect } from "react";
import { CartStore } from "@/components/cart/CartStore";

/** Empties the client-side cart once, right after a fresh checkout. Rendered
 * only when the confirmation page is reached via the post-checkout redirect
 * (not when a past order is viewed from /compte), so browsing order history
 * never wipes the current cart. Strips the `?fresh=1` marker from the URL
 * right after clearing, so a later browser back/refresh on this same page
 * doesn't clear a cart the user has since started refilling. */
export function ClearCart() {
  useEffect(() => {
    CartStore.clear();
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return null;
}
