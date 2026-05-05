"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useNotify } from "@/lib/notify";
import { useTx } from "@/lib/useTx";
import { isPollsWired } from "@/lib/env";
import { txClosePoll, txVote } from "@/lib/contracts";
import type { Poll } from "@/lib/types";

interface Props {
  poll: Poll;
  myVote?: number;
  onChange?: () => void;
}

export function PollPanel({ poll, myVote, onChange }: Props) {
  const { active } = useWallet();
  const { notify } = useNotify();
  const { isPending, submit } = useTx();
  const [selected, setSelected] = useState<number | null>(myVote ?? null);

  const total = poll.votesPerOption.reduce((a, b) => a + b, 0);
  const expired = Date.now() >= poll.endTime;
  const isOpen = poll.status === "Open" && !expired;
  const canClose =
    !expired && active?.address === poll.creator && poll.status === "Open";
  const canPostExpiryClose =
    expired && poll.status === "Open";

  async function vote() {
    if (selected == null) return;
    if (!isPollsWired) {
      notify({
        kind: "info",
        title: "Mock mode",
        body: "Run `make deploy` to enable on-chain voting.",
      });
      return;
    }
    try {
      const tx = await txVote(poll.id, selected);
      await submit(tx, {
        label: myVote != null ? "Updating vote" : "Recording vote",
        successBody: "Your vote is on-chain.",
        onSuccess: () => onChange?.(),
      });
    } catch {
      /* useTx already toasted */
    }
  }

  async function close() {
    try {
      const tx = await txClosePoll(poll.id);
      await submit(tx, {
        label: "Closing poll",
        successBody: "Poll closed.",
        onSuccess: () => onChange?.(),
      });
    } catch {
      /* noop */
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider text-text-muted">
          {isOpen ? (myVote != null ? "Change your vote" : "Cast your vote") : "Final tally"}
        </h2>
        {myVote != null && (
          <span className="pill">
            you voted · {poll.options[myVote] ?? "?"}
          </span>
        )}
      </div>

      <ul className="mt-5 space-y-2">
        {poll.options.map((opt, i) => {
          const votes = poll.votesPerOption[i] ?? 0;
          const pct = total > 0 ? (votes / total) * 100 : 0;
          const isSelected = selected === i;
          const wasMine = myVote === i;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!isOpen || isPending}
                onClick={() => setSelected(i)}
                className={`relative w-full overflow-hidden rounded-md border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-brand bg-brand/10"
                    : "border-border bg-bg-subtle hover:border-border-strong"
                } ${!isOpen ? "cursor-default" : ""}`}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 -z-10 bg-brand/10"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-brand" />
                    )}
                    <span className={isSelected ? "text-text" : "text-text-muted"}>
                      {opt}
                    </span>
                    {wasMine && (
                      <span className="text-[10px] uppercase tracking-wider text-text-dim">
                        · your vote
                      </span>
                    )}
                  </span>
                  <span className="font-mono tabular-nums text-text">
                    {pct.toFixed(0)}%
                    <span className="ml-2 text-[10px] text-text-dim">
                      {votes.toLocaleString()}
                    </span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {isOpen && (
        <button
          type="button"
          onClick={vote}
          disabled={
            selected == null ||
            selected === myVote ||
            isPending ||
            !active
          }
          className="btn-primary mt-5 w-full"
          title={!active ? "Connect wallet first" : undefined}
        >
          {isPending
            ? "Signing…"
            : !active
              ? "Connect wallet to vote"
              : myVote != null
                ? selected === myVote
                  ? "Already your vote"
                  : `Sign · Change to "${poll.options[selected ?? -1] ?? ""}"`
                : selected == null
                  ? "Pick an option"
                  : `Sign · Vote "${poll.options[selected]}"`}
        </button>
      )}

      {(canClose || canPostExpiryClose) && (
        <button
          type="button"
          onClick={close}
          disabled={isPending}
          className="btn-ghost mt-3 w-full text-xs"
        >
          {canClose ? "Close poll early" : "Close & finalize"}
        </button>
      )}

      {!isPollsWired && isOpen && (
        <p className="mt-4 text-[11px] text-text-dim">
          Mock mode — voting is preview-only. Run <code>make deploy</code> to go live.
        </p>
      )}
    </div>
  );
}
