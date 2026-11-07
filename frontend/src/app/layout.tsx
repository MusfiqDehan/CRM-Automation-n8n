import type { Metadata } from "next";
import { headers } from "next/headers";
import { Urbanist } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/ThemeContext";
import { StructuredDataAndHeadSync } from "@/components/seo/StructuredDataAndHeadSync";
import { resolveSeoContext } from "@/lib/seo";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "beamline.musfiqdehan.com";
  const seo = await resolveSeoContext(host);

  return {
    metadataBase: new URL(`${seo.protocol}://${seo.host}`),
    title: {
      default: seo.title,
      template: `%s | ${seo.brandName}`,
    },
    description: seo.description,
    applicationName: seo.brandName,
    keywords: [
      "construction crm",
      "custom home builder software",
      "white label construction portal",
      "invoice deduplication",
      "4-phase build execution",
      "residential contractor operations",
      "beamline construction os",
    ],
    authors: [{ name: "Musfiq Dehan", url: "https://musfiqdehan.com" }],
    creator: seo.brandName,
    publisher: seo.brandName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
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
          alt: `${seo.brandName} Social Cover`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.ogImageUrl],
      creator: "@musfiqdehan",
    },
    icons: {
      icon: [
        { url: seo.logoUrl },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      shortcut: [seo.logoUrl],
      apple: [seo.logoUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "beamline.musfiqdehan.com";
  const seo = await resolveSeoContext(host);

  return (
    <html lang="en" className={urbanist.variable} suppressHydrationWarning>
      <head>
        <StructuredDataAndHeadSync seo={seo} />
      </head>
      <body
        className={`${urbanist.className} min-h-screen bg-stone-50 text-stone-900 transition-colors duration-200 dark:bg-stone-950 dark:text-stone-100 antialiased`}
      >
        <Script id="theme-bootstrap" strategy="beforeInteractive">{`
          try {
            const saved = localStorage.getItem("beamline_theme") || localStorage.getItem("kevin_theme") || "system";
            const dark = saved === "dark" || (saved === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
            document.documentElement.classList.toggle("dark", dark);
          } catch {}
        `}</Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
