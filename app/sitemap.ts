import type { MetadataRoute } from "next";
import { productPath, products } from "@/lib/catalog";
import { listCatalogProducts } from "@/lib/catalog-products";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  let managedProducts: Awaited<ReturnType<typeof listCatalogProducts>> = [];
  try {
    managedProducts = await listCatalogProducts({ includeSoldOut: true });
  } catch {
    managedProducts = [];
  }

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      images: [absoluteUrl("/brand/store-may-logo.jpg")]
    },
    {
      url: absoluteUrl("/tienda"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: absoluteUrl("/catalogo"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.95
    },
    {
      url: absoluteUrl("/politicas-compra"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: absoluteUrl("/privacidad-cookies"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5
    },
    ...managedProducts.map((product) => ({
      url: absoluteUrl(`/catalogo/${product.code}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.imageUrls
    })),
    ...products.map((product) => ({
      url: absoluteUrl(productPath(product)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: [absoluteUrl(product.imagen)]
    }))
  ];
}
