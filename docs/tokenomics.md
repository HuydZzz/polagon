# Polagon — Tokenomics

Polagon is a **single-token protocol**: POT, the native token of Portaldot. We do not issue a Polagon token.

## Why no Polagon token

1. **Alignment with Portaldot.** Every fee, stake, and gas payment denominated in POT means Polagon's success directly drives demand for the chain's native asset — which is exactly what wins endorsements from chain teams.
2. **No regulatory complexity.** A new token is a new attack surface, both legally and operationally. Skipping it lets a solo builder ship faster.
3. **No bootstrap problem.** A Polagon token would need liquidity, distribution, and emissions design. POT already exists.

## Fee structure

| Fee | Default | Configurable by | Direction |
|---|---|---|---|
| `create_market_fee` | 1 POT | owner | Forwarded immediately to `fee_recipient` |
| `protocol_fee_bps` | 200 (2%) | owner | Deducted from winners' share of losing pool, forwarded on `claim()` |

There is **no fee on stakes themselves** — only on payouts. A bettor who loses pays no fee beyond their lost stake; a bettor who wins effectively pays a 2% take rate on their gross winnings.

## Worked example

Setup: 200 bps fee, market resolves YES, pools `total_yes = 1,000 POT`, `total_no = 500 POT`. Bob bet `100 POT YES`.

```
share_pre_fee  = 100/1000 × 500            = 50 POT
fee_taken      = 50 × 200/10000             =  1 POT  → fee_recipient
share_post_fee = 50 × (10000-200)/10000     = 49 POT  → Bob (on top of stake)
total_payout   = 100 + 49                   = 149 POT
```

Bob's effective return: 49% on the bet (vs. 50% if no fee). The fee is small but compounds across volume.

## Volume sensitivity

Hypothetical fee revenue at various weekly volume levels (assuming 50% of stake ends up on the winning side, i.e. balanced markets):

| Weekly volume (POT) | Weekly fee (POT) | Implied annual fee (POT) |
|---:|---:|---:|
| 10,000 | 100 | 5,200 |
| 100,000 | 1,000 | 52,000 |
| 1,000,000 | 10,000 | 520,000 |

These are illustrative. Actual fee revenue depends on market balance (skew = lower fee), resolution rate, and creator activity.

## Fee allocation (post-hackathon, off-chain commitment)

Until v2 introduces an on-chain treasury, fees flow to a single `fee_recipient` address. The protocol team commits to the following allocation:

```
   ┌─────────────────────────────────────────────────────┐
   │ Fee revenue                                         │
   │                                                     │
   │  ┌──────────────────────┐  50%  → Ecosystem grants  │
   │  │                      │       (Polagon Score      │
   │  │                      │        adopters)          │
   │  └──────────────────────┘                           │
   │                                                     │
   │  ┌────────────┐          30%  → Operational costs   │
   │  │            │                (hosting, RPC, dev)  │
   │  └────────────┘                                     │
   │                                                     │
   │  ┌────────┐              20%  → Bounties + future   │
   │  │        │                    incentive programs   │
   │  └────────┘                                         │
   └─────────────────────────────────────────────────────┘
```

## Sustainability conditions

For the protocol to be self-sustaining at the operational level, weekly fees must exceed:

- Hosting frontend (Vercel hobby + custom domain): ~$0 + $12/year
- RPC / archive node access: ~$50/month if using a paid provider; $0 if running our own
- Continued dev labor: variable

At a conservative ~$300/month operational floor and a POT price of $0.10 (illustrative), weekly fee revenue of **~750 POT** sustains the protocol. This corresponds to ~$75,000/week in market volume — a low bar for a working prediction-market platform.

## What POT demand looks like for Portaldot

Polagon creates POT demand through:

1. **Gas** — every market action is a transaction.
2. **Stakes** — every bet locks POT until resolution.
3. **Creation fee** — every market spawns POT velocity.
4. **Score gating** (future) — applications consuming Polagon Score may require minimum POT stake to interact.

For the chain team, this is the win condition: a flagship dApp whose growth maps 1:1 to native-token utility.

## v2 ideas (NOT shipped in hackathon)

| Mechanism | Brief |
|---|---|
| On-chain treasury | Replace the off-chain `fee_recipient` with a treasury contract governed by Polagon Score holders. |
| Score-staking | Allow users to "pledge" their score on a market — winning grows it faster, losing slashes it. |
| Resolver bonds | Resolvers must lock POT collateral; bond is slashed if a dispute resolution overturns their call. |
| Market-creation reputation | Creators of high-volume, well-resolved markets earn a separate "creator score". |

These are intentionally out of scope for v1 to keep the hackathon build focused.
