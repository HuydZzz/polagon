# Polagon

> **Decentralized Prediction Markets, Polls & On-chain Reputation, native to Portaldot.**

Polagon turns collective belief into a tradable, on-chain asset. Anyone can spin up a market in seconds, stake POT on the outcome they trust, and earn a permanent **Polagon Score** — a soulbound reputation that proves you saw the future first.

---

## Table of Contents
1. [Problem](#problem)
2. [Solution](#solution)
3. [Why Portaldot](#why-portaldot)
4. [Architecture](#architecture)
5. [Repository Layout](#repository-layout)
6. [Quick Start](#quick-start)
7. [Status](#status)
8. [License](#license)

---

## Problem

Information markets are one of the most powerful coordination tools humanity has invented — yet today they are:

- **Centralized & geo-blocked.** Polymarket alone did $9B+ in volume in 2024–2025, but most of the world cannot legally use it.
- **Single-purpose.** Existing platforms only do hard-money betting; no native polls, no reputation, no community layer.
- **Disposable.** When a market resolves, your insight evaporates. Nothing follows the user, nothing compounds into reputation.

Portaldot needs flagship dApps that bring users **and** showcase its native Ink! contract platform. A prediction protocol is one of the most demo-friendly, viral primitives in Web3 — and Portaldot does not have one.

## Solution

**Polagon** is a three-layer prediction protocol:

| Layer | What it does | POT usage |
|---|---|---|
| **Markets** | Binary YES/NO prediction markets, parimutuel-style. Anyone creates, anyone stakes. | Stake & gas |
| **Polls** | Lightweight community polls weighted by POT staked or by Polagon Score. | Gas only |
| **Polagon Score** | Soulbound on-chain reputation tracking lifetime accuracy of every prediction. | Earned, never bought |

The three layers compose: a high-Score user's poll vote carries more weight; a market creator stakes POT to anti-spam; a winning bettor earns POT **and** Score. The result is a self-reinforcing loop where prediction skill becomes a portable, verifiable asset on Portaldot.

### Core flows

**Create a market** — `pay createMarketFee in POT` → Ink! factory deploys/registers the market → market is live.

**Bet on YES / NO** — `bet(market_id, side)` payable in POT → contract escrows funds → user position recorded.

**Resolve** — at `end_time`, the designated `resolver` calls `resolve(outcome)` → contract flips status to `Resolved` → reputation hooks fire.

**Claim** — winners call `claim(market_id)` → contract pays out `(user_winning_stake / total_winning_pool) × total_pool` minus protocol fee, in POT → score updated.

## Why Portaldot

Polagon is designed **natively** for Portaldot, not ported from another chain:

- **Ink! 5.x smart contracts.** Markets, factory, and reputation are all written in Rust + Ink!, leveraging Portaldot's WASM execution and `Mapping` storage.
- **POT as gas + stake.** Every action — create, bet, resolve, claim — pays gas in POT, and stakes are denominated in POT. Volume directly translates into demand for the native token.
- **Substrate-native timestamps.** `self.env().block_timestamp()` for market expiry — no oracles needed for the time dimension.
- **Cross-contract calls.** Factory ↔ Market ↔ Reputation use Ink!'s native cross-contract messaging, showcasing the chain's contract-composability story.

> ⚠️ **Mandatory eligibility.** Per the hackathon rules, deployment is to Portaldot only and POT is the sole gas token. This repository's contracts cannot be redeployed to a non-Portaldot Substrate chain without rewriting the dispatch layer.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Polagon Frontend (Next.js)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │  Markets   │  │  Polls     │  │  Profile   │  │  Create    │      │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │ polkadot-api / @polkadot/api-contract
┌────────────────────────────────┴──────────────────────────────────────┐
│                      Portaldot (Substrate + Ink!)                     │
│                                                                       │
│   ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐  │
│   │ MarketFactory   │───▶│ PredictionMarket │───▶│   Reputation    │  │
│   │  - create()     │    │  - bet()         │    │  - record()     │  │
│   │  - list()       │    │  - resolve()     │    │  - score_of()   │  │
│   │  - fee config   │    │  - claim()       │    │  - soulbound    │  │
│   └─────────────────┘    └──────────────────┘    └─────────────────┘  │
│            ▲                       ▲                       ▲          │
│            └───────────────────────┴───────────────────────┘          │
│                          POT (native token, gas + stake)              │
└───────────────────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed flow diagrams and storage layouts.

## Repository Layout

```
.
├── README.md                # project overview
├── ARCHITECTURE.md          # technical deep-dive
├── LICENSE                  # MIT
├── docs/
│   ├── whitepaper.md        # extended design rationale
│   └── tokenomics.md        # POT flows, fees, sustainability
├── contracts/               # Ink! 5.x smart contracts (Rust)
│   ├── Cargo.toml           # workspace
│   ├── prediction_market/   # parimutuel market + factory
│   └── reputation/          # soulbound Polagon Score
└── frontend/                # Next.js 14 + Tailwind
    ├── src/app/             # App Router pages
    └── src/components/
```

## Quick Start

### Prerequisites
- Rust `nightly-2025-01` or later, with the `wasm32-unknown-unknown` target
- `cargo-contract` v5.x — `cargo install cargo-contract --force`
- Node.js 20+ and pnpm 9+
- A Portaldot wallet funded with testnet POT (see [Portaldot dev docs](https://portaldot-dev.readthedocs.io/en/latest/))

### Build the contracts
```bash
cd contracts/prediction_market
cargo contract build --release
cd ../reputation
cargo contract build --release
```
Each build emits a `.contract` bundle in `target/ink/` ready to upload via `cargo contract instantiate` or the Portaldot Contracts UI.

### Run the frontend
```bash
cd frontend
pnpm install
pnpm dev
# → http://localhost:3000
```

Set the deployed contract addresses in `frontend/.env.local`:
```
NEXT_PUBLIC_FACTORY_ADDRESS=5...
NEXT_PUBLIC_REPUTATION_ADDRESS=5...
NEXT_PUBLIC_RPC_URL=wss://rpc.portaldot.io   # placeholder; check dev docs
```

## Status

Active development. The protocol is in MVP stage; deployment to Portaldot testnet is in progress.

| Layer | State |
|---|---|
| `prediction_market` contract | Implemented, unit-tested |
| `reputation` contract | Implemented, unit-tested |
| Cross-contract wiring | Implemented |
| End-to-end (`ink_e2e`) tests | In progress |
| Testnet deployment | In progress |
| Frontend ↔ chain integration | In progress |
| Polls layer | Designed, not yet implemented |

## Contributing

Contributions are welcome. Please open an issue first for substantive changes so we can discuss the design before code is written. Smaller fixes (typos, doc clarifications, obvious bug fixes) can land directly as PRs.

## License

MIT. See [LICENSE](./LICENSE).

---

_Built with respect for Portaldot — the chain that makes Polagon possible._
