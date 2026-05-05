"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PollPanel } from "@/components/PollPanel";
import { useMyVote, usePoll } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { shortAddr } from "@/lib/format";

export default function PollDetailPage() {
  const params = useParams<{ id: string }>();
  const idNum = Number(params?.id);
  const id = Number.isFinite(idNum) ? idNum : undefined;
  const { active } = useWallet();

  const { data: poll, isLoading, fromMock, refresh: refreshPoll } = usePoll(id);
  const { data: myVote, refresh: refreshMyVote } = useMyVote(id, active?.address);

  const refresh = () => {
    refreshPoll();
    refreshMyVote();
  };

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
  if (!poll || id == null) {
    return (
      <div className="container-page pt-10">
        <Link href="/polls" className="text-xs text-text-muted hover:text-text">
          ← All polls
        </Link>
        <div className="card mt-6 px-6 py-12 text-center">
          <p className="text-text-muted">Poll not found.</p>
        </div>
      </div>
    );
  }

  const total = poll.votesPerOption.reduce((a, b) => a + b, 0);
  const days = Math.max(0, Math.ceil((poll.endTime - Date.now()) / 86_400_000));
  const isClosed = poll.status === "Closed" || Date.now() >= poll.endTime;

  return (
    <motion.div
      className="container-page pt-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Link href="/polls" className="text-xs text-text-muted hover:text-text">
        ← All polls
      </Link>

      {fromMock && (
        <p className="mt-4 rounded-md border border-warning/30 bg-warning/5 px-4 py-2 text-xs text-warning">
          mock mode — deploy contracts to see live data
        </p>
      )}

      <header className="mt-4 grid gap-6 lg:grid-cols-[1fr,auto] lg:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{poll.category}</span>
            {!isClosed ? (
              <span className="pill border-success/30 bg-success/5 text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {days === 0 ? "Closing today" : `${days}d to close`}
              </span>
            ) : (
              <span className="pill border-border text-text-muted">Closed</span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl leading-[1.1] tracking-tight sm:text-5xl">
            {poll.question}
          </h1>
          <p className="mt-3 text-xs text-text-dim">
            Created by {shortAddr(poll.creator)} · Closes{" "}
            {new Date(poll.endTime).toLocaleString()}
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-text-dim">
            Voters
          </div>
          <div className="mt-1 font-display text-4xl tabular-nums tracking-tight text-text">
            {poll.totalVoters.toLocaleString()}
          </div>
          <div className="font-mono text-xs text-text-muted">
            {total.toLocaleString()} votes
          </div>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card p-6">
          <h2 className="text-xs uppercase tracking-wider text-text-muted">
            Results
          </h2>
          <ul className="mt-5 space-y-3">
            {poll.options.map((opt, i) => {
              const votes = poll.votesPerOption[i] ?? 0;
              const pct = total > 0 ? (votes / total) * 100 : 0;
              return (
                <li key={i}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text">{opt}</span>
                    <span className="font-mono tabular-nums text-text-muted">
                      {pct.toFixed(1)}%{" "}
                      <span className="text-text-dim">({votes})</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brand to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 2)}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <PollPanel poll={poll} myVote={myVote} onChange={refresh} />
      </section>
    </motion.div>
  );
}
