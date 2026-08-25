import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { JsonLd } from "@/components/JsonLd";
import {
  getCategory,
  getProductByPath,
  productPath,
  productPrice,
  productSizes,
  products
} from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

type ProductPageProps = {
  params: Promise<{ categoria: string; subcategoria: string; producto: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({
    categoria: product.categoria,
    subcategoria: product.subcategoria,
    producto: product.slug
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { categoria, subcategoria, producto } = await params;
  const item = getProductByPath(categoria, subcategoria, producto);
  if (!item) notFound();

  const path = productPath(item);
  const title = `${item.marca} ${item.nombre} ${item.genero} ${item.color}`;

  return {
    title,
    description: item.descripcion,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_US",
      siteName: "Store MAY",
      url: path,
      title: `${title} | Store MAY`,
      description: item.descripcion,
      images: [{ url: item.imagen, alt: item.alt }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Store MAY`,
      description: item.descripcion,
      images: [item.imagen]
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { categoria, subcategoria, producto } = await params;
  const item = getProductByPath(categoria, subcategoria, producto);
  if (!item) notFound();

  const category = getCategory(item.categoria)!;
  const path = productPath(item);
  const galleryImages = [
    { src: item.imagen, alt: item.alt, label: "Producto" },
    ...(item.imagenModelo
      ? [{ src: item.imagenModelo, alt: `${item.nombre} en modelo Store MAY`, label: "En modelo" }]
      : []),
    ...(item.galeria ?? []).map((src, index) => ({
      src,
      alt: `${item.nombre} vista ${index + 2} Store MAY`,
      label: `Vista ${String(index + 2).padStart(2, "0")}`
    }))
  ];
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url: absoluteUrl(path),
    priceCurrency: "USD",
    availability: item.disponible
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: "Store MAY" }
  };

  if (item.precio !== null) offer.price = item.precio.toFixed(2);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${item.marca} ${item.nombre}`,
    image: galleryImages.map((image) => absoluteUrl(image.src)),
    description: item.descripcion,
    sku: item.id,
    color: item.color,
    category: `${category.label} > ${item.subcategoria}`,
    brand: { "@type": "Brand", name: item.marca },
    offers: offer
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: category.label,
        item: absoluteUrl("/#categorias")
      },
      { "@type": "ListItem", position: 3, name: item.nombre, item: absoluteUrl(path) }
    ]
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="product-route">
        <CatalogHeader />
        <main className="product-page section-shell">
        <nav className="breadcrumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/#categorias">{category.label}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{item.nombre}</span>
        </nav>

        <article className="product-detail">
          <ProductGallery images={galleryImages} />
          <div className="product-detail-copy">
            <p className="section-eyebrow">{item.marca} · 100% original</p>
            <h1>{item.nombre}</h1>
            <p className="product-description">{item.descripcion}</p>
            <dl className="product-facts">
              <div>
                <dt>Marca</dt>
                <dd>{item.marca}</dd>
              </div>
              <div>
                <dt>Categoría</dt>
                <dd>{category.label}</dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{item.subcategoria}</dd>
              </div>
              <div>
                <dt>Color</dt>
                <dd>{item.color}</dd>
              </div>
              <div>
                <dt>Género</dt>
                <dd>{item.genero}</dd>
              </div>
              <div>
                <dt>Precio</dt>
                <dd>{productPrice(item)}</dd>
              </div>
              <div>
                <dt>Tallas disponibles</dt>
                <dd>{productSizes(item)}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{item.disponible ? "Disponible bajo confirmación" : "Agotado"}</dd>
              </div>
            </dl>
            <Link className="product-consult" href="/#contacto">
              Consultar precio, talla y disponibilidad
            </Link>
            <p className="product-assurance">
              Selección Store MAY · Producto original · Atención personalizada
            </p>
          </div>
        </article>
        </main>
        <CatalogFooter />
      </div>
    </>
  );
}
