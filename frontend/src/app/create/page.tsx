"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useNotify } from "@/lib/notify";
import { useTx } from "@/lib/useTx";
import { txCreateMarket } from "@/lib/contracts";
import { isChainWired } from "@/lib/env";
import { addMockMarket } from "@/lib/markets-mock";

const ONE_POT = 10n ** 12n;

export default function CreateMarketPage() {
  const router = useRouter();
  const { active } = useWallet();
  const { notify } = useNotify();
  const { isPending, submit } = useTx();
  const [mockPending, setMockPending] = useState(false);

  const [question, setQuestion] = useState("");
  const [endLocal, setEndLocal] = useState(defaultEndsAt());
  const [resolver, setResolver] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const effectiveResolver = resolver.trim() || active?.address || "";
  const endTimeMs = useMemo(() => new Date(endLocal).getTime(), [endLocal]);
  const pending = isPending || mockPending;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!question.trim()) e.question = "Required.";
    if (question.length > 280) e.question = "Max 280 characters.";
    if (!Number.isFinite(endTimeMs)) e.end = "Invalid date.";
    else if (endTimeMs <= Date.now() + 60_000)
      e.end = "Must be at least one minute in the future.";
    if (effectiveResolver.length < 32) e.resolver = "Looks invalid.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    if (!active) {
      notify({ kind: "error", title: "Connect a wallet first" });
      return;
    }

    if (!isChainWired) {
      setMockPending(true);
      await new Promise((r) => setTimeout(r, 1100));
      setMockPending(false);
      const market = addMockMarket(
        question.trim(),
        endTimeMs,
        effectiveResolver,
        effectiveResolver,
      );
      notify({
        kind: "success",
        title: "Market created!",
        body: `"${question.trim().slice(0, 60)}…" is now live.`,
      });
      router.push(`/markets/${market.id}`);
      return;
    }

    try {
      const tx = await txCreateMarket(
        question.trim(),
        endTimeMs,
        effectiveResolver,
        ONE_POT,
      );
      await submit(tx, {
        label: "Creating market",
        successBody: "Your market is live.",
        onSuccess: () => router.push("/markets"),
      });
    } catch {
      /* useTx already toasted */
    }
  }

  return (
    <div className="container-page max-w-2xl pb-16 pt-10">
      <h1 className="font-display text-4xl tracking-tight">Create a market</h1>
      <p className="mt-2 text-text-muted">
        Pay 1 POT to spin up a market. The fee deters spam; the rest of the
        protocol stays free for participants.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
        className="card mt-8 space-y-5 p-6"
      >
        <Field label="Question" hint="Binary YES/NO · max 280 chars." error={errors.question}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will BTC close above $200,000 on Dec 31, 2026?"
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm placeholder:text-text-dim focus:border-brand focus:outline-none"
            maxLength={290}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-text-dim">
              Category auto-detected from your question
            </span>
            <span className="text-right font-mono text-[10px] text-text-dim">
              {question.length}/280
            </span>
          </div>
        </Field>

        <Field label="Closes at (your local time)" error={errors.end}>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </Field>

        <Field
          label="Resolver address"
          hint="Defaults to your wallet. Use a multisig for community markets."
          error={errors.resolver}
        >
          <input
            type="text"
            value={resolver}
            onChange={(e) => setResolver(e.target.value)}
            placeholder={active?.address ?? "5Gr…ax8u  (defaults to your wallet)"}
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 font-mono text-sm placeholder:text-text-dim focus:border-brand focus:outline-none"
          />
        </Field>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-text-muted">
            Cost:{" "}
            <span className="font-mono text-text">1.0 POT</span>
            {" "}·{" "}
            Resolution fee:{" "}
            <span className="font-mono text-text">2%</span>
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={pending || !active}
            title={!active ? "Connect a wallet first" : undefined}
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </span>
            ) : (
              "Sign · Create"
            )}
          </button>
        </div>
      </form>

      {/* Quick tips */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "⚡", tip: "Markets go live instantly after signing." },
          { icon: "🔒", tip: "Funds are escrowed in the contract — not your wallet." },
          { icon: "⬡", tip: "Every prediction updates your Polagon Score." },
        ].map((t) => (
          <div
            key={t.tip}
            className="flex items-start gap-2 rounded-lg border border-border/50 bg-bg-subtle px-4 py-3 text-xs text-text-dim"
          >
            <span>{t.icon}</span>
            <span>{t.tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-text">{label}</div>
      {children}
      {error ? (
        <div className="mt-1.5 text-xs text-danger">{error}</div>
      ) : hint ? (
        <div className="mt-1.5 text-xs text-text-dim">{hint}</div>
      ) : null}
    </label>
  );
}

function defaultEndsAt(): string {
  const t = new Date(Date.now() + 7 * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
