export default function CreateMarketPage() {
  return (
    <div className="container-page max-w-2xl pt-10">
      <h1 className="font-display text-4xl tracking-tight">Create a market</h1>
      <p className="mt-2 text-text-muted">
        Pay 1 POT to spin up a market. The fee deters spam; the rest of the
        protocol stays free for participants.
      </p>

      <form className="card mt-8 space-y-5 p-6">
        <Field label="Question" hint="Yes/No, ≤280 chars. Resolvable by your chosen resolver.">
          <input
            type="text"
            placeholder="Will BTC close above $200,000 on Dec 31, 2026?"
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm placeholder:text-text-dim focus:border-brand"
            disabled
          />
        </Field>

        <Field label="Ends at (UTC)" hint="Resolver acts after this timestamp.">
          <input
            type="datetime-local"
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 text-sm focus:border-brand"
            disabled
          />
        </Field>

        <Field label="Resolver address" hint="Defaults to your wallet. Use a multisig for community markets.">
          <input
            type="text"
            placeholder="5Gr…ax8u (your wallet)"
            className="w-full rounded-md border border-border bg-bg-subtle px-3 py-2.5 font-mono text-sm placeholder:text-text-dim focus:border-brand"
            disabled
          />
        </Field>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-text-muted">
            Cost: <span className="font-mono text-text">1.0 POT</span> · Protocol fee on resolution: 2%
          </div>
          <button type="button" className="btn-primary" disabled>
            Sign &amp; create
          </button>
        </div>

        <p className="text-xs text-text-dim">
          Wallet signing lands on D11 of the roadmap (May 14). The form is wired to the
          contract on D11.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-text">{label}</div>
      {children}
      {hint && <div className="mt-1.5 text-xs text-text-dim">{hint}</div>}
    </label>
  );
}
