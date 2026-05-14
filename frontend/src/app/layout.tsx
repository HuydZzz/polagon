import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Polagon — Predict. Stake. Earn reputation that follows you.",
  description:
    "Decentralized prediction markets, polls, and soulbound reputation, native to Portaldot. Built for Portaldot Mini Hackathon Season 1.",
  metadataBase: new URL("https://polagon.app"),
  openGraph: {
    title: "Polagon",
    description:
      "Decentralized prediction markets, polls, and soulbound reputation, native to Portaldot.",
    url: "https://polagon.app",
    siteName: "Polagon",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Google+Sans:400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Providers>
          <div className="grid-fade min-h-screen">
            <Navbar />
            <main className="pb-24 pt-6">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
