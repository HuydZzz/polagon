"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useNotify } from "@/lib/notify";
import { useTx } from "@/lib/useTx";
import { txBet, txCancel, txClaim, txResolve } from "@/lib/contracts";
import { fmtPot, impliedOdds, pot } from "@/lib/format";
import { isChainWired } from "@/lib/env";
import type { Market } from "@/lib/types";

interface Props {
  market: Market;
  position?: { yes: bigint; no: bigint };
  hasClaimed?: boolean;
  onChange?: () => void;
  onOptimisticBet?: (side: boolean, amount: bigint) => void;
  onResolve?: (outcome: boolean) => void;
  onClaim?: () => void;
}

export function BetPanel({
  market,
  position,
  hasClaimed,
  onChange,
  onOptimisticBet,
  onResolve,
  onClaim,
}: Props) {
  const { active } = useWallet();
  const { notify } = useNotify();
  const { isPending, submit } = useTx();
  const [side, setSide] = useState<boolean | null>(null);
  const [stake, setStake] = useState<string>("");
  const [mockPending, setMockPending] = useState(false);

  const amt = parseFloat(stake);
  const stakeOk = Number.isFinite(amt) && amt > 0;
  const isResolved = market.status === "Resolved";
  const isCancelled = market.status === "Cancelled";
  const expired = Date.now() >= market.endTime;
  const canBet = market.status === "Open" && !expired;
  const canResolve =
    market.status === "Open" &&
    expired &&
    active?.address === market.resolver;
  const canCancel =
    market.status === "Open" &&
    market.totalYes === 0n &&
    market.totalNo === 0n &&
    active?.address === market.creator;
  const userWinningStake = useMemo(() => {
    if (!isResolved || market.outcome === undefined || !position) return 0n;
    return market.outcome ? position.yes : position.no;
  }, [isResolved, market.outcome, position]);
  const canClaim =
    isResolved && !hasClaimed && (userWinningStake > 0n || isCancelled);

  const odds = impliedOdds(market.totalYes, market.totalNo);
  const projected = useMemo(() => {
    if (!stakeOk || side == null) return null;
    return projectPayout(market, side, pot(amt));
  }, [stakeOk, side, market, amt]);

  async function placeBet() {
    if (!stakeOk || side == null) return;

    if (!isChainWired) {
      // Demo / mock mode: simulate a successful bet
      setMockPending(true);
      await new Promise((r) => setTimeout(r, 900));
      setMockPending(false);
      const stakeAmt = pot(amt);
      notify({
        kind: "success",
        title: `Bet ${amt} POT on ${side ? "YES" : "NO"}`,
        body: "Position recorded on-chain.",
      });
      onOptimisticBet?.(side, stakeAmt);
      setStake("");
      setSide(null);
      onChange?.();
      return;
    }

    try {
      const tx = await txBet(market.id, side, pot(amt));
      await submit(tx, {
        label: `Betting ${amt} POT on ${side ? "YES" : "NO"}`,
        successBody: "Position recorded.",
        onSuccess: () => {
          setStake("");
          setSide(null);
          onChange?.();
        },
      });
    } catch {
      /* useTx already toasted */
    }
  }

  async function resolve(outcome: boolean) {
    if (!isChainWired) {
      setMockPending(true);
      await new Promise((r) => setTimeout(r, 900));
      setMockPending(false);
      notify({
        kind: "success",
        title: `Market resolved: ${outcome ? "YES" : "NO"}`,
        body: "Winners can now claim their payout.",
      });
      onResolve?.(outcome);
      onChange?.();
      return;
    }
    try {
      const tx = await txResolve(market.id, outcome);
      await submit(tx, {
        label: `Resolving ${outcome ? "YES" : "NO"}`,
        successBody: "Market resolved. Winners can now claim.",
        onSuccess: () => onChange?.(),
      });
    } catch {
      /* noop */
    }
  }

  async function claim() {
    if (!isChainWired) {
      // Mock mode: calculate payout and show success immediately
      setMockPending(true);
      await new Promise((r) => setTimeout(r, 900));
      setMockPending(false);
      const FEE_BPS = 200n;
      const outcome = market.outcome ?? false;
      const stake = outcome ? (position?.yes ?? 0n) : (position?.no ?? 0n);
      const Pw = outcome ? market.totalYes : market.totalNo;
      const Pl = outcome ? market.totalNo : market.totalYes;
      const share = Pw > 0n ? (stake * Pl) / Pw : 0n;
      const afterFee = (share * (10000n - FEE_BPS)) / 10000n;
      const payout = stake + afterFee;
      notify({
        kind: "success",
        title: `Claimed ${fmtPot(payout)} POT`,
        body: "Payout sent to your wallet.",
      });
      onClaim?.();
      onChange?.();
      return;
    }
    try {
      const tx = await txClaim(market.id);
      await submit(tx, {
        label: "Claiming",
        successBody: "Funds returned to your wallet.",
        onSuccess: () => onChange?.(),
      });
    } catch {
      /* noop */
    }
  }

  async function cancel() {
    try {
      const tx = await txCancel(market.id);
      await submit(tx, {
        label: "Cancelling market",
        successBody: "Market closed. No bets were placed.",
        onSuccess: () => onChange?.(),
      });
    } catch {
      /* noop */
    }
  }

  const pending = isPending || mockPending;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider text-text-muted">
          {isResolved
            ? "Settled"
            : isCancelled
              ? "Cancelled"
              : canResolve
                ? "Awaiting resolution"
                : "Place a bet"}
        </h2>
        {position && (position.yes > 0n || position.no > 0n) && (
          <span className="pill">
            you · {fmtPot(position.yes)} YES / {fmtPot(position.no)} NO
          </span>
        )}
      </div>

      {/* Open + not expired → bet UI */}
      {canBet && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <SideButton
              tone="success"
              label="YES"
              pct={odds.yes}
              active={side === true}
              onClick={() => setSide(true)}
            />
            <SideButton
              tone="danger"
              label="NO"
              pct={odds.no}
              active={side === false}
              onClick={() => setSide(false)}
            />
          </div>

          <AnimatePresence initial={false}>
            {side != null && (
              <motion.div
                key="stake"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-5">
                  <label className="block text-xs text-text-muted">
                    Stake (POT)
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.1"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      placeholder="0.0"
                      className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 font-mono text-sm tabular-nums focus:border-brand"
                    />
                    {[5, 25, 100].map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="btn-ghost px-2 text-xs"
                        onClick={() => setStake(String(q))}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {projected && (
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-md border border-border bg-bg-subtle px-4 py-3 text-xs">
                    <Cell
                      k="Implied YES after"
                      v={`${projected.yesAfter.toFixed(0)}%`}
                    />
                    <Cell
                      k="Payout if right"
                      v={`${fmtPot(projected.payout)} POT`}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={placeBet}
                  disabled={!stakeOk || pending || !active}
                  className="btn-primary mt-5 w-full"
                  title={!active ? "Connect wallet first" : undefined}
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing…
                    </span>
                  ) : !active ? (
                    "Connect wallet to bet"
                  ) : (
                    `Sign · Bet ${amt || "0"} POT ${side ? "YES" : "NO"}`
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Awaiting resolve (caller is resolver) */}
      {canResolve && (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-text-muted">
            The market deadline has passed. As resolver, choose the binary
            outcome below.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-yes"
              onClick={() => resolve(true)}
              disabled={pending}
            >
              {pending ? "…" : "Resolve YES"}
            </button>
            <button
              className="btn-no"
              onClick={() => resolve(false)}
              disabled={pending}
            >
              {pending ? "…" : "Resolve NO"}
            </button>
          </div>
        </div>
      )}

      {/* Open but expired and you're not the resolver */}
      {market.status === "Open" && expired && !canResolve && (
        <div className="mt-5 rounded-md border border-border bg-bg-subtle px-4 py-3 text-xs text-text-muted">
          Awaiting the resolver ({short(market.resolver)}) to call{" "}
          <code>resolve</code>.
        </div>
      )}

      {/* Settled → claim */}
      {isResolved && (
        <div className="mt-5 space-y-3">
          <div className="rounded-md border border-border bg-bg-subtle px-4 py-3 text-xs text-text-muted">
            Outcome:{" "}
            <span className="text-text">{market.outcome ? "YES" : "NO"}</span>
          </div>
          {canClaim && (
            <button
              className="btn-primary w-full"
              onClick={claim}
              disabled={pending}
            >
              {pending ? "Claiming…" : "Claim payout"}
            </button>
          )}
          {!canClaim && hasClaimed && (
            <p className="text-xs text-text-dim">
              You've already claimed this market.
            </p>
          )}
        </div>
      )}

      {/* Cancellable (creator, no bets) */}
      {canCancel && (
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="btn-ghost mt-4 w-full text-xs"
        >
          Cancel this market
        </button>
      )}
    </div>
  );
}

function SideButton({
  tone,
  label,
  pct,
  active,
  onClick,
}: {
  tone: "success" | "danger";
  label: string;
  pct: number;
  active: boolean;
  onClick: () => void;
}) {
  const ring = active
    ? tone === "success"
      ? "border-success/70 bg-success/15"
      : "border-danger/70 bg-danger/15"
    : "border-border bg-bg-subtle";
  const text = tone === "success" ? "text-success" : "text-danger";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-md border px-4 py-3 transition hover:scale-[1.01] ${ring}`}
    >
      <span className={`text-[10px] uppercase tracking-wider ${text}`}>
        {label}
      </span>
      <span className="font-display text-2xl tabular-nums text-text">
        {pct.toFixed(0)}%
      </span>
    </button>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{k}</span>
      <span className="font-mono tabular-nums text-text">{v}</span>
    </div>
  );
}

function short(addr: string): string {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function projectPayout(
  market: Market,
  side: boolean,
  stake: bigint,
): { yesAfter: number; payout: bigint } {
  const FEE_BPS = 200n;
  const totalYes = side ? market.totalYes + stake : market.totalYes;
  const totalNo = !side ? market.totalNo + stake : market.totalNo;
  const total = totalYes + totalNo;
  const yesAfter =
    total === 0n ? 50 : Number((totalYes * 10000n) / total) / 100;
  const Pw = side ? totalYes : totalNo;
  const Pl = side ? totalNo : totalYes;
  if (Pw === 0n) return { yesAfter, payout: 0n };
  if (Pl === 0n) return { yesAfter, payout: stake };
  const share = (stake * Pl) / Pw;
  const afterFee = (share * (10000n - FEE_BPS)) / 10000n;
  return { yesAfter, payout: stake + afterFee };
}
