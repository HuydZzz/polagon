"use client";

import { motion } from "framer-motion";
import { useMarkets } from "@/lib/hooks";
import { fmtPot, impliedOdds } from "@/lib/format";

export function MarketsTicker() {
  const { data } = useMarkets();
  const items = (data ?? []).slice(0, 8);
  if (items.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly.
  const looped = [...items, ...items];

  return (
    <div className="card relative mt-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-bg-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-bg-card to-transparent" />
      <motion.div
        className="flex gap-4 px-4 py-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {looped.map((m, i) => {
          const odds = impliedOdds(m.totalYes, m.totalNo);
          return (
            <div
              key={`${m.id}-${i}`}
              className="flex shrink-0 items-center gap-3 rounded-md border border-border bg-bg-subtle px-3 py-2 text-xs"
            >
              <span className="line-clamp-1 max-w-[280px] text-text-muted">
                {m.question}
              </span>
              <span className="font-mono tabular-nums text-success">
                {odds.yes.toFixed(0)}%
              </span>
              <span className="font-mono text-text-dim">
                {fmtPot(m.totalYes + m.totalNo)} POT
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
