import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { CartLink } from "@/components/CartLink";
import { ComparatorLink } from "@/components/ComparatorLink";
import { GarageToggle } from "@/components/GarageToggle";
import { SearchBox } from "@/components/SearchBox";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand-mark">
          <span className="brand-mark-accent">DETAIL</span>IX
        </Link>
        <nav className="site-nav" aria-label="Navigation principale">
          <Link href="/categories">Catalogue</Link>
          <Link href="/vehicules">Par véhicule</Link>
          <Link href="/marques">Marques</Link>
          <Link href="/preparateurs">Préparateurs</Link>
          <Link href="/blog">Guides</Link>
          <Link href="/espace-pro">Espace pro</Link>
        </nav>
        <div className="header-actions">
          <SearchBox />
          <AccountMenu />
          <GarageToggle />
          <ComparatorLink />
          <CartLink />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          Contenu de démonstration — marques, produits, prix et avis d&apos;exemple pour prototypage. Données à valider
          avant mise en production.
        </p>
      </div>
    </footer>
  );
}

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumb container" aria-label="Fil d'Ariane">
      {items.map((item, i) => (
        <span key={i} style={{ margin: 0 }}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span style={{ margin: 0, color: "var(--text)" }}>{item.label}</span>}
          {i < items.length - 1 && <span aria-hidden="true">›</span>}
        </span>
      ))}
    </nav>
  );
}
