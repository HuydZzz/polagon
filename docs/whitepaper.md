# Polagon — Whitepaper (v0.1, hackathon edition)

> _A working draft, written during the build. Specifics will tighten as testnet usage produces real numbers._

## 1. Introduction

Markets are how civilizations price uncertainty. Stock markets price firms; futures markets price commodities; insurance markets price risk. **Prediction markets** price *belief itself* — and they are the only mechanism humans have invented that systematically aggregates dispersed knowledge into a single, real-time signal. As Hayek argued in 1945, no central planner can match the informational efficiency of a price formed by participants with skin in the game.

The Web3 instantiation of this idea is alive: Polymarket processed over $9B in volume during 2024–2025. Yet the on-chain prediction-market category remains constrained by:

1. **Geography.** Most jurisdictions ban Polymarket access; the protocol survives largely on permissive geography arbitrage.
2. **Single-purpose surface.** Today's leading protocols only do binary money markets; they don't extend the primitive into governance, polls, or reputation.
3. **Statelessness.** When a market resolves, the user's accuracy disappears. There is no portable "I called this" credential.

Polagon, built natively on **Portaldot**, addresses (2) and (3) directly. Geography (1) is left to user discretion and the chain's permissionless nature.

## 2. Design overview

Polagon is one protocol in **three composable layers**:

### 2.1 Markets (parimutuel)

Binary YES/NO markets with **parimutuel** payout (winners split the losing pool proportionally). No order book, no LPs, no oracle dependency for the time dimension. Stake is denominated in POT; gas is paid in POT.

Why parimutuel and not CLOB?

- **No bootstrapping problem.** A CLOB market needs market-makers from day one. A parimutuel market is meaningful with N=2 participants.
- **Smaller attack surface.** No need for off-chain order matching, no MEV in the ordering layer.
- **Faster to ship.** Critical for a 27-day hackathon build.
- **Easier to demo.** The pool donut chart is intuitive in 2 seconds; an order-book chart isn't.

We accept the tradeoff: parimutuel offers worse price discovery before resolution. v2 may layer a CLOB on top; v1 ships parimutuel only.

### 2.2 Polls (lightweight, weighted)

Communities (DAOs, Discord servers, Substrate-native treasuries) need cheap, sybil-resistant signaling. A Polagon poll:

- Anyone may create one for ~free (gas only). No stake required.
- Voting weight = `f(reputation, optional_min_pot_stake)`. The default formula in v1 is `1 + log2(score)` with a configurable POT-stake multiplier.
- Polls don't pay out. They are coordination tools, not gambling.

### 2.3 Polagon Score (soulbound reputation)

The unique unlock. A non-transferable on-chain ledger of every prediction outcome per address:

```
score = correct_predictions × 100
      + (total_won_in_pot / 10^12)
      + 2^min(streak, 5)
```

This score is **portable inside Portaldot** — any other dApp on Portaldot can read it via the `reputation` contract's public methods. We expect future Portaldot apps (lending, governance, identity) to use Polagon Score as a Sybil resistance layer.

## 3. Mechanics

### 3.1 Market lifecycle

```
created (Open) ── bets ──→ end_time reached ── resolver acts ──→ Resolved
                                                       └────────→ Cancelled (if no bets, creator only)
```

Resolution authority is **the address chosen by the market creator at creation time**. Frequently this is:

- The creator themselves (for personal markets).
- A multisig (for community markets).
- An oracle adapter (in v2, when we ship the optimistic-oracle interface).

The MVP intentionally does not bake oracle assumptions into the protocol. This keeps the core small and lets the resolver question be answered by social, technical, or economic mechanisms as the ecosystem matures.

### 3.2 Payout math

For winning side `s` with pool `P_w`, losing pool `P_l`, and protocol fee `f` (basis points), each winner with stake `s_i` receives:

```
payout_i = s_i + (s_i / P_w) × P_l × (10000 − f) / 10000
```

The fee `(s_i / P_w) × P_l × f / 10000` is forwarded to `fee_recipient`.

Edge cases (defined explicitly to remove ambiguity):

| Case | Behavior |
|---|---|
| `P_w = 0` (no one bet on the winning side) | Losing-side stakers refund their stake. No fee. |
| `P_l = 0` (one-sided market) | Winners refund their stake (no upside). No fee. |
| Market `Cancelled` | All stakers refund. No fee. |

### 3.3 Reputation update (pull model)

When a user calls `claim` on `prediction_market`, the contract performs a cross-contract call to `reputation.record_outcome(user, market_id, won, stake, payout)`. This avoids on-chain enumeration of all bettors at resolve-time, which would be O(N) and gas-prohibitive. Each user pays the marginal gas to register their own outcome.

If a user **never claims** (e.g., a small stake on a losing position they abandon), no reputation entry is written. This is a deliberate design choice: reputation requires a positive on-chain action.

## 4. Tokenomics

Polagon does **not** issue a token. POT is the only economic primitive. This is a feature.

Revenue: protocol fee (`protocol_fee_bps`, default 200 = 2%) on the losing pool of every resolved market, plus `create_market_fee` (default 1 POT). Both flow to `fee_recipient`, configurable by the protocol owner.

Suggested allocation of fee revenue (post-hackathon):

- 50% → ecosystem grants for builders adopting Polagon Score in their dApps
- 30% → operational costs (RPC, frontend hosting, dev work)
- 20% → reserved for incentive programs (e.g., bounties for accurate resolvers)

This is documented commitment, not on-chain enforcement. v2 may move treasury to an on-chain contract.

See [tokenomics.md](./tokenomics.md) for fee-flow diagrams and sustainability analysis.

## 5. Open questions / future work

| Topic | Status |
|---|---|
| Multi-outcome (categorical) markets | Deferred to v2. Storage layout supports extension via `outcome: Option<u8>`. |
| Optimistic oracle integration (UMA-style) | Deferred. `Resolver: AccountId` slot is the integration point. |
| Continuous markets (price feeds) | Long-term. Requires native price oracle on Portaldot. |
| Liquidity-provider AMM mode | Long-term. Parimutuel-and-LP coexistence is non-trivial. |
| Cross-chain reputation read | Long-term. Awaits Portaldot bridges. |

## 6. Security

The hackathon scope explicitly limits security claims:

- **Core invariants** (no double-claim, no overflow, no payout exceeding pool) are unit-tested.
- **Re-entrancy** is mitigated by state-before-transfer ordering, even though Ink!'s execution model already restricts the attack surface.
- **Resolver griefing** is acknowledged as creator-responsibility. The protocol does not police resolver behavior in v1.
- **No formal verification** has been performed. Production deployment would require an audit (~$30k-$60k typical for a contract of this size).

## 7. References

- F.A. Hayek, *The Use of Knowledge in Society* (1945) — the foundational case for prices as information aggregators.
- Robin Hanson, *Combinatorial Information Market Design* (2003) — the prediction-market literature's canonical paper.
- Polymarket protocol documentation — empirical reference for how a CLOB-based prediction market behaves in production.
- Portaldot developer documentation — https://portaldot-dev.readthedocs.io/en/latest/
