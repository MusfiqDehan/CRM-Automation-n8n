import type { Metadata } from "next";
import { headers } from "next/headers";
import { ClientLandingGate } from "@/components/landing/ClientLandingGate";
import { resolveSeoContext } from "@/lib/seo";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const tenantParam =
    typeof sp.tenant === "string" ? sp.tenant : undefined;

  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "beamline.musfiqdehan.com";
  const seo = await resolveSeoContext(host, tenantParam);

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: seo.canonicalUrl,
      title: seo.title,
      description: seo.description,
      siteName: seo.brandName,
      images: [
        {
          url: seo.ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${seo.brandName} Social Preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.ogImageUrl],
    },
  };
}

export default function HomePage() {
  return <ClientLandingGate />;
}
