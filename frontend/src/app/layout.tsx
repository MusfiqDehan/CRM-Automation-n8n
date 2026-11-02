import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
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
      <body className={`${urbanist.className} min-h-screen bg-[#f7f7f5] text-slate-900 transition-colors duration-200 dark:bg-[#0b0f19] dark:text-slate-100 antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
