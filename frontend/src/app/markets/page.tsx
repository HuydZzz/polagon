"use client";

import Link from "next/link";
import { MarketCard } from "@/components/MarketCard";
import { useMarkets } from "@/lib/hooks";

export default function MarketsPage() {
  const { data, isLoading, fromMock } = useMarkets();

  const live = (data ?? []).filter((m) => m.status === "Open");
  const settled = (data ?? []).filter((m) => m.status !== "Open");

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

      {fromMock && <MockBanner />}
      {isLoading && !fromMock && <SkeletonGrid />}

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
        {!isLoading && live.length === 0 && (
          <div className="card mt-3 px-6 py-12 text-center">
            <p className="text-text-muted">No live markets yet.</p>
            <Link href="/create" className="btn-primary mt-4 inline-flex">
              Create the first one
            </Link>
          </div>
        )}
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
    </div>
  );
}

function MockBanner() {
  return (
    <div className="mt-6 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-warning">
      <span className="font-mono">⚠ mock mode</span> — contracts not deployed yet.
      Run <code className="rounded bg-bg-elev px-1.5 py-0.5 text-text">make deploy</code> to switch to live data.
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-44 animate-pulse bg-bg-card/50" />
      ))}
    </div>
  );
}
