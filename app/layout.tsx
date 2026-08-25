import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Store MAY | Moda, calzado y accesorios 100% originales",
    template: "%s | Store MAY"
  },
  description:
    "Store MAY es un catálogo multimarca de ropa, calzado, bolsos y accesorios 100% originales de marcas internacionales.",
  applicationName: "Store MAY",
  keywords: [
    "Store MAY",
    "ropa original",
    "calzado original",
    "accesorios originales",
    "ropa para mujer",
    "ropa para hombre",
    "ropa para niños"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "es_US",
    siteName: "Store MAY",
    title: "Store MAY | Moda, calzado y accesorios 100% originales",
    description:
      "Una selección curada de moda, calzado y accesorios 100% originales.",
    images: [{ url: "/brand/store-may-logo.jpg", width: 1108, height: 511 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Store MAY | Multimarca premium",
    description: "Moda y accesorios 100% originales.",
    images: ["/brand/store-may-logo.jpg"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080909"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // A strict per-request CSP nonce requires dynamic rendering.
  await connection();

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Jost:wght@300;400;500&family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
