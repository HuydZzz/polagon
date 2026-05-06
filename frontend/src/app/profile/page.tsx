"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet } from "@/lib/wallet";
import { useReputation } from "@/lib/hooks";
import { fmtPot, pot, shortAddr } from "@/lib/format";
import { HexBadge } from "@/components/HexBadge";

const now = Date.now();
const day = 86_400_000;

// Open positions the demo user currently holds
const DEMO_POSITIONS = [
  {
    marketId: 1,
    question: "Will Portaldot mainnet launch before Q4 2026?",
    side: true,
    stake: pot(200),
    endTime: now + 120 * day,
  },
  {
    marketId: 5,
    question: "Will OpenAI release a new flagship model before Demo Day (May 31)?",
    side: false,
    stake: pot(100),
    endTime: now + 27 * day,
  },
  {
    marketId: 0,
    question: "Will BTC close above $200,000 on December 31, 2026?",
    side: true,
    stake: pot(300),
    endTime: now + 60 * day,
  },
];

// Settled markets
const DEMO_SETTLED = [
  {
    marketId: 9,
    question: "Will Polkadot JAM upgrade launch on mainnet before Q3 2026?",
    side: true,
    stake: pot(500),
    outcome: true,
    payout: pot(820),
  },
  {
    marketId: 4,
    question: "Will the Lakers make the 2026 NBA Finals?",
    side: false,
    stake: pot(150),
    outcome: false,
    payout: pot(248),
  },
];

// Demo account full stats (matches MOCK_LEADERBOARD rank 1)
const DEMO_STATS = {
  totalPredictions: 52,
  correctPredictions: 43,
  totalStaked: pot(12_400),
  totalWon: pot(4_820),
  currentStreak: 7,
  bestStreak: 9,
  lastActive: Date.now() - 86_400_000,
  score: 9_840,
  accuracyBps: 8300,
};

