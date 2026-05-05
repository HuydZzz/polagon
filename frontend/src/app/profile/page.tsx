"use client";

import { useWallet } from "@/lib/wallet";
import { useReputation } from "@/lib/hooks";
import { fmtPot, shortAddr } from "@/lib/format";

export default function ProfilePage() {
  const { active } = useWallet();
  const { data: stats, fromMock } = useReputation(active?.address);

  const score = stats?.score ?? 0;
  const accuracy = stats ? stats.accuracyBps / 100 : 0;

  return (
    <div className="container-page max-w-3xl pt-10">
      <h1 className="font-display text-4xl tracking-tight">Polagon Score</h1>
      <p className="mt-2 text-text-muted">
        A soulbound, non-transferable record of every prediction you've made.
        Earned, never bought.
      </p>

      <div className="card mt-8 grid items-center gap-8 p-8 sm:grid-cols-[auto,1fr]">
        <ScoreHex score={score} />
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Your score
          </div>
          <div className="font-display text-6xl tracking-tight tabular-nums">
            {score}
          </div>
          <div className="mt-2 text-sm text-text-muted">
            {active
              ? `Connected as ${shortAddr(active.address)}`
              : "Connect your wallet to see your real score, accuracy, and streak."}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat
          k="Accuracy"
          v={stats && stats.totalPredictions > 0 ? `${accuracy.toFixed(0)}%` : "—"}
        />
        <Stat
          k="Predictions"
          v={stats ? String(stats.totalPredictions) : "—"}
        />
        <Stat
          k="Best streak"
          v={stats ? String(stats.bestStreak) : "—"}
        />
      </div>

      {stats && stats.totalPredictions > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Stat k="Total staked" v={`${fmtPot(stats.totalStaked)} POT`} />
          <Stat k="Total won" v={`${fmtPot(stats.totalWon)} POT`} />
        </div>
      )}

      {fromMock && (
        <p className="mt-6 rounded-md border border-warning/30 bg-warning/5 px-4 py-2 text-xs text-warning">
          mock mode — connect wallet + deploy contracts to see real reputation
        </p>
      )}

      <p className="mt-10 rounded-md border border-border bg-bg-subtle px-4 py-3 text-xs text-text-dim">
        Score formula: <span className="font-mono">correct × 100 + won_pot + 2^min(streak, 5)</span>.
        v2 will weight by Brier score across the polls layer.
      </p>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-text-muted">
        {k}
      </div>
      <div className="mt-1 font-display text-2xl tabular-nums">{v}</div>
    </div>
  );
}

function ScoreHex({ score }: { score: number }) {
  return (
    <svg width="120" height="132" viewBox="0 0 120 132">
      <defs>
        <linearGradient id="hex-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <polygon
        points="60,4 116,34 116,98 60,128 4,98 4,34"
        fill="none"
        stroke="url(#hex-grad)"
        strokeWidth="2"
      />
      <polygon
        points="60,18 102,42 102,90 60,114 18,90 18,42"
        fill="rgba(124,58,237,0.08)"
      />
      <text
        x="60"
        y="78"
        textAnchor="middle"
        fontFamily="Instrument Serif, Georgia, serif"
        fontSize="36"
        fill="white"
      >
        {score}
      </text>
    </svg>
  );
}
