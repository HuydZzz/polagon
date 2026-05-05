"use client";

import { motion } from "framer-motion";

/**
 * Animated pool composition donut. Pure SVG; no chart dependency.
 * Two arcs (YES/NO), animated via stroke-dasharray.
 */
export function PoolDonut({
  yesPct,
  size = 180,
  thickness = 18,
}: {
  yesPct: number;
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const yesLen = (Math.max(0, Math.min(100, yesPct)) / 100) * c;
  const noLen = c - yesLen;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
          fill="none"
        />
        {/* NO segment (drawn first; full circle minus YES) */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgb(239 68 68)"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="butt"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${noLen} ${yesLen}` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          style={{ strokeDashoffset: -yesLen }}
        />
        {/* YES segment */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgb(34 197 94)"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="butt"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${yesLen} ${noLen}` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl tabular-nums text-text">
          {yesPct.toFixed(0)}%
        </span>
        <span className="text-[10px] uppercase tracking-wider text-text-dim">YES</span>
      </div>
    </div>
  );
}
