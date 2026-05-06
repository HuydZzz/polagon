"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useMarket, usePosition } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { fmtPot, impliedOdds, shortAddr } from "@/lib/format";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BetPanel } from "@/components/BetPanel";
import { OddsChart } from "@/components/OddsChart";
import { PoolDonut } from "@/components/PoolDonut";

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const idNum = Number(params?.id);
  const id = Number.isFinite(idNum) ? idNum : undefined;
  const { active } = useWallet();

  const {
    data: market,
    isLoading,
    refresh: refreshMarket,
  } = useMarket(id);
  const { data: position, refresh: refreshPosition } = usePosition(
    id,
    active?.address,
  );

  // Optimistic pool state — updated immediately after a successful mock bet
  const [optimisticYes, setOptimisticYes] = useState<bigint | null>(null);
  const [optimisticNo, setOptimisticNo] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = () => {
    refreshMarket();
    refreshPosition();
  };

  function handleOptimisticBet(side: boolean, amount: bigint) {
    if (side) {
      setOptimisticYes((prev) => (prev ?? market!.totalYes) + amount);
    } else {
      setOptimisticNo((prev) => (prev ?? market!.totalNo) + amount);
    }
  }

  function shareMarket() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="container-page pt-10">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="card h-72 animate-pulse bg-bg-card/50" />
          <div className="card h-72 animate-pulse bg-bg-card/50" />
        </div>
      </div>
    );
  }
  if (!market || id == null) {
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

  // Merge optimistic values so every downstream component sees updated numbers
  const displayMarket = {
    ...market,
    totalYes: optimisticYes ?? market.totalYes,
    totalNo: optimisticNo ?? market.totalNo,
  };

  const odds = impliedOdds(displayMarket.totalYes, displayMarket.totalNo);
  const total = displayMarket.totalYes + displayMarket.totalNo;
  const isResolved = market.status === "Resolved";
  const days = Math.max(
    0,
    Math.ceil((market.endTime - Date.now()) / 86_400_000),
  );

  return (
    <motion.div
      className="container-page pb-20 pt-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between">
        <Link href="/markets" className="text-xs text-text-muted hover:text-text">
          ← All markets
        </Link>
        <button
          onClick={shareMarket}
          className="flex items-center gap-1.5 text-xs text-text-dim transition hover:text-text"
          title="Copy link"
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 6.5l3 3 6-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect
                  x="4.5"
                  y="1.5"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M8.5 8.5v2a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              Share
            </>
          )}
        </button>
      </div>

      <header className="mt-4 grid gap-6 lg:grid-cols-[1fr,auto] lg:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{market.category}</span>
            {!isResolved && (
              <span className="pill border-success/30 bg-success/5 text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {days === 0 ? "Closing today" : `${days}d to resolve`}
              </span>
            )}
            {isResolved && (
              <span className="pill border-brand/30 bg-brand/10 text-brand-200">
                Resolved · {market.outcome ? "YES" : "NO"}
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl leading-[1.1] tracking-tight sm:text-5xl">
            {market.question}
          </h1>
          <p className="mt-3 text-xs text-text-dim">
            Created by {shortAddr(market.creator)} · Resolver{" "}
            {shortAddr(market.resolver)} · Ends{" "}
            {new Date(market.endTime).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <PoolDonut yesPct={odds.yes} size={148} thickness={14} />
          <div>
            <div className="text-xs uppercase tracking-wider text-text-dim">
              Total pool
            </div>
            <motion.div
              key={String(total)}
              className="mt-1 font-display text-4xl tabular-nums tracking-tight text-text"
              initial={{ scale: 1.08, color: "#7C3AED" }}
              animate={{ scale: 1, color: "#F5F5F7" }}
              transition={{ duration: 0.4 }}
            >
              {fmtPot(total)}
            </motion.div>
            <div className="font-mono text-xs text-text-muted">POT</div>
          </div>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider text-text-muted">
                YES odds over time
              </h2>
              <span className="font-mono text-xs text-text-dim">
                {odds.yes.toFixed(0)}% now
              </span>
            </div>
            <div className="mt-3">
              <OddsChart
                currentYesPct={odds.yes}
                seed={market.id}
                height={180}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-text-dim">
              <span>
                created ·{" "}
                {new Date(
                  market.createdAt || market.endTime - 7 * 86_400_000,
                ).toLocaleDateString()}
              </span>
              <span>now</span>
            </div>
          </div>

          <ActivityFeed marketId={market.id} />
        </div>

        <div className="space-y-6">
          <BetPanel
            market={displayMarket}
            position={position}
            hasClaimed={false}
            onChange={refresh}
            onOptimisticBet={handleOptimisticBet}
          />

          <div className="card p-6 text-xs text-text-muted">
            <h3 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
              Pool composition
            </h3>
            <div className="space-y-2">
              <Bar
                label="YES"
                tone="success"
                pct={odds.yes}
                amount={displayMarket.totalYes}
              />
              <Bar
                label="NO"
                tone="danger"
                pct={odds.no}
                amount={displayMarket.totalNo}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <Stat k="Protocol fee" v="2.0%" />
              <Stat k="Creation fee" v="1 POT" />
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function Bar({
  label,
  tone,
  pct,
  amount,
}: {
  label: string;
  tone: "success" | "danger";
  pct: number;
  amount: bigint;
}) {
  const fill = tone === "success" ? "bg-success" : "bg-danger";
  const text = tone === "success" ? "text-success" : "text-danger";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className={text}>{label}</span>
        <span className="font-mono tabular-nums text-text-muted">
          {fmtPot(amount)} POT
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
        <motion.div
          className={`h-full ${fill}`}
          animate={{ width: `${Math.max(pct, 4)}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-text-dim">{k}</div>
      <div className="mt-0.5 text-text">{v}</div>
    </div>
  );
}
