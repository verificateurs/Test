"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchBar } from "./SearchBar";
import { CartButton } from "./cart/CartButton";
import { GarageSelector } from "./garage/GarageSelector";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on outside click / Escape (keeps keyboard users in control)
  useEffect(() => {
    if (!menuOpen) return;

    function onClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Close the mobile menu automatically if the viewport grows back to desktop size
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const onChange = () => setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      ref={headerRef}
      className={`site-header${scrolled ? " scrolled" : ""}${menuOpen ? " menu-open" : ""}`}
    >
      <div className="container">
        <button
          ref={menuToggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="menu-toggle-bar" aria-hidden />
          <span className="menu-toggle-bar" aria-hidden />
          <span className="menu-toggle-bar" aria-hidden />
        </button>

        <Link href="/" className="logo" aria-label="Retour à l'accueil">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <path d="M8 22L14 10L20 18L24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
            Detailix
          </span>
        </Link>

        <nav id="main-nav" className="main-nav" aria-label="Navigation principale">
          <Link href="/categories/cosmetique-carrosserie" onClick={closeMenu}>Cosmétique</Link>
          <Link href="/categories/preparation-moteur" onClick={closeMenu}>Moteur</Link>
          <Link href="/categories/jantes-pneus" onClick={closeMenu}>Jantes</Link>
          <Link href="/categories/kits-carrosserie" onClick={closeMenu}>Carrosserie</Link>
          <Link href="/preparateurs" onClick={closeMenu}>Préparateurs</Link>
        </nav>

        <div className="header-actions">
          <div className="header-search-wrap">
            <SearchBar />
          </div>
          <GarageSelector />
          <CartButton />
          <Link href="/compte" className="btn btn-ghost btn-sm account-link" aria-label="Mon compte" onClick={closeMenu}>
            Compte
          </Link>
        </div>
      </div>

      <style jsx>{`
        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-shrink: 0;
        }
        .main-nav {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          font-size: var(--text-sm);
          font-weight: 500;
          white-space: nowrap;
        }
        .main-nav a {
          color: var(--text-muted);
          transition: color 0.15s;
        }
        .main-nav a:hover { color: var(--text); }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex: 1;
          justify-content: flex-end;
        }
        .header-search-wrap {
          flex: 1;
          min-width: 0;
          max-width: 320px;
        }

        .menu-toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0;
        }
        .menu-toggle:hover { background: var(--bg-elevated); }
        .menu-toggle-bar {
          display: block;
          width: 16px;
          height: 2px;
          background: var(--text);
          border-radius: 2px;
          transition: transform 0.2s var(--ease), opacity 0.2s var(--ease);
        }
        .menu-open .menu-toggle-bar:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .menu-open .menu-toggle-bar:nth-child(2) { opacity: 0; }
        .menu-open .menu-toggle-bar:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        @media (max-width: 768px) {
          .site-header {
            height: var(--header-h);
          }
          .site-header.menu-open {
            height: auto;
            padding-bottom: var(--space-md);
          }
          .site-header .container {
            flex-wrap: wrap;
            gap: var(--space-sm);
            row-gap: var(--space-md);
          }

          .menu-toggle { display: inline-flex; }

          .main-nav {
            display: none;
            order: 5;
            flex-basis: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-sm);
            padding-top: var(--space-md);
            border-top: 1px solid var(--border);
          }
          .site-header.menu-open .main-nav { display: flex; }

          .header-actions {
            display: contents;
          }
          .header-search-wrap,
          :global(.account-link) {
            display: none;
            order: 5;
            flex-basis: 100%;
            max-width: none;
          }
          .site-header.menu-open .header-search-wrap {
            display: block;
          }
          .site-header.menu-open :global(.account-link) {
            display: inline-flex;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
}
