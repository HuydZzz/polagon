"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useNotify } from "@/lib/notify";
import { useTx } from "@/lib/useTx";
import { txCreatePoll } from "@/lib/contracts";
import { isPollsWired } from "@/lib/env";
import { addMockPoll } from "@/lib/polls-mock";

export default function CreatePollPage() {
  const router = useRouter();
  const { active } = useWallet();
  const { notify } = useNotify();
  const { isPending, submit } = useTx();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [endLocal, setEndLocal] = useState(defaultEndsAt());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const endTimeMs = new Date(endLocal).getTime();
  const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!question.trim()) e.question = "Required.";
    if (question.length > 280) e.question = "Max 280 characters.";
    if (cleanedOptions.length < 2) e.options = "At least 2 options needed.";
    if (cleanedOptions.length > 8) e.options = "Max 8 options.";
    if (cleanedOptions.some((o) => o.length > 80)) e.options = "Each option max 80 characters.";
    if (!Number.isFinite(endTimeMs) || endTimeMs <= Date.now() + 60_000)
      e.end = "Must be at least one minute in the future.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    if (!active) {
      notify({ kind: "error", title: "Connect a wallet first" });
      return;
    }
    if (!isPollsWired) {
      await new Promise((r) => setTimeout(r, 1000));
      const poll = addMockPoll(question.trim(), cleanedOptions, endTimeMs, active.address);
      notify({ kind: "success", title: "Poll created!", body: "Your poll is now live." });
      router.push(`/polls/${poll.id}`);
      return;
    }
    try {
      const tx = await txCreatePoll(question.trim(), cleanedOptions, endTimeMs);
      await submit(tx, {
        label: "Creating poll",
        successBody: "Your poll is live.",
        onSuccess: () => router.push("/polls"),
      });
    } catch {
      /* useTx already toasted */
    }
  }

  function setOption(i: number, v: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  }
  function addOption() {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, ""]);
  }
  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="container-page max-w-2xl pt-10">
      <h1 className="font-display text-4xl tracking-tight">Create a poll</h1>
      <p className="mt-2 text-text-muted">
        No fee, no stake — just gas. Polls are pure coordination, not money.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="card mt-8 space-y-5 p-6"
      >
        <Field label="Question" error={errors.question}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should the protocol fee be?"
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm placeholder:text-text-dim focus:border-brand"
            maxLength={290}
          />
          <div className="mt-1 text-right font-mono text-[10px] text-text-dim">
            {question.length}/280
          </div>
        </Field>

        <div>
          <div className="mb-1 text-sm text-text">Options (2–8)</div>
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={o}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm placeholder:text-text-dim focus:border-brand"
                  maxLength={90}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="btn-ghost px-3 text-xs"
                    aria-label="Remove option"
                  >
                    −
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 8 && (
            <button
              type="button"
              onClick={addOption}
              className="btn-ghost mt-2 text-xs"
            >
              + Add option
            </button>
          )}
          {errors.options && (
            <div className="mt-1.5 text-xs text-danger">{errors.options}</div>
          )}
        </div>

        <Field label="Closes at (your local time)" error={errors.end}>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm focus:border-brand"
          />
        </Field>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-text-muted">
            Cost: <span className="font-mono text-text">gas only</span>
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

      {!isPollsWired && (
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-text">{label}</div>
      {children}
      {error && <div className="mt-1.5 text-xs text-danger">{error}</div>}
    </label>
  );
}

function defaultEndsAt(): string {
  const t = new Date(Date.now() + 7 * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
