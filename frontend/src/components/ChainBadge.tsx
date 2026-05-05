"use client";

import { isChainWired, env } from "@/lib/env";

export function ChainBadge() {
  if (!isChainWired) {
    return (
      <span className="hidden items-center gap-1.5 rounded-full border border-warning/30 bg-warning/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warning sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        mock mode
      </span>
    );
  }
  const isLocal = env.rpcUrl.includes("127.0.0.1") || env.rpcUrl.includes("localhost");
  return (
    <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-success sm:inline-flex">
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse_glow" />
      {isLocal ? "local devnet" : env.chainName}
    </span>
  );
}
