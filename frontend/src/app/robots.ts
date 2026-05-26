import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo-encyclopedia";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/write", "/result", "/archive", "/morning", "/seed", "/loading"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
