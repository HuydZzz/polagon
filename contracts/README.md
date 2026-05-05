# Polagon — Smart Contracts

Two Ink! 5.x contracts:

| Crate | Purpose |
|---|---|
| [`prediction_market`](./prediction_market/) | Single-contract factory + parimutuel market. Stores all markets, positions, claims. |
| [`reputation`](./reputation/) | Soulbound `PolagonScore` ledger. Only the market contract may write. |

## Build

```bash
# install once:
rustup target add wasm32-unknown-unknown
cargo install cargo-contract --version "^5" --force

# from contracts/
cd prediction_market && cargo contract build --release && cd ..
cd reputation         && cargo contract build --release && cd ..
```

Each build emits `target/ink/<name>.contract` — the artifact you upload to Portaldot.

## Test

```bash
cargo test --workspace --features std
```

Unit tests cover happy paths + every error branch in `prediction_market`, plus the streak/accuracy edge cases in `reputation`. End-to-end ink! tests (`ink_e2e`) are wired in `[features.e2e-tests]` and will be added in D6 of the roadmap.

## Deploy & wire (testnet)

1. Deploy `reputation` first (no constructor args).
2. Deploy `prediction_market` with `(fee_recipient, protocol_fee_bps, create_market_fee)` — for testnet the docs suggest `(admin_addr, 200, 1_000_000_000_000)` (= 2% fee + 1 POT to create a market).
3. Wire them: call `prediction_market.set_reputation(<reputation_addr>)`, then `reputation.set_market_authority(<prediction_market_addr>)`.
4. Pin both addresses in `frontend/.env.local`.

> See [../ARCHITECTURE.md](../ARCHITECTURE.md) §3–§7 for storage layouts, payout math, and cross-contract call surface.

## Versioning

- Ink! pinned to `5.1` — Portaldot dev docs should be checked for confirmed Ink! version. If Portaldot pins to 4.x, the only mechanical change is replacing `Mapping::default()` with the 4.x init pattern in the constructors.
- POT decimals assumed at **12** (Substrate default) for the score formula's `POT_DECIMALS_FACTOR`. If Portaldot uses different decimals, update the constant in [reputation/lib.rs](./reputation/lib.rs).
