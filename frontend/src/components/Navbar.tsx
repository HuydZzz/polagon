"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { ChainBadge } from "./ChainBadge";

const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/polls", label: "Polls" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <Image
              src="/polagon-logo.png"
              alt="Polagon"
              width={32}
              height={32}
              priority
              className="h-7 w-7 transition group-hover:scale-105"
            />
            <span className="text-base font-semibold tracking-tight">
              Polagon
            </span>
            <ChainBadge />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded-md px-3 py-1.5 text-sm text-text transition"
                      : "rounded-md px-3 py-1.5 text-sm text-text-muted transition hover:bg-bg-elev hover:text-text"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="flex items-center gap-2">
            <Link href="/create" className="btn-ghost hidden sm:inline-flex">
              Create market
            </Link>
            <ConnectWalletButton />
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted transition hover:bg-bg-elev hover:text-text sm:hidden"
            >
              <span className="sr-only">Menu</span>
              {menuOpen ? (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M2 2l11 11M13 2L2 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M2 4h11M2 7.5h11M2 11h11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-30 bg-bg/60 backdrop-blur-sm sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMenuOpen(false)}
            />
            {/* Panel */}
            <motion.div
              className="fixed inset-x-0 top-16 z-40 border-b border-border bg-bg-card px-5 pb-6 pt-4 sm:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        active
                          ? "rounded-lg px-4 py-3 text-sm font-medium text-text"
                          : "rounded-lg px-4 py-3 text-sm text-text-muted hover:bg-bg-elev hover:text-text"
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 border-t border-border pt-4">
                <Link
                  href="/create"
                  className="btn-primary w-full justify-center"
                >
                  Create market
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
