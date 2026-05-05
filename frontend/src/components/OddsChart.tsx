"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Time-series of YES odds %. In live mode, the parent passes real points
 * derived from BetPlaced events. Until those events stream (D9), we
 * synthesize a deterministic walk based on `seed` and `currentYesPct`
 * so each market has its own consistent chart.
 */
export function OddsChart({
  currentYesPct,
  seed = 0,
  points = 40,
  height = 160,
}: {
  currentYesPct: number;
  seed?: number;
  points?: number;
  height?: number;
}) {
  const data = useMemo(() => synth(seed, points, currentYesPct), [seed, points, currentYesPct]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            contentStyle={{
              background: "#1A1A26",
              border: "1px solid #2A2A38",
              borderRadius: 8,
              fontSize: 12,
              color: "#F5F5F7",
            }}
            labelFormatter={() => ""}
            formatter={(v: number) => [`${v.toFixed(0)}%`, "YES"]}
          />
          <Area
            type="monotone"
            dataKey="yes"
            stroke="rgb(124 58 237)"
            strokeWidth={2}
            fill="url(#yesGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function synth(seed: number, n: number, end: number) {
  // deterministic LCG
  let s = (seed * 9301 + 49297) % 233280;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const start = Math.max(20, Math.min(80, end + (next() - 0.5) * 30));
  const arr: { t: number; yes: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const drift = start + (end - start) * t;
    const noise = (next() - 0.5) * 12 * (1 - t * 0.6);
    arr.push({ t: i, yes: clamp(drift + noise) });
  }
  arr[arr.length - 1].yes = end;
  return arr;
}

function clamp(v: number) {
  return Math.max(2, Math.min(98, v));
}
