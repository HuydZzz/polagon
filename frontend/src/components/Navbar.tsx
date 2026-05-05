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
        <Link href="/" className="flex items-center gap-2.5 group">
          <Hexmark />
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

function Hexmark() {
  return (
    <svg
      width="24"
      height="26"
      viewBox="0 0 24 26"
      className="transition group-hover:rotate-12"
      aria-hidden
    >
      <defs>
        <linearGradient id="polagon-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <polygon
        points="12,1 23,7.5 23,18.5 12,25 1,18.5 1,7.5"
        fill="url(#polagon-grad)"
        stroke="rgba(255,255,255,0.15)"
      />
      <polygon
        points="12,7 17,10 17,16 12,19 7,16 7,10"
        fill="rgba(10,10,15,0.85)"
      />
    </svg>
  );
}
