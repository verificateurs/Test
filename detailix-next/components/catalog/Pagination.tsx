import Link from "next/link";
import type { CSSProperties } from "react";
import type { RawSearchParams } from "@/lib/catalog-query";

interface PaginationProps {
  page: number;
  totalPages: number;
  searchParams: RawSearchParams;
}

function buildHref(searchParams: RawSearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

type PageEntry = number | "ellipsis";

function getPageNumbers(page: number, totalPages: number): PageEntry[] {
  const delta = 2;
  const middle: number[] = [];
  for (let p = Math.max(2, page - delta); p <= Math.min(totalPages - 1, page + delta); p++) {
    middle.push(p);
  }

  const pages: PageEntry[] = [1];
  if (middle[0] > 2) pages.push("ellipsis");
  pages.push(...middle);
  if (middle[middle.length - 1] < totalPages - 1) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

// This is a Server Component (plain links, no interactivity needed) so it is styled with
// inline styles rather than `<style jsx>`, which Next.js only supports in Client Components.

const pageLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 36,
  height: 36,
  padding: "0 10px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text)",
  fontSize: "var(--text-sm)",
  background: "var(--bg-card)",
  textDecoration: "none",
};

const disabledStyle: CSSProperties = {
  ...pageLinkStyle,
  color: "var(--text-muted)",
  opacity: 0.5,
  cursor: "default",
};

const activeStyle: CSSProperties = {
  ...pageLinkStyle,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  /* #fff sur --accent ne tient qu'~3.8:1, sous les 4.5:1 requis en WCAG AA.
     Texte quasi-noir (--bg) sur --accent atteint ~5.2:1 (même traitement que .btn-primary dans globals.css). */
  color: "var(--bg)",
  fontWeight: 600,
};

const navStyle: CSSProperties = { ...pageLinkStyle, padding: "0 var(--space-md)" };
const navDisabledStyle: CSSProperties = { ...disabledStyle, padding: "0 var(--space-md)" };

export function Pagination({ page, totalPages, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}
    >
      {page > 1 ? (
        <Link href={buildHref(searchParams, page - 1)} style={navStyle}>
          ← Précédent
        </Link>
      ) : (
        <span style={navDisabledStyle} aria-disabled="true">
          ← Précédent
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} style={{ color: "var(--text-muted)", padding: "0 4px" }} aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(searchParams, p)}
              style={p === page ? activeStyle : pageLinkStyle}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          )
        )}
      </div>

      {page < totalPages ? (
        <Link href={buildHref(searchParams, page + 1)} style={navStyle}>
          Suivant →
        </Link>
      ) : (
        <span style={navDisabledStyle} aria-disabled="true">
          Suivant →
        </span>
      )}
    </nav>
  );
}
