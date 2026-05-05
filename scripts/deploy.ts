/**
 * Polagon — deployment script.
 *
 * Reads the `.contract` artifacts produced by `cargo contract build --release`,
 * deploys both contracts to the configured RPC, wires them together, and writes
 * the resulting addresses + ABIs to `frontend/.env.local` and `frontend/src/lib/abi/`.
 *
 * Usage:
 *   pnpm install              # in scripts/
 *   pnpm deploy               # uses env vars below
 *
 * Required env vars:
 *   RPC_URL          — e.g. ws://127.0.0.1:9944 (local) or wss://rpc.testnet.portaldot.io
 *   DEPLOYER_SURI    — //Alice for local dev, your seed for testnet
 *
 * Optional:
 *   FEE_BPS          — protocol fee in bps (default 200 = 2%)
 *   CREATE_FEE       — POT (whole units) to create a market (default 1)
 */

import { ApiPromise, WsProvider } from "@polkadot/api";
import { CodePromise, ContractPromise } from "@polkadot/api-contract";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { BN } from "@polkadot/util";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const RPC_URL = process.env.RPC_URL ?? "ws://127.0.0.1:9944";
const DEPLOYER_SURI = process.env.DEPLOYER_SURI ?? "//Alice";
const FEE_BPS = parseInt(process.env.FEE_BPS ?? "200", 10);
const CREATE_FEE_POT = new BN(process.env.CREATE_FEE ?? "1");

const POT_DECIMALS = 12n;
const ONE_POT = new BN(10).pow(new BN(Number(POT_DECIMALS)));
const CREATE_FEE = CREATE_FEE_POT.mul(ONE_POT);

// Generous gas / storage caps for deployment. Tune if Portaldot has stricter limits.
const GAS_LIMIT_DEPLOY = { refTime: 100_000_000_000n, proofSize: 1_000_000n };
const STORAGE_DEPOSIT_LIMIT = null;

interface ContractArtifact {
  abiJson: Record<string, unknown>;
  wasm: `0x${string}`;
}

function loadArtifact(name: string): ContractArtifact {
  const candidates = [
    resolve(ROOT, "contracts", name, "target", "ink", `${name}.contract`),
    resolve(ROOT, "contracts", "target", "ink", name, `${name}.contract`),
  ];
  const path = candidates.find((p) => existsSync(p));
  if (!path) {
    throw new Error(
      `Cannot find ${name}.contract. Run \`make build-contracts\` first.\n` +
        `Looked in:\n${candidates.map((c) => "  - " + c).join("\n")}`,
    );
  }
  const bundle = JSON.parse(readFileSync(path, "utf8"));
  const wasm = (bundle.source?.wasm ?? bundle.source?.contract_binary) as `0x${string}`;
  if (!wasm) throw new Error(`${name}.contract is missing source.wasm`);
  return { abiJson: bundle, wasm };
}

async function deployContract(
  api: ApiPromise,
  signer: ReturnType<Keyring["addFromUri"]>,
  artifact: ContractArtifact,
  args: unknown[],
  label: string,
): Promise<ContractPromise> {
  const code = new CodePromise(api, artifact.abiJson, artifact.wasm);
  const tx = code.tx.new({ gasLimit: api.registry.createType("WeightV2", GAS_LIMIT_DEPLOY), storageDepositLimit: STORAGE_DEPOSIT_LIMIT, value: 0 }, ...args);

  console.log(`[deploy] uploading ${label}…`);
  return new Promise((resolveDeploy, rejectDeploy) => {
    let unsub: (() => void) | undefined;
    tx
      .signAndSend(signer, ({ status, dispatchError, contract, events }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            rejectDeploy(new Error(`${label} dispatchError: ${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`));
          } else {
            rejectDeploy(new Error(`${label} dispatchError: ${dispatchError.toString()}`));
          }
          unsub?.();
          return;
        }
        if (status.isInBlock || status.isFinalized) {
          if (contract) {
            console.log(`[deploy] ${label} → ${contract.address.toString()} (block: ${status.hash.toHex()})`);
            resolveDeploy(contract);
            unsub?.();
          } else {
            // Fallback: search Instantiated event.
            const inst = events.find((e) => api.events.contracts?.Instantiated?.is(e.event));
            if (inst) {
              const addr = inst.event.data[1].toString();
              console.log(`[deploy] ${label} → ${addr} (from event)`);
              resolveDeploy(new ContractPromise(api, artifact.abiJson, addr));
              unsub?.();
            } else {
              rejectDeploy(new Error(`${label} included but no contract address found`));
              unsub?.();
            }
          }
        }
      })
      .then((u) => {
        unsub = u;
      })
      .catch(rejectDeploy);
  });
}

