"use client";

import { useEffect } from "react";
import type { ResolvedSeoContext } from "@/lib/seo";

interface StructuredDataAndHeadSyncProps {
  seo: ResolvedSeoContext;
}

export function StructuredDataAndHeadSync({ seo }: StructuredDataAndHeadSyncProps) {
  useEffect(() => {
    // Dynamic client-side document title sync
    if (typeof document !== "undefined" && seo.title) {
      document.title = seo.title;

      // Update favicon if custom logo URL is present
      if (seo.logoUrl) {
        let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!iconLink) {
          iconLink = document.createElement("link");
          iconLink.rel = "icon";
          document.head.appendChild(iconLink);
        }
        iconLink.href = seo.logoUrl;
      }

      // Update meta description
      let metaDesc = document.querySelector<HTMLMetaElement>("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = seo.description;

      // Update OpenGraph / Twitter tags for client route transitions
      const ogMetaMap: Record<string, string> = {
        "og:title": seo.title,
        "og:description": seo.description,
        "og:image": seo.ogImageUrl,
        "og:url": seo.canonicalUrl,
        "twitter:title": seo.title,
        "twitter:description": seo.description,
        "twitter:image": seo.ogImageUrl,
      };

      Object.entries(ogMetaMap).forEach(([prop, val]) => {
        const isTwitter = prop.startsWith("twitter:");
        const attr = isTwitter ? "name" : "property";
        let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}='${prop}']`);
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute(attr, prop);
          document.head.appendChild(tag);
        }
        tag.content = val;
      });
    }
  }, [seo]);

  const jsonLd = seo.isPlatform
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            name: seo.brandName,
            url: seo.canonicalUrl,
            image: seo.ogImageUrl,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: seo.description,
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "White-label client portals",
              "4-phase custom construction checklists",
              "Autonomous AI invoice deduplication",
              "Executive Notion OS triage sync",
            ],
          },
          {
            "@type": "Organization",
            name: seo.brandName,
            url: seo.canonicalUrl,
            logo: seo.logoUrl,
            sameAs: [
              "https://github.com/musfiqdehan",
              "https://musfiqdehan.com",
            ],
          },
        ],
      }
    : {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "HomeAndConstructionBusiness",
            name: seo.brandName,
            url: seo.canonicalUrl,
            image: seo.ogImageUrl,
            logo: seo.logoUrl,
            description: seo.description,
            priceRange: "$$$$",
            areaServed: "United States",
          },
          {
            "@type": "WebSite",
            name: `${seo.brandName} Private Client Portal`,
            url: seo.canonicalUrl,
            publisher: {
              "@type": "Organization",
              name: seo.brandName,
              logo: seo.logoUrl,
            },
          },
        ],
      };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

