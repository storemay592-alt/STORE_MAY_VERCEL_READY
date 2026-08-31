import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PremiumHeader } from "@/components/PremiumHeader";
import { products as editorialProducts } from "@/lib/catalog";
import { listCatalogProducts } from "@/lib/catalog-products";
import { absoluteUrl } from "@/lib/site";
import "./catalogo.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo de ropa, calzado y accesorios originales",
  description: "Explora el catálogo de Store MAY y consulta cada producto directamente por WhatsApp.",
  alternates: { canonical: "/catalogo" }
};

const statusLabels = { disponible: "Disponible", agotado: "Agotado", bajo_confirmacion: "Confirmar disponibilidad" } as const;
const money = new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" });

function normalizedProductName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es");
}

const commercialPrices = new Map(
  editorialProducts
    .filter((product) => product.precioOriginal)
    .map((product) => [normalizedProductName(product.nombre), product.precioOriginal as number])
);

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const category = first(params.categoria) ?? "";
  const type = first(params.tipo) ?? "";
  const color = first(params.color) ?? "";
  const search = (first(params.buscar) ?? "").trim().toLocaleLowerCase("es");
  const allProducts = await listCatalogProducts({ includeSoldOut: true });
  const products = allProducts.filter((product) => {
    const searchable = [product.name, product.brand, product.category, product.type, product.color]
      .join(" ")
      .toLocaleLowerCase("es");
    return (!category || product.category === category) &&
      (!type || product.type === type) &&
      (!color || product.color === color) &&
      (!search || searchable.includes(search));
  });
  const catalogCards = products.flatMap((product) => product.imageUrls.map((imageUrl, imageIndex) => ({
    product,
    imageUrl,
    imageIndex,
    href: `/catalogo/${product.code}?imagen=${imageIndex + 1}`
  })));
  const categories = [...new Set(allProducts.map((product) => product.category))].sort();
  const types = [...new Set(allProducts.map((product) => product.type))].sort();
  const colors = [...new Set(allProducts.map((product) => product.color))].sort();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catálogo Store MAY",
    numberOfItems: catalogCards.length,
    itemListElement: catalogCards.map(({ product, imageUrl, href }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        sku: product.code,
        description: product.description,
        image: imageUrl,
        brand: { "@type": "Brand", name: product.brand },
        url: absoluteUrl(href),
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: product.price,
          availability: product.status === "agotado" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
        }
      }
    }))
  };

  return (
    <div className="catalog-page">
      <JsonLd data={structuredData} />
      <PremiumHeader />
      <main>
        <nav className="catalog-breadcrumbs catalog-index-breadcrumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalogo">Catálogo</Link>
          {category ? (
            <>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{category}</span>
            </>
          ) : null}
        </nav>

        <section className="catalog-heading">
          <span>Store MAY · 100% original</span>
          <h1>{search ? "Resultados" : "Catálogo"}</h1>
          <p>Selecciona una pieza y consulta su disponibilidad directamente con nuestro asesor.</p>
        </section>

        <section className="catalog-toolbar" aria-label="Filtros del catálogo">
          <form action="/catalogo" method="get">
            {search ? <input type="hidden" name="buscar" value={search} /> : null}
            <label><span>Categoría</span><select name="categoria" defaultValue={category}><option value="">Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Tipo</span><select name="tipo" defaultValue={type}><option value="">Todos</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Color</span><select name="color" defaultValue={color}><option value="">Todos</option>{colors.map((item) => <option key={item}>{item}</option>)}</select></label>
            <button type="submit">Aplicar filtros</button>
            {category || type || color || search ? <Link href="/catalogo">Limpiar</Link> : null}
          </form>
          <span>{catalogCards.length === 1 ? "1 foto en catálogo" : `${catalogCards.length} fotos en catálogo`}</span>
        </section>

        {catalogCards.length ? (
          <section className="catalog-grid" aria-label="Productos del catálogo">
            {catalogCards.map(({ product, imageUrl, imageIndex, href }) => {
              const commercialPrice = product.brandPrice
                ?? commercialPrices.get(normalizedProductName(product.name));

              return (
                <article className="catalog-card" key={`${product.id}-foto-${imageIndex + 1}`}>
                <Link className="catalog-card-image" href={href}>
                  <img src={imageUrl} alt={`${product.type} ${product.gender} ${product.color}, foto ${imageIndex + 1}, Store MAY`} />
                  {product.status !== "disponible" ? <span>{statusLabels[product.status]}</span> : null}
                </Link>
                <div className="catalog-card-copy">
                  <span>{product.brand} · {product.code}{product.imageUrls.length > 1 ? ` · Foto ${imageIndex + 1} de ${product.imageUrls.length}` : ""}</span>
                  <h2><Link href={href}>{product.name}</Link></h2>
                  <p>{product.type} · {product.color}</p>
                  <p className="catalog-card-description">{product.description || `Modelo ${product.model}`}</p>
                  <div className="catalog-card-prices">
                    {commercialPrice ? (
                      <p className="catalog-card-price-line is-commercial">
                        <span>Precio comercial:</span>
                        <del>{money.format(commercialPrice)}</del>
                      </p>
                    ) : null}
                    <p className="catalog-card-price-line is-store-may">
                      <span>Precio Store MAY:</span>
                      <strong>{money.format(product.price)}</strong>
                    </p>
                  </div>
                  <Link className="catalog-card-action" href={href}>Ver producto <b>→</b></Link>
                </div>
              </article>
              );
            })}
          </section>
        ) : (
          <section className="catalog-empty"><span>MAY</span><h2>No hay productos con esos filtros.</h2><Link href="/catalogo">Ver todo el catálogo</Link></section>
        )}
      </main>
      <footer className="catalog-footer">
        <span>© {new Date().getFullYear()} Store MAY</span>
        <nav aria-label="Información del catálogo">
          <Link href="/politicas-compra">Políticas de compra y tallas</Link>
          <Link href="/privacidad-cookies">Privacidad y cookies</Link>
          <Link href="/">Volver al inicio</Link>
        </nav>
      </footer>
    </div>
  );
}
