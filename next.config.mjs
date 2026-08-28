const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Store MAY embeds its two same-origin Spline stage routes. SAMEORIGIN keeps
  // external sites from framing the storefront while allowing those scenes.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-Download-Options", value: "noopen" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
    : [])
];

const privateHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 95, 100]
  },
  async headers() {
    const staticAssetHeaders = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/dashboard/:path*", headers: privateHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/api/:path*", headers: privateHeaders },
      // Video, image, font and brand assets are all filename-versioned
      // (e.g. store-may-0826-*), so it's safe to cache them long-term and
      // immutably: browsers/CDN stop re-fetching them on every visit,
      // which is what made the hero video feel heavy/slow to (re)load.
      { source: "/video/:path*", headers: staticAssetHeaders },
      { source: "/images/:path*", headers: staticAssetHeaders },
      { source: "/brand/:path*", headers: staticAssetHeaders },
      { source: "/catalog/:path*", headers: staticAssetHeaders },
      { source: "/fonts/:path*", headers: staticAssetHeaders },
      { source: "/spline/:path*", headers: staticAssetHeaders }
    ];
  }
};

export default nextConfig;
