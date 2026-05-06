"use client";

import { motion } from "framer-motion";
import { fmtPot, shortAddr } from "@/lib/format";
import { MOCK_LEADERBOARD, type LeaderboardEntry } from "@/lib/leaderboard-mock";

const MEDAL = ["🥇", "🥈", "🥉"] as const;
const RANK_COLORS = [
  "border-yellow-500/40 bg-yellow-500/8",
  "border-slate-400/40 bg-slate-400/8",
  "border-amber-600/40 bg-amber-600/8",
] as const;
const SCORE_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-500"] as const;

export default function LeaderboardPage() {
  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const rest = MOCK_LEADERBOARD.slice(3);

  return (
    <motion.div
      className="container-page pb-20"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight">Leaderboard</h1>
            <p className="mt-2 text-text-muted">
              Top predictors on Portaldot, ranked by Polagon Score.
            </p>
          </div>
          <MockBanner />
        </div>
      </header>

      {/* ── Top 3 podium ── */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {top3.map((entry, i) => (
          <motion.div
            key={entry.rank}
            className={`card relative overflow-hidden border p-5 ${RANK_COLORS[i]}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{MEDAL[i]}</span>
              <span
                className={`font-display text-3xl font-bold tabular-nums ${SCORE_COLORS[i]}`}
              >
                {entry.score.toLocaleString()}
              </span>
            </div>
            <div className="mt-3">
              <div className="font-mono text-sm text-text">
                {shortAddr(entry.address)}
              </div>
              <div className="mt-1 font-mono text-xs text-text-dim">
                {entry.address.slice(0, 10)}…
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <Stat label="Accuracy" value={`${(entry.accuracyBps / 100).toFixed(0)}%`} />
              <Stat label="Predictions" value={String(entry.totalPredictions)} />
              <Stat label="Total won" value={`${fmtPot(entry.totalWonPot)} POT`} />
              <Stat
                label="Streak"
                value={
                  entry.currentStreak > 0
                    ? `${entry.currentStreak} 🔥`
                    : "–"
                }
              />
            </div>
          </motion.div>
        ))}
      </section>

      {/* ── Ranks 4–10 table ── */}
      <section className="mt-10">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3 text-left">Rank</th>
                <th className="px-5 py-3 text-left">Address</th>
                <th className="px-5 py-3 text-right">Score</th>
                <th className="hidden px-5 py-3 text-right sm:table-cell">
                  Accuracy
                </th>
                <th className="hidden px-5 py-3 text-right md:table-cell">
                  Predictions
                </th>
                <th className="hidden px-5 py-3 text-right lg:table-cell">
                  Total won
                </th>
                <th className="hidden px-5 py-3 text-right xl:table-cell">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {rest.map((entry, i) => (
                <motion.tr
                  key={entry.rank}
                  className="border-b border-border/50 transition hover:bg-bg-subtle/50"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.24 + i * 0.04, duration: 0.2 }}
                >
                  <td className="px-5 py-3.5 font-mono text-text-dim">
                    #{entry.rank}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-sm text-text">
                      {shortAddr(entry.address)}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                      {entry.address.slice(0, 12)}…
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-display font-semibold tabular-nums text-text">
                    {entry.score.toLocaleString()}
                  </td>
                  <td className="hidden px-5 py-3.5 text-right font-mono text-text-muted sm:table-cell">
                    {(entry.accuracyBps / 100).toFixed(0)}%
                  </td>
                  <td className="hidden px-5 py-3.5 text-right font-mono text-text-muted md:table-cell">
                    {entry.correctPredictions}/{entry.totalPredictions}
                  </td>
                  <td className="hidden px-5 py-3.5 text-right font-mono text-text-muted lg:table-cell">
                    {fmtPot(entry.totalWonPot)} POT
                  </td>
                  <td className="hidden px-5 py-3.5 text-right xl:table-cell">
                    {entry.currentStreak > 0 ? (
                      <span className="text-text">
                        {entry.currentStreak} 🔥
                      </span>
                    ) : (
                      <span className="text-text-dim">–</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Score formula explainer ── */}
      <section className="mt-12">
        <div className="card p-6">
          <h2 className="text-sm font-medium text-text">
            How Polagon Score works
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Score grows with <em>calibration</em>, not volume alone. Each
            correct prediction earns{" "}
            <span className="font-mono text-text">100 pts</span>. Every POT won
            adds <span className="font-mono text-text">1 pt</span> per POT.
            Consecutive correct predictions compound a streak bonus up to{" "}
            <span className="font-mono text-text">+32</span>. The score is
            soulbound — it cannot be transferred or bought.
          </p>
          <div className="mt-4 rounded-md bg-bg-subtle px-4 py-3 font-mono text-xs text-text-muted">
            score = correct × 100 + total_won_POT + 2
            <sup>min(streak, 5)</sup>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-xs text-text">{value}</div>
    </div>
  );
}

function MockBanner() {
  return (
    <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-1.5 text-[11px] text-warning">
      mock data
    </div>
  );
}