async function call(
  contract: ContractPromise,
  signer: ReturnType<Keyring["addFromUri"]>,
  method: string,
  args: unknown[],
  label: string,
): Promise<void> {
  const tx = contract.tx[method](
    { gasLimit: contract.api.registry.createType("WeightV2", { refTime: 30_000_000_000n, proofSize: 500_000n }), storageDepositLimit: null, value: 0 },
    ...args,
  );
  console.log(`[wire] ${label}…`);
  await new Promise<void>((res, rej) => {
    let unsub: (() => void) | undefined;
    tx
      .signAndSend(signer, ({ status, dispatchError }) => {
        if (dispatchError) {
          rej(new Error(`${label} failed: ${dispatchError.toString()}`));
          unsub?.();
        }
        if (status.isInBlock || status.isFinalized) {
          console.log(`[wire] ${label} ✓`);
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

async function main() {
  await cryptoWaitReady();
  const api = await ApiPromise.create({ provider: new WsProvider(RPC_URL) });
  const signer = new Keyring({ type: "sr25519" }).addFromUri(DEPLOYER_SURI);

  console.log(`[deploy] connected to ${RPC_URL}`);
  console.log(`[deploy] deployer: ${signer.address}`);

  const predictionMarket = loadArtifact("prediction_market");
  const reputation = loadArtifact("reputation");

  // 1. Reputation first (no constructor args).
  const repContract = await deployContract(api, signer, reputation, [], "reputation");

  // 2. PredictionMarket (fee_recipient, protocol_fee_bps, create_market_fee).
  const pmContract = await deployContract(
    api,
    signer,
    predictionMarket,
    [signer.address, FEE_BPS, CREATE_FEE.toString()],
    "prediction_market",
  );

  // 3. Wire them.
  await call(pmContract, signer, "setReputation", [repContract.address.toString()], "prediction_market.set_reputation");
  await call(repContract, signer, "setMarketAuthority", [pmContract.address.toString()], "reputation.set_market_authority");

  // 4. Persist artifacts for the frontend.
  const abiDir = resolve(ROOT, "frontend", "src", "lib", "abi");
  mkdirSync(abiDir, { recursive: true });
  writeFileSync(resolve(abiDir, "prediction_market.json"), JSON.stringify(predictionMarket.abiJson, null, 2));
  writeFileSync(resolve(abiDir, "reputation.json"), JSON.stringify(reputation.abiJson, null, 2));

  // 5. Write addresses to frontend/.env.local — preserve any pre-existing keys.
  const envPath = resolve(ROOT, "frontend", ".env.local");
  const prev = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const lines = new Map<string, string>();
  for (const line of prev.split("\n")) {
    const [k, ...rest] = line.split("=");
    if (k && rest.length) lines.set(k.trim(), rest.join("="));
  }
  lines.set("NEXT_PUBLIC_RPC_URL", RPC_URL);
  lines.set("NEXT_PUBLIC_FACTORY_ADDRESS", pmContract.address.toString());
  lines.set("NEXT_PUBLIC_REPUTATION_ADDRESS", repContract.address.toString());
  lines.set("NEXT_PUBLIC_NATIVE_SYMBOL", "POT");
  lines.set("NEXT_PUBLIC_NATIVE_DECIMALS", "12");
  writeFileSync(envPath, [...lines].map(([k, v]) => `${k}=${v}`).join("\n") + "\n");

  console.log("\n[deploy] done.");
  console.log(`  prediction_market: ${pmContract.address.toString()}`);
  console.log(`  reputation:        ${repContract.address.toString()}`);
  console.log(`  frontend env:      ${envPath}`);

  await api.disconnect();
}

main().catch((err) => {
  console.error("[deploy] fatal:", err);
  process.exit(1);
});
