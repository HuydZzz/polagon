/**
 * Contract wrappers — typed methods that hide the `@polkadot/api-contract` dance.
 *
 * Every method here either:
 *   (a) is a read (`query.*`) → returns a typed Promise<T>; throws on chain error.
 *   (b) is a write — returns the unsigned `SubmittableExtrinsic` so the caller
 *       (a hook with wallet context) can attach a signer and `signAndSend`.
 *
 * If contracts aren't deployed yet (`isChainWired === false`) the read methods
 * throw `ChainNotWiredError` so callers can fall back to mock data deliberately.
 */

import type { ContractPromise } from "@polkadot/api-contract";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { BN } from "@polkadot/util";
import {
  getPolls,
  getPredictionMarket,
  getReputation,
  writeGas,
  readGas,
} from "./chain";
import { isChainWired, isPollsWired } from "./env";
import type {
  Market,
  MarketStatus,
  Poll,
  PollStatus,
  ReputationStats,
  UserPosition,
} from "./types";

export class ChainNotWiredError extends Error {
  constructor() {
    super("Polagon contracts are not deployed yet — frontend running in mock mode.");
    this.name = "ChainNotWiredError";
  }
}

const READ_OPTS = (api: ContractPromise["api"]) => ({
  gasLimit: readGas(api),
  storageDepositLimit: null,
});

const WRITE_OPTS = (api: ContractPromise["api"], value: bigint = 0n) => ({
  gasLimit: writeGas(api),
  storageDepositLimit: null,
  value: value.toString(),
});

/* ------------------------------- decoding -------------------------------- */

interface RawMarket {
  id: string | number;
  question: string;
  creator: { toString(): string } | string;
  resolver: { toString(): string } | string;
  endTime: string | number;
  totalYes: string | number | { toString(): string };
  totalNo: string | number | { toString(): string };
  status: { toString(): string } | string;
  outcome: boolean | null | { isSome?: boolean; unwrap?: () => boolean };
  createdAt: string | number;
}

function asBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") return BigInt(v.replace(/_/g, "").replace(/,/g, ""));
  if (v && typeof (v as { toString: () => string }).toString === "function") {
    return BigInt((v as { toString: () => string }).toString().replace(/_/g, ""));
  }
  return 0n;
}

function asNumber(v: unknown): number {
  return Number(asBigInt(v));
}

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof (v as { toString: () => string }).toString === "function") return (v as { toString: () => string }).toString();
  return "";
}

function decodeMarket(raw: RawMarket): Market {
  const status = asString(raw.status) as MarketStatus;
  const outcomeRaw = raw.outcome as never;
  let outcome: boolean | undefined;
  if (typeof outcomeRaw === "boolean") outcome = outcomeRaw;
  else if (outcomeRaw && typeof outcomeRaw === "object") {
    const o = outcomeRaw as { isSome?: boolean; unwrap?: () => boolean };
    if (o.isSome && o.unwrap) outcome = o.unwrap();
  }
  return {
    id: asNumber(raw.id),
    question: asString(raw.question),
    category: deriveCategory(asString(raw.question)),
    creator: asString(raw.creator),
    resolver: asString(raw.resolver),
    endTime: asNumber(raw.endTime),
    totalYes: asBigInt(raw.totalYes),
    totalNo: asBigInt(raw.totalNo),
    status,
    outcome,
    createdAt: asNumber(raw.createdAt),
  };
}

function deriveCategory(question: string): string {
  const q = question.toLowerCase();
  if (/btc|eth|solana|sol\b|crypto|coin/.test(q)) return "Crypto";
  if (/portaldot|polkadot|substrate|parachain/.test(q)) return "Portaldot";
  if (/fed|rate|inflation|gdp|recession/.test(q)) return "Macro";
  if (/election|president|senate|policy/.test(q)) return "Politics";
  if (/lakers|nba|nfl|world cup|olymp/.test(q)) return "Sports";
  if (/openai|gpt|llm|model|claude/.test(q)) return "AI";
  return "General";
}

