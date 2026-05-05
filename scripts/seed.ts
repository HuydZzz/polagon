/**
 * Polagon — testnet seeder.
 *
 * Creates a handful of demonstration markets so the demo / dogfood runs feel real.
 * Reads the prediction_market address from frontend/.env.local.
 *
 * Usage:
 *   pnpm seed
 *
 * Required env vars:
 *   RPC_URL          — same chain that was deployed against
 *   DEPLOYER_SURI    — funded account (// Alice for local; your seed for testnet)
 */

import { ApiPromise, WsProvider } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { BN } from "@polkadot/util";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const RPC_URL = process.env.RPC_URL ?? "ws://127.0.0.1:9944";
const DEPLOYER_SURI = process.env.DEPLOYER_SURI ?? "//Alice";
const ONE_POT = new BN(10).pow(new BN(12));

const SEED_MARKETS = [
  { q: "Will BTC close above $200,000 on December 31, 2026?", days: 60 },
  { q: "Will Portaldot mainnet launch before Q4 2026?", days: 120 },
  { q: "Will the next US Fed decision cut rates by 50bps or more?", days: 14 },
  { q: "Will OpenAI release a new flagship model before May 31, 2026?", days: 27 },
  { q: "Will at least 10 dApps be deployed on Portaldot by end of 2026?", days: 200 },
];

function readEnv(key: string): string | undefined {
  const path = resolve(ROOT, "frontend", ".env.local");
  if (!existsSync(path)) return undefined;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const [k, ...rest] = line.split("=");
    if (k?.trim() === key) return rest.join("=").trim();
  }
  return undefined;
}

async function main() {
  await cryptoWaitReady();
  const api = await ApiPromise.create({ provider: new WsProvider(RPC_URL) });
  const signer = new Keyring({ type: "sr25519" }).addFromUri(DEPLOYER_SURI);

  const factoryAddr = readEnv("NEXT_PUBLIC_FACTORY_ADDRESS");
  if (!factoryAddr) throw new Error("NEXT_PUBLIC_FACTORY_ADDRESS missing — run `make deploy` first");

  const abi = JSON.parse(readFileSync(resolve(ROOT, "frontend/src/lib/abi/prediction_market.json"), "utf8"));
  const contract = new ContractPromise(api, abi, factoryAddr);

  console.log(`[seed] using prediction_market at ${factoryAddr}`);
  console.log(`[seed] signer: ${signer.address}`);

  for (const [i, m] of SEED_MARKETS.entries()) {
    const endTime = Date.now() + m.days * 86_400_000;
    const tx = contract.tx.createMarket(
      {
        gasLimit: api.registry.createType("WeightV2", { refTime: 50_000_000_000n, proofSize: 500_000n }),
        storageDepositLimit: null,
        value: ONE_POT.toString(), // pay 1 POT creation fee
      },
      m.q,
      endTime,
      signer.address,
    );
    await new Promise<void>((res, rej) => {
      let unsub: (() => void) | undefined;
      tx
        .signAndSend(signer, ({ status, dispatchError }) => {
          if (dispatchError) {
            rej(new Error(`market ${i} failed: ${dispatchError.toString()}`));
            unsub?.();
          }
          if (status.isInBlock) {
            console.log(`[seed] market ${i} created: "${m.q}"`);
            res();
            unsub?.();
          }
        })
        .then((u) => {
          unsub = u;
        })
        .catch(rej);
    });
  }

  console.log("\n[seed] done.");
  await api.disconnect();
}

main().catch((err) => {
  console.error("[seed] fatal:", err);
  process.exit(1);
});
