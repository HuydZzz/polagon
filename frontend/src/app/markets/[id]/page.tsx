"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMarket } from "@/lib/hooks";
import { fmtPot, impliedOdds, shortAddr } from "@/lib/format";

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { data: market, isLoading, fromMock } = useMarket(
    Number.isFinite(id) ? id : undefined,
  );

  if (isLoading) {
    return (
      <div className="container-page pt-10">
        <div className="card h-72 animate-pulse bg-bg-card/50" />
      </div>
    );
  }
  if (!market) {
    return (
      <div className="container-page pt-10">
        <Link href="/markets" className="text-xs text-text-muted hover:text-text">
          ← All markets
        </Link>
        <div className="card mt-6 px-6 py-12 text-center">
          <p className="text-text-muted">Market not found.</p>
        </div>
      </div>
    );
  }

  const odds = impliedOdds(market.totalYes, market.totalNo);
  const total = market.totalYes + market.totalNo;
  const isResolved = market.status === "Resolved";

  return (
    <div className="container-page pt-10">
      <Link
        href="/markets"
        className="text-xs text-text-muted hover:text-text"
      >
        ← All markets
      </Link>

      {fromMock && (
        <p className="mt-4 rounded-md border border-warning/30 bg-warning/5 px-4 py-2 text-xs text-warning">
          mock mode — deploy contracts to see live data
        </p>
      )}

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="pill">{market.category}</span>
          <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {market.question}
          </h1>
          <p className="mt-2 text-xs text-text-dim">
            Created by {shortAddr(market.creator)} · Resolver {shortAddr(market.resolver)}
          </p>
        </div>

        <div className="card flex flex-col items-end px-5 py-4 text-right">
          <span className="text-xs uppercase tracking-wider text-text-dim">
            Pool
          </span>
          <span className="font-display text-3xl text-text">
            {fmtPot(total)}
          </span>
          <span className="font-mono text-xs text-text-muted">POT</span>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card p-6">
          <h2 className="text-sm uppercase tracking-wider text-text-muted">
            Implied odds
          </h2>
          <div className="mt-4 flex items-end gap-6">
            <Side
              label="YES"
              tone="success"
              pct={odds.yes}
              pool={market.totalYes}
            />
            <Side
              label="NO"
              tone="danger"
              pct={odds.no}
              pool={market.totalNo}
            />
          </div>
          <div className="mt-6 flex w-full overflow-hidden rounded-md bg-bg-subtle">
            <div
              className="flex h-3 items-center justify-end bg-success"
              style={{ width: `${Math.max(odds.yes, 6)}%` }}
            />
            <div
              className="flex h-3 items-center justify-start bg-danger"
              style={{ width: `${Math.max(odds.no, 6)}%` }}
            />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm uppercase tracking-wider text-text-muted">
            Place a bet
          </h2>
          <p className="mt-2 text-xs text-text-dim">
            Wallet signing wires up D3.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn-yes" disabled>
              Bet YES
            </button>
            <button className="btn-no" disabled>
              Bet NO
            </button>
          </div>
          <div className="mt-6 space-y-2 text-xs text-text-muted">
            <Row k="Status" v={isResolved ? `Resolved · ${market.outcome ? "YES" : "NO"}` : "Open"} />
            <Row k="Ends" v={new Date(market.endTime).toLocaleString()} />
            <Row k="Protocol fee" v="2.0%" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Side({
  label,
  tone,
  pct,
  pool,
}: {
  label: string;
  tone: "success" | "danger";
  pct: number;
  pool: bigint;
}) {
  return (
    <div className="flex-1">
      <div
        className={
          tone === "success"
            ? "text-xs uppercase tracking-wider text-success"
            : "text-xs uppercase tracking-wider text-danger"
        }
      >
        {label}
      </div>
      <div className="mt-1 font-display text-4xl text-text">
        {pct.toFixed(0)}%
      </div>
      <div className="mt-1 font-mono text-xs text-text-dim">
        {fmtPot(pool)} POT
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{k}</span>
      <span className="text-text">{v}</span>
    </div>
  );
}
