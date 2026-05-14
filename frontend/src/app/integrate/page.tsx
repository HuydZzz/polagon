"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const RUST_SNIPPET = `// Any Ink! 5 contract on Portaldot can query PolagonScore.
// Score is soulbound — read-only, deterministic, gas-cheap.

use ink::env::call::{build_call, ExecutionInput, Selector};
use ink::env::DefaultEnvironment;

#[ink(message)]
pub fn weighted_vote(&mut self, choice: u8) {
    let voter = self.env().caller();

    // 1) Read the voter's Polagon Score via cross-contract call
    let score: u64 = build_call::<DefaultEnvironment>()
        .call(self.polagon_score)            // contract address
        .gas_limit(0)
        .transferred_value(0)
        .exec_input(
            ExecutionInput::new(Selector::new(ink::selector_bytes!(
                "score_of"
            )))
            .push_arg(voter),
        )
        .returns::<u64>()
        .invoke();

    // 2) Weight the vote by the caller's prediction track record
    let weight = score.saturating_add(1);    // 0 score → minimum 1
    self.tally[choice as usize] += weight;
}`;

const TS_SNIPPET = `// Frontend / off-chain integration via @polkadot/api-contract.
// Same primitive — read-only query, no signature needed.

import { ApiPromise, WsProvider } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";
import abi from "./polagon_reputation.json";

const POLAGON_SCORE = "5G…polagonScoreAddress";

export async function getScore(account: string): Promise<number> {
  const api = await ApiPromise.create({
    provider: new WsProvider("wss://rpc.testnet.portaldot.io"),
  });
  const contract = new ContractPromise(api, abi, POLAGON_SCORE);

  // Free query — no fee, no signing
  const { result, output } = await contract.query.scoreOf(
    account,
    { gasLimit: -1, storageDepositLimit: null },
    account,
  );

  if (!result.isOk) throw new Error("score query failed");
  return Number(output?.toJSON() ?? 0);
}`;

const METHODS = [
  {
    name: "score_of(account) → u64",
    desc: "Single number representing the user's lifetime prediction performance. Higher = more accurate over more markets. Soulbound — never decreases except by adding correct predictions.",
  },
  {
    name: "accuracy_bps(account) → u16",
    desc: "Accuracy in basis points (e.g. 8300 = 83% accuracy). Returns 0 if the user has zero settled predictions yet — query is non-reverting.",
  },
  {
    name: "stats_of(account) → ReputationStats",
    desc: "Full struct: total_predictions, correct_predictions, total_staked, total_won, current_streak, best_streak, last_active. Use this for richer integrations like leaderboards or KPI dashboards.",
  },
  {
    name: "is_reputable(account, threshold: u64) → bool",
    desc: "Sugar helper — returns whether the user's score exceeds the threshold. Convenient for boolean gating (e.g. accuracy-gated chat rooms, alpha groups).",
  },
];

const USE_CASES = [
  {
    title: "Weighted DAO Voting",
    desc: "Replace 1-token-1-vote with calibrated-knowledge weighting. Wallet-age sybil resistance, but for proven accuracy.",
    icon: "🗳",
  },
  {
    title: "Reputation-Gated Alpha Groups",
    desc: "Discord/Telegram bots query is_reputable(addr, 5000) to gate access to invite-only research channels.",
    icon: "🔐",
  },
  {
    title: "Insurance & Lending Risk Scoring",
    desc: "Calibration accuracy is a strong signal for prediction-pegged stablecoins, undercollateralized lending, parametric insurance.",
    icon: "📊",
  },
  {
    title: "Cross-dApp Identity Proof",
    desc: "Soulbound = portable. A user's PolagonScore moves with them across any Portaldot dApp. One identity primitive, infinite composability.",
    icon: "⬡",
  },
];

export default function IntegratePage() {
  return (
    <motion.div
      className="container-page pb-24 pt-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Hero ── */}
      <header className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="pill border-brand/40 bg-brand/10 text-brand-300">
            For builders
          </span>
          <span className="pill">Reputation SDK</span>
        </div>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Build on{" "}
          <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
            PolagonScore.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-text-muted">
          Polagon isn't an app — it's a primitive. Any Portaldot dApp can read a
          user's soulbound prediction reputation in <em>one</em> cross-contract
          call. Use it for weighted governance, sybil-resistant gating,
          accuracy-priced lending, or anything that benefits from proof of
          calibration.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="https://github.com/HuydZzz/polagon/tree/main/contracts/reputation"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            View reputation contract ↗
          </a>
          <Link href="/leaderboard" className="btn-ghost">
            See the leaderboard →
          </Link>
        </div>
      </header>

      {/* ── Code snippets ── */}
      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-tight">
          One call. Two languages.
        </h2>
        <p className="mt-2 max-w-2xl text-text-muted">
          The reputation contract exposes pure query messages — no signing
          required, no state changes, deterministic results. Read from Ink! or
          from off-chain JavaScript.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <CodeCard
            lang="Rust · Ink! 5"
            tone="brand"
            file="contracts/governance/lib.rs"
            code={RUST_SNIPPET}
          />
          <CodeCard
            lang="TypeScript · @polkadot/api-contract"
            tone="accent"
            file="sdk/score.ts"
            code={TS_SNIPPET}
          />
        </div>
      </section>

      {/* ── Public methods ── */}
      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-tight">
          Public query surface
        </h2>
        <p className="mt-2 max-w-2xl text-text-muted">
          Four read-only messages on the reputation contract. All are free
          (off-chain RPC) or near-zero gas (on-chain cross-contract).
        </p>

        <div className="mt-6 space-y-3">
          {METHODS.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6"
            >
              <code className="shrink-0 font-mono text-sm text-brand-300 sm:w-72">
                {m.name}
              </code>
              <p className="text-sm leading-relaxed text-text-muted">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-tight">
          What you can build
        </h2>
        <p className="mt-2 max-w-2xl text-text-muted">
          Soulbound reputation unlocks design space that token-gating alone
          can't reach. A few directions we're excited about — and that we'd
          love to see other Portaldot teams build first.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((u, i) => (
            <motion.div
              key={u.title}
              className="card group p-6 transition hover:border-brand/40"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i, duration: 0.3 }}
            >
              <div className="text-3xl">{u.icon}</div>
              <h3 className="mt-3 font-display text-lg">{u.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {u.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="mt-20">
        <div className="card relative overflow-hidden p-10 sm:p-14">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/15 via-transparent to-accent/10" />
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Make your dApp calibration-aware.
          </h2>
          <p className="mt-3 max-w-xl text-text-muted">
            Pin the reputation contract address in your config, import the ABI,
            wire one cross-contract call. PolagonScore becomes a first-class
            input to your business logic — alongside POT balance, NFT
            ownership, or any other on-chain signal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://github.com/HuydZzz/polagon"
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              Clone the repo ↗
            </a>
            <a
              href="https://github.com/HuydZzz/polagon/blob/main/ARCHITECTURE.md"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              Read the architecture spec →
            </a>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function CodeCard({
  lang,
  tone,
  file,
  code,
}: {
  lang: string;
  tone: "brand" | "accent";
  file: string;
  code: string;
}) {
  const ringColor = tone === "brand" ? "border-brand/30" : "border-accent/30";
  const dotColor = tone === "brand" ? "bg-brand" : "bg-accent";
  return (
    <div className={`card overflow-hidden ${ringColor}`}>
      <div className="flex items-center justify-between border-b border-border bg-bg-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span className="font-mono text-xs text-text-muted">{file}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
          {lang}
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[11px] leading-relaxed text-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}
