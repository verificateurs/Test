import { headers } from "next/headers";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Renders a `<script type="application/ld+json">` tag with the request's CSP nonce
 * (propagated by proxy.ts via the `x-nonce` header) so inline JSON-LD isn't blocked
 * by the `script-src 'self' 'nonce-...'` policy.
 */
export async function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // Escape "<" so a "</script>" inside admin-editable content (product name,
  // description...) can't prematurely close the tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

/** Builds a schema.org BreadcrumbList from the same items rendered by <Breadcrumb>. */
export function breadcrumbJsonLd(items: BreadcrumbItem[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${baseUrl}${item.href}` } : {}),
    })),
  };
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
      {items.map((item, index) => (
        <span key={index}>
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span style={{ color: "var(--text)" }}>{item.label}</span>
          )}
          {index < items.length - 1 ? " / " : null}
        </span>
      ))}
    </nav>
  );
}
