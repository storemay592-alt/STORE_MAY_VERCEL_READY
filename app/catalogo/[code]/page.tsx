import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogGallery } from "@/components/catalog/CatalogGallery";
import { ProductViewTracker, WhatsAppConsultButton } from "@/components/catalog/ProductEngagement";
import { JsonLd } from "@/components/JsonLd";
import { PremiumHeader } from "@/components/PremiumHeader";
import { getCatalogProductByCode } from "@/lib/catalog-products";
import { absoluteUrl } from "@/lib/site";
import "../catalogo.css";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" });
const labels = { disponible: "Disponible", agotado: "Agotado", bajo_confirmacion: "Confirmar disponibilidad" } as const;

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const product = await getCatalogProductByCode((await params).code);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: `${product.name} | ${product.code}`,
    description: product.description || `Consulta ${product.name} de ${product.brand} en Store MAY.`,
    alternates: { canonical: `/catalogo/${product.code}` },
    openGraph: { images: product.imageUrls }
  };
}

export default async function CatalogProductPage({ params }: { params: Promise<{ code: string }> }) {
  const product = await getCatalogProductByCode((await params).code);
  if (!product) notFound();
  const message = encodeURIComponent(`Hola, quiero consultar por ${product.name} (código ${product.code})`);
  const number = (product.whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const whatsappHref = number ? `https://wa.me/${number}?text=${message}` : `https://api.whatsapp.com/send?text=${message}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    description: product.description,
    image: product.imageUrls,
    color: product.color,
    category: `${product.category} / ${product.type}`,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability: product.status === "agotado" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: absoluteUrl(`/catalogo/${product.code}`)
    }
  };

  return (
    <div className="catalog-page catalog-detail-page">
      <JsonLd data={structuredData} />
      <ProductViewTracker productId={product.id} />
      <PremiumHeader />
      <main>
        <nav className="catalog-breadcrumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link><span>/</span><Link href="/catalogo">Catálogo</Link><span>/</span><span aria-current="page">{product.code}</span>
        </nav>
        <div className="catalog-detail-layout">
          <CatalogGallery images={product.imageUrls} productName={product.name} />
          <section className="catalog-detail-copy">
            <div className="catalog-detail-title"><span>{product.brand} · {product.code}</span><h1>{product.name}</h1><p>{product.description}</p></div>
            <strong className="catalog-detail-price">{money.format(product.price)}</strong>
            <dl className="catalog-attributes">
              <div><dt>Marca</dt><dd>{product.brand}</dd></div>
              <div><dt>Categoría</dt><dd>{product.category}</dd></div>
              <div><dt>Tipo</dt><dd>{product.type}</dd></div>
              <div><dt>Color</dt><dd>{product.color}</dd></div>
              <div><dt>Género</dt><dd>{product.gender}</dd></div>
              <div><dt>Tallas disponibles</dt><dd>{product.sizesAvailable}</dd></div>
              <div><dt>Estado</dt><dd><span className={`catalog-detail-status is-${product.status}`}>{labels[product.status]}</span></dd></div>
            </dl>
            <WhatsAppConsultButton productId={product.id} href={whatsappHref} disabled={product.status === "agotado"} />
            <p className="catalog-detail-note">La compra se coordina por WhatsApp. No se realizan pagos dentro de esta página.</p>
            <p className="catalog-detail-note"><Link href="/politicas-compra#tabla-de-tallas">Consultar políticas de compra y tabla de tallas →</Link></p>
          </section>
        </div>
      </main>
      <footer className="catalog-footer">
        <span>© {new Date().getFullYear()} Store MAY</span>
        <nav aria-label="Información del producto">
          <Link href="/politicas-compra">Políticas de compra y tallas</Link>
          <Link href="/privacidad-cookies">Privacidad y cookies</Link>
          <Link href="/catalogo">Volver al catálogo</Link>
        </nav>
      </footer>
    </div>
  );
}
