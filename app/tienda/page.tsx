import type { Metadata } from "next";
import Link from "next/link";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import { JsonLd } from "@/components/JsonLd";
import { PremiumHeader } from "@/components/PremiumHeader";
import {
  productPath,
  products as editorialProducts,
  type CategoryId
} from "@/lib/catalog";
import { listCatalogProducts } from "@/lib/catalog-products";
import type { ProductCategory } from "@/lib/product-model";
import { absoluteUrl } from "@/lib/site";
import "./tienda.css";

export const dynamic = "force-dynamic";

const categoryFilters = [
  { slug: "todos", label: "Todo", value: null },
  { slug: "mujeres", label: "Mujeres", value: "Mujer" },
  { slug: "hombres", label: "Hombres", value: "Hombre" },
  { slug: "ninos", label: "Niños", value: "Niños" },
  { slug: "accesorios", label: "Accesorios", value: "Accesorios" }
] as const;

type PageProps = {
  searchParams: Promise<{
    categoria?: string | string[];
    buscar?: string | string[];
    ordenar?: string | string[];
  }>;
};

type CatalogProduct = {
  id: string;
  nombre: string;
  marca: string;
  categoria: ProductCategory;
  imagenUrl: string;
  imagenModeloUrl: string | null;
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

const categoryName: Record<CategoryId, ProductCategory> = {
  mujeres: "Mujer",
  hombres: "Hombre",
  ninos: "Niños",
  accesorios: "Accesorios"
};

const localCatalog: CatalogProduct[] = editorialProducts.map((product) => ({
  id: product.id,
  nombre: product.nombre,
  marca: product.marca,
  categoria: categoryName[product.categoria],
  imagenUrl: product.imagen,
  imagenModeloUrl: product.imagenModelo ?? null,
  alt: product.alt,
  precioOriginal: product.precioOriginal ?? null,
  precioVenta: product.precio,
  precioNota: product.precioNota,
  tallas: product.tallas,
  tallasNota: product.tallasNota,
  stock: product.disponible ? 1 : 0,
  stockExacto: false,
  href: productPath(product)
}));

async function listStorefrontProducts(): Promise<CatalogProduct[]> {
  try {
    const managedProducts = await listCatalogProducts({ includeSoldOut: true });
    if (managedProducts.length > 0) {
      return managedProducts.map((product) => ({
        id: product.id,
        nombre: product.name,
        marca: product.brand || "Store MAY",
        categoria: (product.category as ProductCategory) || "Mujer",
        imagenUrl: product.imageUrls[0] || "/brand/store-may-logo.jpg",
        imagenModeloUrl: product.imageUrls[1] ?? null,
        alt: `${product.name} ${product.brand} Store MAY`,
        precioOriginal: product.brandPrice,
        precioVenta: product.price,
        precioNota: "Precio Store MAY",
        tallas: product.sizesAvailable ? product.sizesAvailable.split(",").map((s) => s.trim()).filter(Boolean) : ["Consultar"],
        tallasNota: "Consulta las tallas disponibles para este producto",
        stock: product.status === "agotado" ? 0 : 1,
        stockExacto: true,
        href: `/catalogo/${product.code}`
      }));
    }
    return localCatalog;
  } catch {
    return localCatalog;
  }
}

function selectedFilter(value: string | string[] | undefined) {
  const slug = Array.isArray(value) ? value[0] : value;
  return categoryFilters.find((item) => item.slug === slug) ?? categoryFilters[0];
}

const orderOptions = ["destacados", "precio-asc", "precio-desc", "nombre"] as const;
type OrderId = (typeof orderOptions)[number];

function selectedOrder(value: string | string[] | undefined): OrderId {
  const order = Array.isArray(value) ? value[0] : value;
  return orderOptions.includes(order as OrderId) ? (order as OrderId) : "destacados";
}

function sortProducts(products: CatalogProduct[], order: OrderId) {
  const result = [...products];

  if (order === "nombre") return result.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  if (order === "precio-asc") {
    return result.sort(
      (a, b) => (a.precioVenta ?? Number.POSITIVE_INFINITY) - (b.precioVenta ?? Number.POSITIVE_INFINITY)
    );
  }
  if (order === "precio-desc") {
    return result.sort((a, b) => (b.precioVenta ?? -1) - (a.precioVenta ?? -1));
  }

  return result;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filter = selectedFilter((await searchParams).categoria);
  const suffix = filter.value ? ` para ${filter.label.toLowerCase()}` : "";

  return {
    title: `Productos 100% originales${suffix}`,
    description: `Compra productos${suffix} seleccionados por Store MAY. Moda, calzado y accesorios de marcas 100% originales.`,
    alternates: {
      canonical: filter.value ? `/tienda?categoria=${filter.slug}` : "/tienda"
    }
  };
}

export default async function StorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = selectedFilter(params.categoria);
  const order = selectedOrder(params.ordenar);
  const rawSearch = Array.isArray(params.buscar) ? params.buscar[0] : params.buscar;
  const search = rawSearch?.trim().toLocaleLowerCase("es") ?? "";
  const allProducts = await listStorefrontProducts();
  const categoryProducts = filter.value
    ? allProducts.filter((product) => product.categoria === (filter.value as ProductCategory))
    : allProducts;
  const filteredProducts = search
    ? categoryProducts.filter((product) =>
        [product.nombre, product.categoria]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(search)
      )
    : categoryProducts;
  const products = sortProducts(filteredProducts, order);
  const catalogTitle = search
    ? `Resultados para “${rawSearch?.trim()}”`
    : filter.slug === "accesorios"
      ? "Variedad"
      : "Ropa, calzado y otros";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: filter.value ? `Productos para ${filter.label}` : "Productos Store MAY",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.nombre,
        image: product.imagenUrl,
        category: product.categoria,
        brand: { "@type": "Brand", name: product.marca },
        url: absoluteUrl(product.href ?? (filter.value ? `/tienda?categoria=${filter.slug}` : "/tienda")),
        ...(product.precioVenta !== null
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: product.precioVenta,
                availability:
                  product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: absoluteUrl(product.href ?? (filter.value ? `/tienda?categoria=${filter.slug}` : "/tienda"))
              }
            }
          : {})
      }
    }))
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Catálogo", item: absoluteUrl("/tienda") },
      ...(filter.value
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: filter.label,
              item: absoluteUrl(`/tienda?categoria=${filter.slug}`)
            }
          ]
        : [])
    ]
  };

  return (
    <div className="store-catalog-page">
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbStructuredData} />
      <PremiumHeader />

      <main>
        <section className="store-catalog-hero">
          <p>{filter.value ? `Selección para ${filter.label.toLowerCase()}` : "Store MAY · 100% original"}</p>
          <h1>{catalogTitle}</h1>
        </section>

        <section className="store-catalog-toolbar" aria-label="Navegación y orden del catálogo">
          <nav className="store-catalog-breadcrumbs" aria-label="Migas de pan">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/tienda">Catálogo</Link>
            {filter.value ? (
              <>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{filter.label}</span>
              </>
            ) : null}
          </nav>

          <form className="store-catalog-sort" action="/tienda" method="get">
            {filter.value ? <input type="hidden" name="categoria" value={filter.slug} /> : null}
            {rawSearch ? <input type="hidden" name="buscar" value={rawSearch} /> : null}
            <label htmlFor="catalog-order">Ordenar por</label>
            <select id="catalog-order" name="ordenar" defaultValue={order}>
              <option value="destacados">Destacados</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre</option>
            </select>
            <button type="submit">Aplicar</button>
          </form>

          <span className="store-catalog-count">
            {products.length === 1 ? "1 producto" : `${products.length} productos`}
          </span>
        </section>

        {products.length ? (
          <section className="store-product-grid" id="productos" aria-label="Productos disponibles">
            {products.map((product) => (
              <CatalogProductCard key={product.id} {...product} />
            ))}
          </section>
        ) : (
          <section className="store-catalog-empty">
            <span>MAY</span>
            <h2>Nuevas piezas están por llegar.</h2>
            <p>Vuelve pronto para descubrir la próxima selección 100% original.</p>
            {filter.value ? <Link href="/tienda">Ver todas las categorías</Link> : null}
          </section>
        )}
      </main>

      <footer className="store-catalog-footer">
        <span>© {new Date().getFullYear()} Store MAY</span>
        <Link href="/#preguntas-frecuentes">Preguntas frecuentes</Link>
      </footer>
    </div>
  );
}
