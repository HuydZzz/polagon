# Polagon — Architecture

This document is the technical contract between intent and implementation. If something here disagrees with the code, the code wins — but please open an issue so this document can catch up.

## 1. Design principles

1. **Native to Portaldot.** Every primitive — escrow, accounting, time, identity — uses what Substrate + Ink! ship. No wrapped tokens, no synthetic gas.
2. **Parimutuel over CLOB.** No order book in v1. Pools are split YES/NO; payouts are proportional. Simpler math, simpler audit, faster to demo, no liquidity bootstrapping problem.
3. **Soulbound by default.** The Polagon Score never transfers. Reputation that can be bought is reputation that means nothing.
4. **Optimistic resolution, escape valve.** The market creator picks a resolver address (themselves, a multisig, or a future oracle). Disputes are out of scope for the MVP; the path to optimistic-oracle integration is reserved in `Reputation` for v2.
5. **Composable, not monolithic.** Three contracts, talking via Ink! cross-contract calls. Lets us evolve any layer without redeploying the others.

## 2. Contract layout

```
contracts/
├── Cargo.toml                 # Rust workspace
├── prediction_market/
│   ├── Cargo.toml
│   └── lib.rs                 # MarketFactory + Market in one contract (single-contract pattern)
├── reputation/
│   ├── Cargo.toml
│   └── lib.rs                 # PolagonScore (soulbound)
└── polls/
    ├── Cargo.toml
    └── lib.rs                 # community polls (no money, gas only)
```

We chose the **single-contract factory** pattern (markets indexed by `u64`) over **per-market contract instantiation** because:

- **Cheaper.** No per-market `instantiate` cost.
- **Simpler queries.** `list_markets()` is one call, not N.
- **Faster iteration.** One Wasm blob to redeploy when iterating.
- **Tradeoff:** one bad market does not have a unique address. We accept this for the MVP — the v2 split into `MarketFactory` + `Market` contracts is straightforward when state graduates from prototype to production.

## 3. Storage layouts

### `prediction_market::Polagon`

```rust
pub struct Polagon {
    owner: AccountId,                                       // protocol admin
    fee_recipient: AccountId,                               // where fees flow
    protocol_fee_bps: u16,                                  // basis points (e.g. 200 = 2%)
    create_market_fee: Balance,                             // POT to spawn a market
    next_market_id: u64,
    markets: Mapping<u64, Market>,                          // market by id
    positions: Mapping<(u64, AccountId, bool), Balance>,    // (market, user, side) → stake
    claimed: Mapping<(u64, AccountId), bool>,               // claim guard
    reputation: AccountId,                                  // address of Reputation contract
}

pub struct Market {
    id: u64,
    question: String,        // bounded length checked on entry
    creator: AccountId,
    resolver: AccountId,
    end_time: Timestamp,     // ms since epoch (Substrate)
    total_yes: Balance,
    total_no: Balance,
    status: MarketStatus,    // Open | Resolved | Cancelled
    outcome: Option<bool>,   // Some(true) = YES, Some(false) = NO
    created_at: Timestamp,
}
```

### `reputation::PolagonScore`

```rust
pub struct PolagonScore {
    owner: AccountId,                              // admin (can rotate market authority)
    market_authority: AccountId,                   // only this can record outcomes
    stats: Mapping<AccountId, ReputationStats>,    // per-user lifetime
}

pub struct ReputationStats {
    total_predictions: u64,
    correct_predictions: u64,
    total_staked: Balance,        // lifetime POT staked
    total_won: Balance,           // lifetime POT won
    score: u64,                   // derived metric (see §6)
    last_active: Timestamp,
}
```

## 4. Lifecycle of a market

```
       ┌──────────────┐
       │   created    │  Open, end_time in future
       └──────┬───────┘
              │  bet(yes|no, value: POT)
              ▼
       ┌──────────────┐
       │   accepting  │  total_yes / total_no grow
       └──────┬───────┘
              │  block_timestamp ≥ end_time
              │  resolver calls resolve(outcome)
              ▼
       ┌──────────────┐         creator/resolver may cancel
       │   resolved   │◀────────  before any bet is placed
       └──────┬───────┘                    (Cancelled state)
              │  winners call claim()
              ▼
       ┌──────────────┐
       │   settled    │  payouts emitted, reputation updated
       └──────────────┘
```

