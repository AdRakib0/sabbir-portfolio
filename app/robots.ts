import type { MetadataRoute } from "next";

const siteUrl = "https://islamsabbir.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /admin is left crawlable so its noindex tag is seen; API routes are blocked.
      disallow: "/api/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
