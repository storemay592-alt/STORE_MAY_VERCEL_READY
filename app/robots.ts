import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/api"] },
      {
        userAgent: ["Googlebot", "Bingbot", "GPTBot", "ClaudeBot", "PerplexityBot"],
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api"]
      }
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/")
  };
}