/* --------------------------- prediction_market --------------------------- */

export async function getMarketCount(): Promise<number> {
  if (!isChainWired) throw new ChainNotWiredError();
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.getMarketCount(zeroSender(c), READ_OPTS(c.api));
  if (!result.isOk) throw new Error("getMarketCount: query failed");
  return asNumber(output?.toJSON());
}

export async function listMarkets(start = 0, limit = 50): Promise<Market[]> {
  if (!isChainWired) throw new ChainNotWiredError();
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.listMarkets(
    zeroSender(c),
    READ_OPTS(c.api),
    start,
    limit,
  );
  if (!result.isOk) throw new Error("listMarkets: query failed");
  const arr = (output?.toJSON() ?? []) as RawMarket[];
  return arr.map(decodeMarket);
}

export async function getMarket(id: number): Promise<Market | undefined> {
  if (!isChainWired) throw new ChainNotWiredError();
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.getMarket(zeroSender(c), READ_OPTS(c.api), id);
  if (!result.isOk) return undefined;
  const json = output?.toJSON() as RawMarket | null;
  return json ? decodeMarket(json) : undefined;
}

export async function getPosition(marketId: number, who: string): Promise<UserPosition> {
  if (!isChainWired) throw new ChainNotWiredError();
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.getPosition(zeroSender(c), READ_OPTS(c.api), marketId, who);
  if (!result.isOk) return { yes: 0n, no: 0n };
  const tuple = output?.toJSON() as [unknown, unknown];
  return { yes: asBigInt(tuple[0]), no: asBigInt(tuple[1]) };
}

/* --- writes --- */

export async function txCreateMarket(
  question: string,
  endTime: number,
  resolver: string,
  fee: bigint,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  return c.tx.createMarket(WRITE_OPTS(c.api, fee), question, endTime, resolver);
}

export async function txBet(
  marketId: number,
  side: boolean,
  stake: bigint,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  return c.tx.bet(WRITE_OPTS(c.api, stake), marketId, side);
}

export async function txResolve(
  marketId: number,
  outcome: boolean,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  return c.tx.resolve(WRITE_OPTS(c.api), marketId, outcome);
}

export async function txClaim(
  marketId: number,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  return c.tx.claim(WRITE_OPTS(c.api), marketId);
}

export async function txCancel(
  marketId: number,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPredictionMarket();
  if (!c) throw new ChainNotWiredError();
  return c.tx.cancel(WRITE_OPTS(c.api), marketId);
}

/* --------------------------------- polls --------------------------------- */

interface RawPoll {
  id: string | number;
  question: string;
  options: string[];
  creator: { toString(): string } | string;
  endTime: string | number;
  votesPerOption: (string | number)[];
  totalVoters: string | number;
  status: { toString(): string } | string;
  createdAt: string | number;
}

function decodePoll(raw: RawPoll): Poll {
  const status = asString(raw.status) as PollStatus;
  const question = asString(raw.question);
  return {
    id: asNumber(raw.id),
    question,
    options: (raw.options ?? []).map((o) => asString(o)),
    creator: asString(raw.creator),
    endTime: asNumber(raw.endTime),
    votesPerOption: (raw.votesPerOption ?? []).map((v) => asNumber(v)),
    totalVoters: asNumber(raw.totalVoters),
    status,
    createdAt: asNumber(raw.createdAt),
    category: derivePollCategory(question),
  };
}

function derivePollCategory(question: string): string {
  const q = question.toLowerCase();
  if (/protocol|fee|governance|grant/.test(q)) return "Governance";
  if (/score|reputation|brier|streak/.test(q)) return "Reputation";
  if (/feature|build|next|launch/.test(q)) return "Roadmap";
  if (/category|featured|curat/.test(q)) return "Curation";
  return "Community";
}

