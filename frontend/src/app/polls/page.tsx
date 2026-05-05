export default function PollsPage() {
  return (
    <div className="container-page pt-10">
      <h1 className="font-display text-4xl tracking-tight">Polls</h1>
      <p className="mt-2 text-text-muted">
        Lightweight community signaling. Vote weight comes from your Polagon Score
        — not your wallet age, not your bag size.
      </p>

      <div className="card mt-8 p-8 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs text-brand-200">
          Shipping D13 (May 16)
        </div>
        <h2 className="mt-4 font-display text-2xl">
          Polls layer launches mid-Phase 2.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
          The same `Reputation` contract powering Polagon Score will weight polls by
          calibrated accuracy. DAOs on Portaldot get a free, sybil-resistant signaling tool.
        </p>
      </div>
    </div>
  );
}
