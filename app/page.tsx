import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import StoreExperience from "@/components/StoreExperience";
import { faqs } from "@/data/faqs";
import { categories, productPath, products } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Store MAY | Moda, calzado y accesorios 100% originales" },
  description:
    "Descubre Store MAY: ropa, calzado, bolsos y accesorios para mujeres, hombres y niños de marcas internacionales 100% originales.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_US",
    siteName: "Store MAY",
    url: "/",
    title: "Store MAY | Multimarca premium 100% original",
    description:
      "Ropa, calzado, bolsos y accesorios originales para mujeres, hombres y niños.",
    images: [{ url: "/brand/store-may-logo.jpg", width: 1108, height: 511, alt: "Store MAY" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Store MAY | Multimarca premium 100% original",
    description: "Moda, calzado y accesorios de marcas internacionales 100% originales.",
    images: ["/brand/store-may-logo.jpg"]
  }
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ClothingStore",
      "@id": `${absoluteUrl("/")}#store`,
      name: "Store MAY",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/brand/store-may-logo.jpg"),
      image: absoluteUrl("/brand/store-may-logo.jpg"),
      description:
        "Tienda multimarca de ropa, calzado, bolsos y accesorios 100% originales para mujeres, hombres y niños.",
      currenciesAccepted: "USD",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Catálogo Store MAY",
        itemListElement: categories.map((category) => ({
          "@type": "OfferCatalog",
          name: category.label,
          url: absoluteUrl(`/tienda?categoria=${category.id}`)
        }))
      }
    },
    {
      "@type": "ItemList",
      name: "Productos disponibles en Store MAY",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${product.marca} ${product.nombre}`,
        url: absoluteUrl(productPath(product))
      }))
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    }
  ]
};

export default function Home() {
  return (
    <>
      <JsonLd data={structuredData} />
      <StoreExperience />
    </>
  );
}
