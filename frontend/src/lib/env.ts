/**
 * Centralized access to env config + the "is the chain wired?" flag.
 *
 * If `NEXT_PUBLIC_FACTORY_ADDRESS` is unset, the app falls back to mock data so
 * the UI is still navigable for new contributors without a deploy.
 */

export const env = {
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "ws://127.0.0.1:9944",
  factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "",
  reputationAddress: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ?? "",
  pollsAddress: process.env.NEXT_PUBLIC_POLLS_ADDRESS ?? "",
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME ?? "Portaldot",
  symbol: process.env.NEXT_PUBLIC_NATIVE_SYMBOL ?? "POT",
  decimals: parseInt(process.env.NEXT_PUBLIC_NATIVE_DECIMALS ?? "12", 10),
} as const;

export const isChainWired = Boolean(env.factoryAddress && env.reputationAddress);
export const isPollsWired = Boolean(env.pollsAddress);
