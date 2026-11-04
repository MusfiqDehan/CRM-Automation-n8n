import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveSeoContext } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "beamline.musfiqdehan.com";
  const seo = await resolveSeoContext(host);
  const baseUrl = `${seo.protocol}://${seo.host}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og", "/llms.txt"],
        disallow: [
          "/api/v1/",
          "/_next/",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: ["/", "/llms.txt", "/api/og"],
        disallow: ["/api/v1/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

