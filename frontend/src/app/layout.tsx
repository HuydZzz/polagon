import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

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
      <body className="min-h-screen">
        <Providers>
          <div className="grid-fade min-h-screen">
            <Navbar />
            <main className="pb-24 pt-6">{children}</main>
            <footer className="container-page pb-12 pt-8 text-xs text-text-dim">
              <div className="flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
                <p>
                  Polagon · open source ·{" "}
                  <a
                    href="https://github.com/HuydZzz/polagon"
                    className="underline hover:text-text"
                  >
                    GitHub
                  </a>
                </p>
                <p>
                  Native to{" "}
                  <span className="text-text-muted">Portaldot</span>
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
