import Link from "next/link";
import { fmtPot, impliedOdds, type Market } from "@/lib/markets";

export function MarketCard({ market }: { market: Market }) {
  const odds = impliedOdds(market.totalYes, market.totalNo);
  const totalPool = market.totalYes + market.totalNo;
  const expiresIn = Math.max(0, market.endTime - Date.now());
  const days = Math.floor(expiresIn / 86_400_000);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="card group block p-5 transition hover:border-brand/50 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="pill">{market.category}</span>
        <StatusBadge status={market.status} outcome={market.outcome} />
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-medium leading-snug text-text">
        {market.question}
      </h3>

      <div className="mt-5 flex items-center gap-2">
        <OddsBar odds={odds} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-text-dim">
        <span className="font-mono">{fmtPot(totalPool)} POT pool</span>
        <span>
          {market.status === "Resolved"
            ? "Resolved"
            : days === 0
            ? "Expires today"
            : `${days}d left`}
        </span>
      </div>
    </Link>
  );
}

function OddsBar({ odds }: { odds: { yes: number; no: number } }) {
  return (
    <div className="flex w-full overflow-hidden rounded-md bg-bg-subtle">
      <div
        className="flex items-center justify-end bg-success/20 px-2 py-1.5 text-xs font-mono text-success"
        style={{ width: `${Math.max(odds.yes, 12)}%` }}
      >
        {odds.yes.toFixed(0)}%
      </div>
      <div
        className="flex items-center justify-start bg-danger/20 px-2 py-1.5 text-xs font-mono text-danger"
        style={{ width: `${Math.max(odds.no, 12)}%` }}
      >
        {odds.no.toFixed(0)}%
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  outcome,
}: {
  status: Market["status"];
  outcome?: boolean;
}) {
  if (status === "Open") {
    return (
      <span className="pill border-success/30 bg-success/10 text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Live
      </span>
    );
  }
  if (status === "Resolved") {
    return (
      <span className="pill border-brand/30 bg-brand/10 text-brand-200">
        Resolved · {outcome ? "YES" : "NO"}
      </span>
    );
  }
  return (
    <span className="pill border-warning/30 bg-warning/10 text-warning">
      Cancelled
    </span>
  );
}
