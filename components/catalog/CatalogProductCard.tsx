"use client";

import Link from "next/link";
import { useState, type SyntheticEvent } from "react";

const catalogPriceFormatter = new Intl.NumberFormat("es-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

type CatalogProductCardProps = {
  nombre: string;
  marca: string;
  imagenUrl: string;
  imagenModeloUrl?: string | null;
  alt: string;
  precioOriginal: number | null;
  precioVenta: number | null;
  precioNota: string;
  tallas: string[];
  tallasNota: string;
  stock: number;
  stockExacto: boolean;
  href: string | null;
};

export function CatalogProductCard({
  nombre,
  marca,
  imagenUrl,
  imagenModeloUrl,
  alt,
  precioOriginal,
  precioVenta,
  precioNota,
  tallas,
  stock,
  stockExacto,
  href
}: CatalogProductCardProps) {
  const [showModel, setShowModel] = useState(false);
  const [mediaShape, setMediaShape] = useState<"portrait" | "square" | "landscape">("portrait");
  const hasModelView = Boolean(imagenModeloUrl);
  const activeImage = showModel && imagenModeloUrl ? imagenModeloUrl : imagenUrl;
  const commercialLabel =
    stockExacto && stock === 0
      ? "Agotado"
      : null;
  const sizeCopy = tallas.length ? `Tallas ${tallas.join(" · ")}` : null;

  const updateMediaShape = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    const ratio = naturalWidth / naturalHeight;
    setMediaShape(ratio > 1.18 ? "landscape" : ratio < 0.84 ? "portrait" : "square");
  };

  return (
    <article className="store-product-card">
      <div className={`store-product-media is-${mediaShape}`}>
        {hasModelView ? (
          <button
            className={`store-product-image-toggle ${showModel ? "is-model-view" : ""}`}
            type="button"
            aria-pressed={showModel}
            aria-label={showModel ? `Ver foto de producto de ${nombre}` : `Ver ${nombre} en modelo`}
            onClick={() => setShowModel((current) => !current)}
          >
            <img
              key={activeImage}
              src={activeImage}
              alt={showModel ? `${nombre} en modelo Store MAY` : alt}
              onLoad={updateMediaShape}
            />
            <span>{showModel ? "Ver producto" : "Ver en modelo"}</span>
          </button>
        ) : href ? (
          <Link className="store-product-image-link" href={href} aria-label={`Ver ${nombre}`}>
            <img src={activeImage} alt={alt} onLoad={updateMediaShape} />
          </Link>
        ) : (
          <div className="store-product-image-static">
            <img src={activeImage} alt={alt} onLoad={updateMediaShape} />
          </div>
        )}
        {commercialLabel ? <strong className="store-product-badge">{commercialLabel}</strong> : null}
      </div>

      <div className="store-product-copy">
        <p className="store-product-brand">{marca}</p>
        <h2>{href ? <Link href={href}>{nombre}</Link> : nombre}</h2>

        <div className="store-product-prices">
          {precioVenta === null ? (
            <strong className="is-consultation">{precioNota}</strong>
          ) : (
            <>
              {precioOriginal ? (
                <p className="store-product-price-line is-commercial">
                  <span>Precio comercial:</span>
                  <del>{catalogPriceFormatter.format(precioOriginal)}</del>
                </p>
              ) : null}
              <p className="store-product-price-line is-store-may">
                <span>Precio Store MAY:</span>
                <strong>{catalogPriceFormatter.format(precioVenta)}</strong>
              </p>
            </>
          )}
        </div>

        {sizeCopy ? <p className="store-product-meta">{sizeCopy}</p> : null}
        {stockExacto && stock > 0 && stock <= 3 ? (
          <p className="store-product-stock">{stock} disponibles</p>
        ) : null}

        <Link className="store-product-cta" href={href ?? "/#contacto"}>
          {href ? "Ver producto" : "Consultar disponibilidad"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
