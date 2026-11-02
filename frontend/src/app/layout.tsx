import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/ThemeContext";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: "BeamLine — Multi-Tenant Construction CRM & Autonomous Operations OS",
  description:
    "White-labeled CRM, 4-phase project execution, autonomous invoice deduplication, and executive triage for high-value custom home builders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={urbanist.variable} suppressHydrationWarning>
      <body className={`${urbanist.className} min-h-screen bg-stone-50 text-stone-900 transition-colors duration-200 dark:bg-stone-950 dark:text-stone-100 antialiased`}>
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
