import Link from "next/link";
import { MarketCard } from "@/components/MarketCard";
import { MOCK_MARKETS } from "@/lib/markets";

export default function MarketsPage() {
  const live = MOCK_MARKETS.filter((m) => m.status === "Open");
  const settled = MOCK_MARKETS.filter((m) => m.status !== "Open");

  return (
    <div className="container-page">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-10">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Markets</h1>
          <p className="mt-2 text-text-muted">
            Stake POT on outcomes you trust. Parimutuel — pools split, payouts proportional.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Create market
        </Link>
      </header>

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {live.length} live
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </section>

      {settled.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
            Recently settled
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settled.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 rounded-md border border-border bg-bg-subtle px-4 py-3 text-xs text-text-dim">
        Showing seed data. Live testnet data lands on D10 of the roadmap (May 13).
        Wallet-signed actions land on D11.
      </p>
    </div>
  );
}
