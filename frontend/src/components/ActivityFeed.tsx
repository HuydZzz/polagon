"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { fmtPot, shortAddr } from "@/lib/format";
import { isChainWired } from "@/lib/env";

export interface ActivityItem {
  id: string;
  bettor: string;
  side: boolean; // true=YES, false=NO
  amount: bigint;
  at: number;
}

export function ActivityFeed({
  marketId,
  initial,
}: {
  marketId: number;
  initial?: ActivityItem[];
}) {
  // In live mode this list will be replaced by a WebSocket subscription on
  // BetPlaced events (D9). For now, generate a deterministic mock and
  // periodically prepend a new fake bet so the UI feels alive.
  const seed = useMemo(() => seedFor(marketId), [marketId]);
  const [items, setItems] = useState<ActivityItem[]>(
    initial && initial.length > 0 ? initial : seed,
  );

  useEffect(() => {
    if (isChainWired) return; // real events take over
    const id = setInterval(() => {
      setItems((prev) => [genItem(prev[0]?.at ?? Date.now()), ...prev].slice(0, 14));
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-xs uppercase tracking-wider text-text-muted">
          Recent activity
        </h2>
        <span className="text-[10px] text-text-dim">
          {isChainWired ? "live" : "simulated"}
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li
              key={it.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="grid grid-cols-[1fr,auto,auto,auto] items-center gap-3 px-5 py-2.5 text-sm"
            >
              <span className="truncate font-mono text-text-muted">
                {shortAddr(it.bettor)}
              </span>
              <span
                className={
                  it.side
                    ? "rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success"
                    : "rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-danger"
                }
              >
                {it.side ? "YES" : "NO"}
              </span>
              <span className="font-mono tabular-nums text-text">
                {fmtPot(it.amount)}{" "}
                <span className="text-text-dim">POT</span>
              </span>
              <span className="text-[10px] text-text-dim">{relTime(it.at)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function relTime(t: number): string {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const SAMPLE_ADDRS = [
  "5GrwvaEFHneW46P1QqjvGc8tBxzAr8Y2vSQ8u",
  "5FHneW46wGXgs5VNyCzSAh5b1VFMQpV9wbv2",
  "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdDM",
  "5HGjWAeFDfFCWPsjFQdVV2Mez8B35NK2hd8gQ",
  "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndvCA",
  "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwGZkr",
];

function seedFor(marketId: number): ActivityItem[] {
  // deterministic seed for SSR/hydration parity
  let s = (marketId + 1) * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const now = Date.now();
  const out: ActivityItem[] = [];
  for (let i = 0; i < 8; i++) {
    out.push({
      id: `seed-${marketId}-${i}`,
      bettor: SAMPLE_ADDRS[Math.floor(rand() * SAMPLE_ADDRS.length)],
      side: rand() > 0.45,
      amount: BigInt(Math.floor(rand() * 200 + 5)) * 10n ** 12n,
      at: now - i * (60_000 + Math.floor(rand() * 240_000)),
    });
  }
  return out;
}

function genItem(_lastAt: number): ActivityItem {
  return {
    id: `gen-${Math.random().toString(36).slice(2)}`,
    bettor: SAMPLE_ADDRS[Math.floor(Math.random() * SAMPLE_ADDRS.length)],
    side: Math.random() > 0.45,
    amount: BigInt(Math.floor(Math.random() * 150 + 5)) * 10n ** 12n,
    at: Date.now(),
  };
}
