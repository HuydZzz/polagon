import Image from "next/image";
import Link from "next/link";

const PRODUCT = [
  { href: "/markets", label: "Markets" },
  { href: "/polls", label: "Polls" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
];

const BUILD = [
  { href: "/integrate", label: "Build on PolagonScore" },
  {
    href: "https://github.com/HuydZzz/polagon",
    label: "GitHub repository ↗",
    external: true,
  },
  {
    href: "https://github.com/HuydZzz/polagon/blob/main/ARCHITECTURE.md",
    label: "Architecture spec ↗",
    external: true,
  },
  {
    href: "https://github.com/HuydZzz/polagon/blob/main/contracts/README.md",
    label: "Contracts README ↗",
    external: true,
  },
];

const ABOUT = [
  {
    href: "https://github.com/HuydZzz/polagon/blob/main/README.md",
    label: "Project README",
    external: true,
  },
  {
    href: "https://github.com/HuydZzz/polagon/blob/main/LICENSE",
    label: "MIT License",
    external: true,
  },
  {
    href: "https://portaldot-dev.readthedocs.io/en/latest/",
    label: "Portaldot Dev Docs ↗",
    external: true,
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-card/40">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[2fr,1fr,1fr,1fr]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/polagon-logo.png"
                alt="Polagon"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="text-base font-semibold tracking-tight text-text">
                Polagon
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-muted">
              Decentralized prediction markets, polls, and soulbound reputation
              — native to Portaldot. Open source under MIT.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="pill border-brand/40 bg-brand/10 text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Submitted to Portaldot Hackathon S1
              </span>
              <span className="pill">Built with Ink! 5.x</span>
            </div>
          </div>

          {/* Product */}
          <FooterCol title="Product" items={PRODUCT} />

          {/* For Builders */}
          <FooterCol title="For builders" items={BUILD} />

          {/* About */}
          <FooterCol title="About" items={ABOUT} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-text-dim sm:flex-row sm:items-center">
          <p>
            Polagon · MIT · ©{" "}
            <span className="font-mono">{new Date().getFullYear()}</span>
          </p>
          <p>
            Powered by{" "}
            <span className="text-text-muted">Portaldot</span> · POT-native gas
            & stake
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: Array<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-medium uppercase tracking-wider text-text-dim">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) =>
          item.external ? (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-text-muted transition hover:text-text"
              >
                {item.label}
              </a>
            </li>
          ) : (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-text-muted transition hover:text-text"
              >
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
