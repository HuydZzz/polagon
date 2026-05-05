"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PollCard } from "@/components/PollCard";
import { usePolls } from "@/lib/hooks";

export default function PollsPage() {
  const { data, isLoading, fromMock } = usePolls();

  const live = (data ?? []).filter((p) => p.status === "Open");
  const closed = (data ?? []).filter((p) => p.status !== "Open");

  return (
    <motion.div
      className="container-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="flex flex-wrap items-end justify-between gap-4 pt-10">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Polls</h1>
          <p className="mt-2 max-w-xl text-text-muted">
            Lightweight community signaling. Cheap to deploy, sybil-resistant,
            and free of gambling — pure coordination, native to Portaldot.
          </p>
        </div>
        <Link href="/polls/create" className="btn-primary">
          Create poll
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
          {live.map((p) => (
            <PollCard key={p.id} poll={p} />
          ))}
        </div>
        {!isLoading && live.length === 0 && (
          <div className="card mt-3 px-6 py-12 text-center">
            <p className="text-text-muted">No active polls.</p>
            <Link href="/polls/create" className="btn-primary mt-4 inline-flex">
              Start one
            </Link>
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
            Recently closed
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((p) => (
              <PollCard key={p.id} poll={p} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function MockBanner() {
  return (
    <div className="mt-6 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-warning">
      <span className="font-mono">⚠ mock mode</span> — polls contract not
      deployed yet. Run <code className="rounded bg-bg-elev px-1.5 py-0.5 text-text">make deploy</code> to switch to live data.
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
