"use client";

import { useState, useTransition } from "react";
import { addToWishlistAction, removeFromWishlistAction } from "@/app/compte/wishlist/actions";

interface WishlistButtonProps {
  productId: string;
  initialSaved: boolean;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export function WishlistButton({ productId, initialSaved }: WishlistButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    // Prevents the click from bubbling up to an ancestor <Link> (e.g. ProductCard's tile link)
    e.preventDefault();
    e.stopPropagation();

    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      try {
        if (next) {
          await addToWishlistAction(productId);
        } else {
          await removeFromWishlistAction(productId);
        }
      } catch {
        setSaved(!next);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className={`wishlist-btn${saved ? " saved" : ""}`}
        onClick={toggle}
        aria-pressed={saved}
        aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <HeartIcon filled={saved} />
      </button>

      <style jsx>{`
        .wishlist-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .wishlist-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
        }
        .wishlist-btn.saved {
          color: var(--accent);
        }
      `}</style>
    </>
  );
}
