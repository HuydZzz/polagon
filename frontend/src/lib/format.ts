/**
 * POT/balance formatting helpers. All bigints are in base units (10^decimals).
 */

import { env } from "./env";

const ONE = BigInt(10) ** BigInt(env.decimals);

export function pot(human: number): bigint {
  // 1.5 POT → 1_500_000_000_000n  (with decimals=12)
  // Avoids float drift via micro-units (×1e6) intermediate scaling.
  return (BigInt(Math.round(human * 1e6)) * ONE) / 1_000_000n;
}

export function fmtPot(v: bigint, decimals = 2): string {
  if (v < 0n) return "-" + fmtPot(-v, decimals);
  const whole = v / ONE;
  const frac = v % ONE;
  if (frac === 0n) return whole.toLocaleString();
  const fracStr = (Number(frac) / Number(ONE)).toFixed(decimals).slice(2);
  return `${whole.toLocaleString()}.${fracStr}`;
}

export function shortAddr(addr: string): string {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function impliedOdds(yes: bigint, no: bigint): { yes: number; no: number } {
  const total = yes + no;
  if (total === 0n) return { yes: 50, no: 50 };
  const y = Number((yes * 10000n) / total) / 100;
  return { yes: y, no: 100 - y };
}