export async function getPollCount(): Promise<number> {
  if (!isPollsWired) throw new ChainNotWiredError();
  const c = await getPolls();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.getPollCount(zeroSender(c), READ_OPTS(c.api));
  if (!result.isOk) throw new Error("getPollCount: query failed");
  return asNumber(output?.toJSON());
}

export async function listPolls(start = 0, limit = 50): Promise<Poll[]> {
  if (!isPollsWired) throw new ChainNotWiredError();
  const c = await getPolls();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.listPolls(
    zeroSender(c),
    READ_OPTS(c.api),
    start,
    limit,
  );
  if (!result.isOk) throw new Error("listPolls: query failed");
  const arr = (output?.toJSON() ?? []) as RawPoll[];
  return arr.map(decodePoll);
}

export async function getPoll(id: number): Promise<Poll | undefined> {
  if (!isPollsWired) throw new ChainNotWiredError();
  const c = await getPolls();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.getPoll(zeroSender(c), READ_OPTS(c.api), id);
  if (!result.isOk) return undefined;
  const json = output?.toJSON() as RawPoll | null;
  return json ? decodePoll(json) : undefined;
}

export async function getMyVote(
  pollId: number,
  who: string,
): Promise<number | undefined> {
  if (!isPollsWired) throw new ChainNotWiredError();
  const c = await getPolls();
  if (!c) throw new ChainNotWiredError();
  const { result, output } = await c.query.getMyVote(
    zeroSender(c),
    READ_OPTS(c.api),
    pollId,
    who,
  );
  if (!result.isOk) return undefined;
  const v = output?.toJSON();
  if (v == null) return undefined;
  return asNumber(v);
}

/* --- writes --- */

export async function txCreatePoll(
  question: string,
  options: string[],
  endTime: number,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPolls();
  if (!c) throw new ChainNotWiredError();
  return c.tx.createPoll(WRITE_OPTS(c.api), question, options, endTime);
}

export async function txVote(
  pollId: number,
  optionIndex: number,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPolls();
  if (!c) throw new ChainNotWiredError();
  return c.tx.vote(WRITE_OPTS(c.api), pollId, optionIndex);
}

export async function txClosePoll(
  pollId: number,
): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
  const c = await getPolls();
  if (!c) throw new ChainNotWiredError();
  return c.tx.close(WRITE_OPTS(c.api), pollId);
}

/* ------------------------------- reputation ------------------------------ */

export async function getReputationStats(who: string): Promise<ReputationStats> {
  if (!isChainWired) throw new ChainNotWiredError();
  const c = await getReputation();
  if (!c) throw new ChainNotWiredError();
  const [statsRes, scoreRes, accRes] = await Promise.all([
    c.query.statsOf(zeroSender(c), READ_OPTS(c.api), who),
    c.query.scoreOf(zeroSender(c), READ_OPTS(c.api), who),
    c.query.accuracyBps(zeroSender(c), READ_OPTS(c.api), who),
  ]);
  const raw = (statsRes.output?.toJSON() ?? {}) as Record<string, unknown>;
  return {
    totalPredictions: asNumber(raw.totalPredictions),
    correctPredictions: asNumber(raw.correctPredictions),
    totalStaked: asBigInt(raw.totalStaked),
    totalWon: asBigInt(raw.totalWon),
    currentStreak: asNumber(raw.currentStreak),
    bestStreak: asNumber(raw.bestStreak),
    lastActive: asNumber(raw.lastActive),
    score: asNumber(scoreRes.output?.toJSON()),
    accuracyBps: asNumber(accRes.output?.toJSON()),
  };
}

/* --------------------------------- utils --------------------------------- */

function zeroSender(c: ContractPromise): string {
  // For read-only queries we just need a valid address shape. Use the contract's
  // own address — it never signs anything.
  return c.address.toString();
}

export const _unused_BN = BN; // re-exported only to anchor types in the dependency graph
