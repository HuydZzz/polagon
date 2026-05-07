"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { fmtPot, shortAddr } from "@/lib/format";
import { isChainWired } from "@/lib/env";

export interface ActivityItem {
  id: string;
  bettor: string;
  side: boolean;
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
  const seed = useMemo(() => seedFor(marketId), [marketId]);
  const [items, setItems] = useState<ActivityItem[]>(
    initial && initial.length > 0 ? initial : seed,
  );

  useEffect(() => {
    if (isChainWired) return;
    // Vary the interval so it feels organic, not robotic
    let timeout: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = 3_200 + Math.random() * 4_800; // 3.2 – 8s
      timeout = setTimeout(() => {
        setItems((prev) => [genItem(), ...prev].slice(0, 16));
        schedule();
      }, delay);
    }
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-xs uppercase tracking-wider text-text-muted">
          Recent activity
        </h2>
        <span className="flex items-center gap-1.5 text-[10px] text-text-dim">
          {isChainWired ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              live
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand/60" />
              simulated
            </>
          )}
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li
              key={it.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="grid grid-cols-[1fr,auto,auto,auto] items-center gap-3 px-5 py-2.5 text-sm"
            >
              <span className="truncate font-mono text-xs text-text-muted">
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

// Wider set of realistic addresses
const SAMPLE_ADDRS = [
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  "5DAAnrj7yqkTmcJsEfaJEoU6pYSnAXe2qJBkxFhRjjFaxErD",
  "5HGjWAeFDfA9dn1gFkANhKVHwk9hkFJfj9sNUCZ3WEqBB1U",
  "5CiPPseXFQRzNFt2sdWv5WBKVvBZEtFEp41smpNUGXC8JMTL",
  "5HpG9w8EpBmRVjGVpPUfH3JK3E2j1Zzxm4TWGMkP8nFGZkr",
  "5F3sa2TJAqmTKGNWbPBuSHKrP7JXYbzLbvwnVpGMdYaymv1N",
  "5EnkJx2DwzbKvKCibbAbwVLm4b7xcVQhX8n1dA7hTCp8mXpL",
  "5CFXsTk2mTHs5K2QxMmTLqzC6fJDpB4XtdYLgVzLuJ9pLqBT",
  "5Grp7MwEH6H6JgtVTf5M7G2aZAuemvAqWMvY2JnvDhLCDpQq",
];

// Stake amounts weighted toward realistic distribution (small bets more common)
const AMOUNT_WEIGHTS = [
  { amount: 5n, weight: 8 },
  { amount: 10n, weight: 12 },
  { amount: 25n, weight: 10 },
  { amount: 50n, weight: 8 },
  { amount: 100n, weight: 6 },
  { amount: 200n, weight: 4 },
  { amount: 500n, weight: 2 },
  { amount: 1000n, weight: 1 },
];
const TOTAL_WEIGHT = AMOUNT_WEIGHTS.reduce((s, a) => s + a.weight, 0);

function pickAmount(r: () => number): bigint {
  let w = r() * TOTAL_WEIGHT;
  for (const { amount, weight } of AMOUNT_WEIGHTS) {
    w -= weight;
    if (w <= 0) return amount * 10n ** 12n;
  }
  return 25n * 10n ** 12n;
}

function seedFor(marketId: number): ActivityItem[] {
  let s = (marketId + 1) * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const nowTs = Date.now();
  return Array.from({ length: 10 }, (_, i) => ({
    id: `seed-${marketId}-${i}`,
    bettor: SAMPLE_ADDRS[Math.floor(rand() * SAMPLE_ADDRS.length)],
    side: rand() > 0.42,
    amount: pickAmount(rand),
    at: nowTs - i * (45_000 + Math.floor(rand() * 180_000)),
  }));
}

function genItem(): ActivityItem {
  const rand = Math.random;
  return {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bettor: SAMPLE_ADDRS[Math.floor(rand() * SAMPLE_ADDRS.length)],
    side: rand() > 0.42,
    amount: pickAmount(rand),
    at: Date.now(),
  };
}
