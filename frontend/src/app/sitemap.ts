import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveSeoContext } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "beamline.musfiqdehan.com";
  const seo = await resolveSeoContext(host);
  const now = new Date();

  if (seo.isPlatform) {
    const urls: MetadataRoute.Sitemap = [
      {
        url: `${seo.protocol}://${seo.host}/`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${seo.protocol}://${seo.host}/admin`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${seo.protocol}://${seo.host}/llms.txt`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      },
    ];

    // Include all active public tenants in platform sitemap
    for (const t of seo.publicTenants) {
      if (t.custom_domain) {
        urls.push({
          url: `https://${t.custom_domain}/`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.9,
        });
      } else {
        urls.push({
          url: `${seo.protocol}://${t.slug}.${seo.host}/`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.9,
        });
      }
    }

    return urls;
  }

  // Tenant subdomain / custom domain sitemap
  return [
    {
      url: seo.canonicalUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${seo.canonicalUrl.replace(/\/+$/, "")}/admin`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${seo.canonicalUrl.replace(/\/+$/, "")}/llms.txt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}

