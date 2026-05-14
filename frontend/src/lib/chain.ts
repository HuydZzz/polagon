/**
 * Chain client — singleton ApiPromise + lazy-loaded contract ABIs.
 *
 * The frontend deliberately **never** awaits the connection during SSR. Every
 * function here is async and called from client components only. If the chain
 * isn't reachable, callers should fall back to mock data (see `env.ts`).
 */

import { ApiPromise, WsProvider } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";
import type { WeightV2 } from "@polkadot/types/interfaces";
import { env, isChainWired, isPollsWired } from "./env";

let apiSingleton: Promise<ApiPromise> | undefined;

export function getApi(): Promise<ApiPromise> {
  if (!apiSingleton) {
    apiSingleton = ApiPromise.create({ provider: new WsProvider(env.rpcUrl) });
  }
  return apiSingleton;
}

let pmContract: ContractPromise | undefined;
let repContract: ContractPromise | undefined;
let pollsContract: ContractPromise | undefined;

async function loadAbi(name: string): Promise<unknown | undefined> {
  // ABIs are written to `lib/abi/` by `make deploy`. Before then, the import
  // resolves to nothing and the frontend stays in mock mode.
  try {
    const mod = await import(/* webpackIgnore: true */ `./abi/${name}.json`);
    return mod.default ?? mod;
  } catch {
    return undefined;
  }
}

export async function getPredictionMarket(): Promise<ContractPromise | undefined> {
  if (!isChainWired) return undefined;
  if (pmContract) return pmContract;
  const abi = await loadAbi("prediction_market");
  if (!abi) return undefined;
  const api = await getApi();
  pmContract = new ContractPromise(api, abi as never, env.factoryAddress);
  return pmContract;
}

export async function getReputation(): Promise<ContractPromise | undefined> {
  if (!isChainWired) return undefined;
  if (repContract) return repContract;
  const abi = await loadAbi("reputation");
  if (!abi) return undefined;
  const api = await getApi();
  repContract = new ContractPromise(api, abi as never, env.reputationAddress);
  return repContract;
}

export async function getPolls(): Promise<ContractPromise | undefined> {
  if (!isPollsWired) return undefined;
  if (pollsContract) return pollsContract;
  const abi = await loadAbi("polls");
  if (!abi) return undefined;
  const api = await getApi();
  pollsContract = new ContractPromise(api, abi as never, env.pollsAddress);
  return pollsContract;
}

/** Default gas budget used for read calls. Reads don't actually charge it. */
export function readGas(api: { registry: ApiPromise["registry"] }): WeightV2 {
  return api.registry.createType("WeightV2", {
    refTime: BigInt(10_000_000_000),
    proofSize: BigInt(500_000),
  }) as WeightV2;
}

/** Default gas budget used for write calls. Generous for hackathon. */
export function writeGas(api: { registry: ApiPromise["registry"] }): WeightV2 {
  return api.registry.createType("WeightV2", {
    refTime: BigInt(50_000_000_000),
    proofSize: BigInt(1_000_000),
  }) as WeightV2;
}
