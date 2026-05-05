"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useNotify } from "@/lib/notify";
import { useTx } from "@/lib/useTx";
import { txCreateMarket } from "@/lib/contracts";
import { isChainWired } from "@/lib/env";

const ONE_POT = 10n ** 12n;

export default function CreateMarketPage() {
  const router = useRouter();
  const { active } = useWallet();
  const { notify } = useNotify();
  const { isPending, submit } = useTx();

  const [question, setQuestion] = useState("");
  const [endLocal, setEndLocal] = useState(defaultEndsAt());
  const [resolver, setResolver] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const effectiveResolver = resolver.trim() || active?.address || "";
  const endTimeMs = useMemo(() => new Date(endLocal).getTime(), [endLocal]);

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
      notify({
        kind: "info",
        title: "Mock mode",
        body: "Run `make deploy` to enable on-chain market creation.",
      });
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
    <div className="container-page max-w-2xl pt-10">
      <h1 className="font-display text-4xl tracking-tight">Create a market</h1>
      <p className="mt-2 text-text-muted">
        Pay 1 POT to spin up a market. The fee deters spam; the rest of the
        protocol stays free for participants.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="card mt-8 space-y-5 p-6"
      >
        <Field
          label="Question"
          hint="Yes/No, ≤280 chars."
          error={errors.question}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will BTC close above $200,000 on Dec 31, 2026?"
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm placeholder:text-text-dim focus:border-brand"
            maxLength={290}
          />
          <div className="mt-1 text-right font-mono text-[10px] text-text-dim">
            {question.length}/280
          </div>
        </Field>

        <Field label="Ends at (your local time)" error={errors.end}>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm focus:border-brand"
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
            placeholder={active?.address ?? "5Gr…ax8u (your wallet)"}
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 font-mono text-sm placeholder:text-text-dim focus:border-brand"
          />
        </Field>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-text-muted">
            Cost: <span className="font-mono text-text">1.0 POT</span> · Fee on
            resolution: 2%
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isPending || !active}
            title={!active ? "Connect a wallet first" : undefined}
          >
            {isPending ? "Signing…" : "Sign · Create"}
          </button>
        </div>
      </form>

      {!isChainWired && (
        <p className="mt-4 text-xs text-text-dim">
          Mock mode — submitting just shows a hint. Run <code>make deploy</code>{" "}
          to go live.
        </p>
      )}
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
  // Default to 7 days from now in the user's local timezone, formatted for <input type="datetime-local">.
  const t = new Date(Date.now() + 7 * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
