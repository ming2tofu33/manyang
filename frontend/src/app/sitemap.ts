import type { MetadataRoute } from "next";

import { getIndexableEncyclopediaEntries, getSiteUrl } from "@/lib/seo-encyclopedia";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/encyclopedia`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...getIndexableEncyclopediaEntries().map((entry) => ({
      url: `${siteUrl}/encyclopedia/${entry.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
