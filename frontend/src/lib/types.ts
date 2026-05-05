/**
 * Domain types — shared by mock data, contract reads, and component props.
 *
 * The contract layer (`contracts.ts`) decodes raw `Codec` values into these
 * shapes, so components don't depend on `@polkadot/types` directly.
 */

export type MarketStatus = "Open" | "Resolved" | "Cancelled";

export interface Market {
  id: number;
  question: string;
  category: string; // not stored on-chain; derived from question keywords for now
  creator: string;
  resolver: string;
  endTime: number; // ms epoch
  totalYes: bigint;
  totalNo: bigint;
  status: MarketStatus;
  outcome?: boolean;
  createdAt: number;
}

export interface UserPosition {
  yes: bigint;
  no: bigint;
}

export interface ReputationStats {
  totalPredictions: number;
  correctPredictions: number;
  totalStaked: bigint;
  totalWon: bigint;
  currentStreak: number;
  bestStreak: number;
  lastActive: number;
  score: number;
  accuracyBps: number;
}

export type PollStatus = "Open" | "Closed";

export interface Poll {
  id: number;
  question: string;
  options: string[];
  creator: string;
  endTime: number;
  votesPerOption: number[];
  totalVoters: number;
  status: PollStatus;
  createdAt: number;
  category: string;
}
