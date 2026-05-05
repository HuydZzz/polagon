"use client";

import { motion } from "framer-motion";
import { useWallet } from "@/lib/wallet";
import { useReputation } from "@/lib/hooks";
import { fmtPot, shortAddr } from "@/lib/format";
import { HexBadge } from "@/components/HexBadge";

export default function ProfilePage() {
  const { active, connect, isConnecting } = useWallet();
  const { data: stats } = useReputation(active?.address);

  const score = stats?.score ?? 0;
  const accuracy = stats ? stats.accuracyBps / 100 : 0;

  return (
    <motion.div
      className="container-page max-w-3xl pt-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="font-display text-4xl tracking-tight">Polagon Score</h1>
      <p className="mt-2 text-text-muted">
        A soulbound, non-transferable record of every prediction you've made.
        Earned, never bought.
      </p>

      <div className="card relative mt-8 overflow-hidden p-8 sm:p-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-transparent to-accent/5" />
        <div className="grid items-center gap-8 sm:grid-cols-[auto,1fr]">
          <HexBadge score={score} accuracyPct={accuracy} size={156} />
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">
              {active ? "Connected" : "Wallet"}
            </div>
            <div className="mt-1 font-display text-3xl text-text">
              {active ? shortAddr(active.address) : "—"}
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
          k="Best streak"
          v={stats ? String(stats.bestStreak) : "—"}
          tone={stats && stats.bestStreak >= 3 ? "success" : "neutral"}
        />
      </div>

      {stats && stats.totalPredictions > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat k="Total staked" v={`${fmtPot(stats.totalStaked)} POT`} />
          <Stat k="Total won" v={`${fmtPot(stats.totalWon)} POT`} tone="success" />
        </div>
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
      <div className="text-xs uppercase tracking-wider text-text-muted">{k}</div>
      <div className="mt-1 font-display text-2xl tabular-nums">{v}</div>
    </motion.div>
  );
}
