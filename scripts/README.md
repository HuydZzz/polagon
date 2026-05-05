# Polagon — Scripts

Deployment and seeding scripts for the Polagon protocol.

## Setup

```bash
cd scripts
pnpm install
```

## Deploy

```bash
# local node (Alice has free funds)
RPC_URL=ws://127.0.0.1:9944 DEPLOYER_SURI=//Alice pnpm deploy

# Portaldot testnet
RPC_URL=wss://rpc.testnet.portaldot.io DEPLOYER_SURI="$YOUR_SEED" pnpm deploy
```

What it does:
1. Loads `prediction_market.contract` and `reputation.contract` produced by `cargo contract build --release`.
2. Deploys `reputation` (no constructor args).
3. Deploys `prediction_market` with `(deployer, 200, 1 POT)` — 2% fee, 1 POT to create a market.
4. Wires the two: `prediction_market.set_reputation(rep_addr)` and `reputation.set_market_authority(pm_addr)`.
5. Writes the ABIs to [../frontend/src/lib/abi/](../frontend/src/lib/abi/).
6. Writes addresses + RPC URL to [../frontend/.env.local](../frontend/.env.local).

## Seed

```bash
pnpm seed   # creates 5 demonstration markets
```

Reads the deployed `prediction_market` address from `frontend/.env.local` and submits 5 `create_market` transactions, each paying the 1 POT creation fee.

## Conventions

- Both scripts are idempotent in the sense that re-running `deploy` simply deploys fresh contracts and updates the env file. There's no upgrade flow yet.
- Gas limits are set generously for hackathon use. They can be tightened once we have empirical measurements from testnet.
- Scripts use `tsx` (no compilation step needed); requires Node 20+.
