import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/cart", "/checkout", "/thank-you", "/search", "/favorites"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
