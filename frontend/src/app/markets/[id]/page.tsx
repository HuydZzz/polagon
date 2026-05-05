import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtPot, getMarket, impliedOdds } from "@/lib/markets";

export default function MarketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const market = Number.isFinite(id) ? getMarket(id) : undefined;
  if (!market) notFound();

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

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="pill">{market.category}</span>
          <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {market.question}
          </h1>
          <p className="mt-2 text-xs text-text-dim">
            Created by {market.creator} · Resolver {market.resolver}
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
            Wallet signing lands D11. UI preview only.
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
            <Row
              k="Ends"
              v={new Date(market.endTime).toLocaleString()}
            />
            <Row k="Protocol fee" v="2.0%" />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-wider text-text-muted">
          Recent activity
        </h2>
        <div className="card mt-3 divide-y divide-border">
          {[
            { addr: "5Gw…E9Pa", side: "YES", amt: "120.0 POT", at: "2m ago" },
            { addr: "5Da…Vc2k", side: "NO", amt: "40.5 POT", at: "12m ago" },
            { addr: "5Hp…GZkr", side: "YES", amt: "80.0 POT", at: "1h ago" },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="font-mono text-text-muted">{row.addr}</span>
              <span
                className={
                  row.side === "YES" ? "text-success" : "text-danger"
                }
              >
                {row.side}
              </span>
              <span className="font-mono text-text">{row.amt}</span>
              <span className="text-xs text-text-dim">{row.at}</span>
            </div>
          ))}
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
