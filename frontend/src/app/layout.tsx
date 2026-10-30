import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kevin's Construction OS — Luxury Residential Operations & Client Portal",
  description:
    "Connected Notion Sales CRM, 4-Phase Construction Project Management, and Autonomous AI Cost & Invoice Automation Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

