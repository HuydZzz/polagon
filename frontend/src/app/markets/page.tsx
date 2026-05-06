"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MarketCard } from "@/components/MarketCard";
import { useMarkets } from "@/lib/hooks";
import type { Market } from "@/lib/types";

const CATEGORIES = [
  "All", "Crypto", "Portaldot", "AI", "Politics", "Macro", "Tech", "Sports",
] as const;
type Category = (typeof CATEGORIES)[number];

const SORTS = [
  { key: "volume", label: "Volume" },
  { key: "newest", label: "Newest" },
  { key: "closing", label: "Closing soon" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

function sortMarkets(markets: Market[], sort: SortKey): Market[] {
  const s = [...markets];
  if (sort === "volume") {
    s.sort((a, b) => Number(b.totalYes + b.totalNo - (a.totalYes + a.totalNo)));
  } else if (sort === "newest") {
    s.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sort === "closing") {
    s.sort((a, b) => a.endTime - b.endTime);
  }
  return s;
}

export default function MarketsPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <MarketsContent />
    </Suspense>
  );
}

function MarketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, fromMock } = useMarkets();

  const q = searchParams.get("q") ?? "";
  const cat = (searchParams.get("cat") ?? "All") as Category;
  const sort = (searchParams.get("sort") ?? "volume") as SortKey;

  function update(key: string, value: string, defaultVal: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (!value || value === defaultVal) {
      p.delete(key);
    } else {
      p.set(key, value);
    }
    router.replace(`/markets?${p.toString()}`, { scroll: false });
  }

  const { live, settled, total } = useMemo(() => {
    const all = data ?? [];
    const filtered = sortMarkets(
      all.filter((m) => {
        const matchCat = cat === "All" || m.category === cat;
        const matchQ =
          !q || m.question.toLowerCase().includes(q.toLowerCase());
        return matchCat && matchQ;
      }),
      sort,
    );
    return {
      live: filtered.filter((m) => m.status === "Open"),
      settled: filtered.filter((m) => m.status !== "Open"),
      total: filtered.length,
    };
  }, [data, cat, q, sort]);

  const hasFilter = q !== "" || cat !== "All";

  return (
    <div className="container-page pb-20">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-10">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Markets</h1>
          <p className="mt-2 text-text-muted">
            Stake POT on outcomes you trust. Parimutuel — pools split, payouts
            proportional.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Create market
        </Link>
      </header>

      {fromMock && <MockBanner />}

      {/* ── Filter bar ── */}
      <div className="mt-8 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
          >
            <path
              d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.87 3.74a5 5 0 1 1 .88-.88l2.87 2.88a.62.62 0 1 1-.88.88L9.13 10.24Z"
              fill="currentColor"
            />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => update("q", e.target.value, "")}
            placeholder="Search markets…"
            className="w-full rounded-lg border border-border bg-bg-subtle py-2.5 pl-9 pr-4 text-sm placeholder:text-text-dim focus:border-brand focus:outline-none"
          />
          {q && (
            <button
              onClick={() => update("q", "", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category chips + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => update("cat", c, "All")}
                className={
                  cat === c
                    ? "inline-flex items-center rounded-full border border-brand/50 bg-brand/15 px-3 py-1 text-xs font-medium text-brand-300 transition"
                    : "inline-flex items-center rounded-full border border-border bg-bg-subtle px-3 py-1 text-xs text-text-muted transition hover:border-border/80 hover:text-text"
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-subtle p-0.5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => update("sort", s.key, "volume")}
                className={
                  sort === s.key
                    ? "rounded-md bg-bg-elev px-3 py-1.5 text-xs font-medium text-text transition"
                    : "rounded-md px-3 py-1.5 text-xs text-text-muted transition hover:text-text"
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && !fromMock && <SkeletonGrid />}

      {/* ── Live markets ── */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {live.length} live
          </span>
          {hasFilter && (
            <span className="text-text-dim">
              {total} result{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <MarketCard market={m} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {!isLoading && live.length === 0 && (
          <div className="card mt-3 px-6 py-12 text-center">
            <p className="text-text-muted">
              {hasFilter ? "No markets match your filter." : "No live markets yet."}
            </p>
            {!hasFilter && (
              <Link href="/create" className="btn-primary mt-4 inline-flex">
                Create the first one
              </Link>
            )}
            {hasFilter && (
              <button
                onClick={() => router.replace("/markets", { scroll: false })}
                className="btn-ghost mt-4"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Settled markets ── */}
      {settled.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
            Recently settled
          </h2>
          <AnimatePresence mode="popLayout">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {settled.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <MarketCard market={m} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}

function MockBanner() {
  return (
    <div className="mt-6 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-warning">
      <span className="font-mono">⚠ mock mode</span> — contracts not deployed
      yet. Run{" "}
      <code className="rounded bg-bg-elev px-1.5 py-0.5 text-text">
        make deploy
      </code>{" "}
      to switch to live data.
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-44 animate-pulse bg-bg-card/50" />
      ))}
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="container-page pb-20 pt-10">
      <div className="h-10 w-48 animate-pulse rounded-md bg-bg-card/50" />
      <div className="mt-8 h-10 animate-pulse rounded-lg bg-bg-card/50" />
      <SkeletonGrid />
    </div>
  );
}