## 5. Payout math

Parimutuel pool with protocol fee `f` (in bps).

Let:
- `P_w` = winning pool (sum of stakes on winning side)
- `P_l` = losing pool (sum of stakes on losing side)
- `s_i` = user `i`'s stake on the winning side
- `bps` = 10_000

Each winner's payout:

```
payout_i = s_i + (s_i / P_w) × P_l × (bps - f) / bps
```

The fee `(s_i / P_w) × P_l × f / bps` is forwarded to `fee_recipient`.

If `P_w == 0` (no one bet on the winning side), the market is treated as a refund: every bettor on the losing side claims their original stake back, and no fee is taken. This avoids the "all stakes burned" pathology.

If `P_l == 0` (one-sided market), winners get exactly their stake back (no upside, no loss), and no fee is taken.

## 6. Polagon Score formula (v1)

A simple, gameable-but-good-enough first cut:

```
score = correct_predictions × 100
      + total_won_in_pot / 10**12     (1 POT contributed = +1 point)
      + bonus_streak_factor
```

Where `bonus_streak_factor` is `2^min(consecutive_correct, 5)` — caps the bonus at 32 to prevent runaway gaming.

We will tune this on testnet after seeing the distribution. The key property we want: **score grows with calibration, not with volume alone**. v2 will introduce Brier-score weighting for the polls layer.

## 7. Cross-contract call surface

```
  ┌────────────────────┐      ┌────────────────────┐
  │  Polagon (markets) │──┬──▶│  PolagonScore      │
  └────────────────────┘  │   └────────────────────┘
                          │
   on resolve(market_id, outcome):
       for each side ∈ {true, false}:
           call PolagonScore.record_outcome(
               market_id,
               outcome_was_correct ? side : !side,
               bettors_on_that_side          // only if cheap to enumerate
           )
```

**Implementation note for D5–D6:** enumerating all bettors of a market on-chain is expensive. v1 uses a **pull model**: `claim()` itself triggers `record_outcome(user, won, stake)` for the calling user. No iteration on-chain, gas paid by the user who benefits. The frontend reconstructs leaderboards from `record_outcome` events.

## 8. Frontend ↔ chain

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS, design tokens from REALIO DEX system in memory (`reference_simple_design_system.md`) |
| Wallet | `@polkadot/extension-dapp` for connection; `talisman-connect` as a fallback |
| Chain calls | `@polkadot/api` + `@polkadot/api-contract`; queries cached by SWR |
| State | React Server Components for read-only feeds, client components for signing flows |
| Charts | `recharts` (LightweightCharts is overkill for parimutuel) |
| Animations | `framer-motion` for the "bet placed", "score up", "market resolving" moments |

## 9. Security considerations (MVP scope)

What we mitigate in v1:

- **Re-entrancy on `claim`.** State updated **before** transfer; `claimed` flag flipped first.
- **Integer overflow in payout math.** Use `checked_mul` / `checked_div`, fail loudly.
- **Resolver griefing.** Resolver is fixed at market creation; can be a multisig. Documented as creator's responsibility.
- **Spam markets.** `create_market_fee` (configurable, non-zero) deters drive-by spam.

What we explicitly defer to v2:

- Optimistic dispute resolution (UMA-style) — interface reserved.
- Permissionless oracle (Pyth, Chainlink, off-chain validators).
- Slashing of malicious resolvers.
- Multi-outcome (categorical) markets — v1 is binary YES/NO only.
- Liquidity provider model — v1 is parimutuel only.

## 10. Open questions for the user

These get resolved during the build, tracking here so we don't forget:

1. **Portaldot RPC endpoint** — the [dev docs](https://portaldot-dev.readthedocs.io/en/latest/) will name the testnet endpoint. Pin in `.env.local` once known.
2. **Ink! version on Portaldot** — confirm whether Portaldot supports Ink! 5.x (latest) or pins to 4.x. The contract code uses 5.x conventions; backport is mechanical if needed.
3. **POT decimals** — assumed 12 (Substrate default). Confirm before computing any human-readable amounts.
4. **Existence of a faucet** — needed for testnet POT during development and demo.
