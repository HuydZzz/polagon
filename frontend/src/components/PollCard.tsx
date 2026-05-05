import Link from "next/link";
import type { Poll } from "@/lib/types";

export function PollCard({ poll }: { poll: Poll }) {
  const total = poll.votesPerOption.reduce((a, b) => a + b, 0);
  const expiresIn = Math.max(0, poll.endTime - Date.now());
  const days = Math.floor(expiresIn / 86_400_000);
  const top = topOption(poll);

  return (
    <Link
      href={`/polls/${poll.id}`}
      className="card group block p-5 transition hover:border-brand/50 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="pill">{poll.category}</span>
        {poll.status === "Open" ? (
          <span className="pill border-success/30 bg-success/10 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Live
          </span>
        ) : (
          <span className="pill border-border text-text-muted">Closed</span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-medium leading-snug text-text">
        {poll.question}
      </h3>

      <div className="mt-4 space-y-1.5">
        {top.map((o, i) => (
          <div key={i} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="truncate text-text-muted">{o.label}</span>
              <span className="font-mono tabular-nums text-text-dim">
                {o.pct.toFixed(0)}%
              </span>
            </div>
            <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full bg-brand"
                style={{ width: `${Math.max(o.pct, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-text-dim">
        <span>{poll.totalVoters.toLocaleString()} voters · {total} votes</span>
        <span>
          {poll.status === "Closed"
            ? "Closed"
            : days === 0
              ? "Closes today"
              : `${days}d left`}
        </span>
      </div>
    </Link>
  );
}

function topOption(poll: Poll): { label: string; pct: number }[] {
  const total = poll.votesPerOption.reduce((a, b) => a + b, 0) || 1;
  const ranked = poll.options
    .map((label, i) => ({ label, votes: poll.votesPerOption[i] ?? 0 }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 2);
  return ranked.map((r) => ({ label: r.label, pct: (r.votes / total) * 100 }));
}
