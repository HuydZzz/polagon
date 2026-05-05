import Image from "next/image";
import Link from "next/link";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { ChainBadge } from "./ChainBadge";

const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/polls", label: "Polls" },
  { href: "/profile", label: "Profile" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
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

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-text-muted transition hover:bg-bg-elev hover:text-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/create" className="btn-ghost hidden sm:inline-flex">
            Create market
          </Link>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
