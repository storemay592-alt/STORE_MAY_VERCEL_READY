"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { categories } from "@/lib/catalog";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="m16 16 4.2 4.2" />
      <path className="search-spark" d="M18.4 2.8v3.4M16.7 4.5h3.4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 5.9c-2-2-5.3-1.9-7.2.2L12 7.8l-1.6-1.7C8.5 4 5.2 3.9 3.2 5.9c-2.1 2.1-2 5.5.1 7.5L12 22l8.7-8.6c2.1-2 2.2-5.4.1-7.5Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 8.2h13.6l.8 12.1H4.4l.8-12.1Z" />
      <path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

export function PremiumHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.toggle("premium-menu-is-open", menuOpen);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("premium-menu-is-open");
    };
  }, [menuOpen]);

  return (
    <>
      <header className="premium-header" aria-label="Navegación principal de Store MAY">
        <Link className="premium-header-brand" href="/" aria-label="Store MAY, ir al inicio">
          <Image
            src="/brand/store-may-header.webp"
            alt="Store MAY"
            width={900}
            height={386}
            priority
          />
        </Link>

        <nav className="premium-desktop-nav" aria-label="Categorías principales">
          {categories.map((category) => (
            <Link key={category.id} href={`/tienda?categoria=${category.id}`}>
              {category.label}
            </Link>
          ))}
          <Link className="premium-original-link" href="/#marcas">
            100% Original
          </Link>
        </nav>

        <div className="premium-header-actions">
          <span className="premium-store-status">Tienda online</span>
          <form className="premium-search" action="/tienda" method="get" role="search">
            <SearchIcon />
            <input
              type="search"
              name="buscar"
              placeholder="Buscar"
              aria-label="Buscar productos"
              autoComplete="off"
            />
          </form>

          <Link
            className="premium-icon-action premium-heart-action"
            href="/#contacto"
            aria-label="Atención personalizada"
            title="Atención personalizada"
          >
            <HeartIcon />
          </Link>
          <Link
            className="premium-icon-action"
            href="/tienda"
            aria-label="Ver catálogo de productos"
            title="Ver catálogo"
          >
            <BagIcon />
          </Link>
          <button
            className={`premium-menu-toggle ${menuOpen ? "is-active" : ""}`}
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="premium-mobile-panel"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`premium-mobile-panel ${menuOpen ? "is-open" : ""}`}
        id="premium-mobile-panel"
        aria-hidden={!menuOpen}
      >
        <form className="premium-mobile-search" action="/tienda" method="get" role="search">
          <SearchIcon />
          <input
            type="search"
            name="buscar"
            placeholder="¿Qué estás buscando?"
            aria-label="Buscar productos"
            tabIndex={menuOpen ? 0 : -1}
            autoComplete="off"
          />
        </form>
        <nav aria-label="Categorías para móvil">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/tienda?categoria=${category.id}`}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {category.label}
              <i aria-hidden="true">↗</i>
            </Link>
          ))}
        </nav>
        <div className="premium-mobile-footer">
          <span>Multimarca premium</span>
          <Link href="/#contacto" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            Atención personalizada
          </Link>
          <Link href="/privacidad-cookies" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            Privacidad y cookies
          </Link>
        </div>
      </div>
    </>
  );
}