export default function ProfilePage() {
  const { active, connect, isConnecting, isDemoMode } = useWallet();
  const { data: liveStats } = useReputation(active?.address);

  const stats = isDemoMode ? DEMO_STATS : liveStats;
  const score = stats?.score ?? 0;
  const accuracy = stats ? stats.accuracyBps / 100 : 0;

  return (
    <motion.div
      className="container-page max-w-3xl pb-20 pt-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="font-display text-4xl tracking-tight">Polagon Score</h1>
      <p className="mt-2 text-text-muted">
        A soulbound, non-transferable record of every prediction you've made.
        Earned, never bought.
      </p>

      {/* ── Score card ── */}
      <div className="card relative mt-8 overflow-hidden p-8 sm:p-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-transparent to-accent/5" />
        <div className="grid items-center gap-8 sm:grid-cols-[auto,1fr]">
          <HexBadge score={score} accuracyPct={accuracy} size={156} />
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">
              {active
                ? isDemoMode
                  ? "Demo account"
                  : "Connected"
                : "Wallet"}
            </div>
            <div className="mt-1 font-display text-3xl text-text">
              {active
                ? isDemoMode
                  ? "Demo User"
                  : shortAddr(active.address)
                : "—"}
            </div>
            {active ? (
              <p className="mt-3 text-sm text-text-muted">
                {stats && stats.totalPredictions > 0
                  ? `${stats.correctPredictions} correct out of ${stats.totalPredictions} predictions.`
                  : "No predictions yet — go bet on a market and your score appears here."}
              </p>
            ) : (
              <button
                onClick={() => void connect()}
                className="btn-primary mt-4"
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat
          k="Accuracy"
          v={
            stats && stats.totalPredictions > 0
              ? `${accuracy.toFixed(0)}%`
              : "—"
          }
          tone="brand"
        />
        <Stat
          k="Predictions"
          v={stats ? String(stats.totalPredictions) : "—"}
        />
        <Stat
          k="Streak"
          v={stats && stats.currentStreak > 0 ? `${stats.currentStreak} 🔥` : "—"}
          tone={stats && stats.currentStreak >= 3 ? "success" : "neutral"}
        />
      </div>
      {stats && stats.totalPredictions > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat k="Total staked" v={`${fmtPot(stats.totalStaked)} POT`} />
          <Stat
            k="Total won"
            v={`${fmtPot(stats.totalWon)} POT`}
            tone="success"
          />
        </div>
      )}

      {/* ── Open Positions ── */}
      {isDemoMode && active && (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-text-muted">
              Open positions
            </h2>
            <span className="pill border-success/30 bg-success/10 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {DEMO_POSITIONS.length} active
            </span>
          </div>
          <div className="space-y-2">
            {DEMO_POSITIONS.map((p, i) => {
              const daysLeft = Math.max(
                0,
                Math.ceil((p.endTime - Date.now()) / 86_400_000),
              );
              return (
                <motion.div
                  key={p.marketId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.2 }}
                >
                  <Link
                    href={`/markets/${p.marketId}`}
                    className="card group flex items-center justify-between gap-4 p-4 transition hover:border-brand/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm text-text group-hover:text-brand-300">
                        {p.question}
                      </p>
                      <p className="mt-1 text-xs text-text-dim">
                        {daysLeft === 0 ? "Closes today" : `${daysLeft}d to resolve`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-xs text-text-muted">
                          {fmtPot(p.stake)} POT
                        </div>
                      </div>
                      <span
                        className={`pill shrink-0 ${
                          p.side
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-danger/30 bg-danger/10 text-danger"
                        }`}
                      >
                        {p.side ? "YES" : "NO"}
                      </span>
                      <span className="text-xs text-text-dim group-hover:text-text">
                        →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Settled / History ── */}
      {isDemoMode && active && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
            Settled
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-text-dim">
                  <th className="px-4 py-3 text-left">Market</th>
                  <th className="px-4 py-3 text-center">Side</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">
                    Stake
                  </th>
                  <th className="px-4 py-3 text-right">Result</th>
                  <th className="px-4 py-3 text-right">Payout</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_SETTLED.map((h, i) => {
                  const won = h.side === h.outcome;
                  return (
                    <motion.tr
                      key={h.marketId}
                      className="border-b border-border/50 last:border-0 hover:bg-bg-subtle/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 + 0.06 * i, duration: 0.2 }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/markets/${h.marketId}`}
                          className="line-clamp-1 text-xs text-text hover:text-brand-300"
                        >
                          {h.question}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`pill text-[10px] ${
                            h.side
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-danger/30 bg-danger/10 text-danger"
                          }`}
                        >
                          {h.side ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-xs text-text-muted sm:table-cell">
                        {fmtPot(h.stake)} POT
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs font-medium ${won ? "text-success" : "text-danger"}`}
                        >
                          {won ? "Win" : "Loss"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {won ? (
                          <span className="text-success">
                            +{fmtPot(h.payout)} POT
                          </span>
                        ) : (
                          <span className="text-text-dim">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="mt-10 rounded-md border border-border bg-bg-subtle px-4 py-3 text-xs text-text-dim">
        Score formula:{" "}
        <span className="font-mono">
          correct × 100 + won_pot + 2^min(streak, 5)
        </span>
        . v2 will weight by Brier score across the polls layer.
      </p>
    </motion.div>
  );
}

function Stat({
  k,
  v,
  tone = "neutral",
}: {
  k: string;
  v: string;
  tone?: "neutral" | "brand" | "success";
}) {
  const ring =
    tone === "brand"
      ? "border-brand/30"
      : tone === "success"
        ? "border-success/30"
        : "border-border";
  return (
    <motion.div
      className={`card px-4 py-3 ${ring}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="text-xs uppercase tracking-wider text-text-muted">
        {k}
      </div>
      <div className="mt-1 font-display text-2xl tabular-nums">{v}</div>
    </motion.div>
  );
}
