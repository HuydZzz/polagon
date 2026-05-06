import { pot } from "./format";

export interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  accuracyBps: number;
  totalPredictions: number;
  correctPredictions: number;
  totalWonPot: bigint;
  currentStreak: number;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    score: 9_840,
    accuracyBps: 8300,
    totalPredictions: 52,
    correctPredictions: 43,
    totalWonPot: pot(4_820),
    currentStreak: 7,
  },
  {
    rank: 2,
    address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
    score: 7_120,
    accuracyBps: 7600,
    totalPredictions: 41,
    correctPredictions: 31,
    totalWonPot: pot(3_100),
    currentStreak: 4,
  },
  {
    rank: 3,
    address: "5DAAnrj7yqkTmcJsEfaJEoU6pYSnAXe2qJBkxFhRjjFaxErD",
    score: 6_450,
    accuracyBps: 7100,
    totalPredictions: 38,
    correctPredictions: 27,
    totalWonPot: pot(2_650),
    currentStreak: 3,
  },
  {
    rank: 4,
    address: "5HGjWAeFDfA9dn1gFkANhKVHwk9hkFJfj9sNUCZ3WEqBB1U",
    score: 5_210,
    accuracyBps: 6800,
    totalPredictions: 30,
    correctPredictions: 20,
    totalWonPot: pot(1_980),
    currentStreak: 2,
  },
  {
    rank: 5,
    address: "5CiPPseXFQRzNFt2sdWv5WBKVvBZEtFEp41smpNUGXC8JMTL",
    score: 4_880,
    accuracyBps: 6500,
    totalPredictions: 27,
    correctPredictions: 17,
    totalWonPot: pot(1_740),
    currentStreak: 0,
  },
  {
    rank: 6,
    address: "5HpG9w8EpBmRVjGVpPUfH3JK3E2j1Zzxm4TWGMkP8nFGZkr",
    score: 4_020,
    accuracyBps: 6200,
    totalPredictions: 24,
    correctPredictions: 15,
    totalWonPot: pot(1_320),
    currentStreak: 1,
  },
  {
    rank: 7,
    address: "5F3sa2TJAqmTKGNWbPBuSHKrP7JXYbzLbvwnVpGMdYaymv1N",
    score: 3_460,
    accuracyBps: 6000,
    totalPredictions: 20,
    correctPredictions: 12,
    totalWonPot: pot(1_080),
    currentStreak: 2,
  },
  {
    rank: 8,
    address: "5EnkJx2DwzbKvKCibbAbwVLm4b7xcVQhX8n1dA7hTCp8mXpL",
    score: 2_750,
    accuracyBps: 5700,
    totalPredictions: 16,
    correctPredictions: 9,
    totalWonPot: pot(820),
    currentStreak: 0,
  },
  {
    rank: 9,
    address: "5CFXsTk2mTHs5K2QxMmTLqzC6fJDpB4XtdYLgVzLuJ9pLqBT",
    score: 2_100,
    accuracyBps: 5500,
    totalPredictions: 12,
    correctPredictions: 6,
    totalWonPot: pot(580),
    currentStreak: 1,
  },
  {
    rank: 10,
    address: "5Grp7MwEH6H6JgtVTf5M7G2aZAuemvAqWMvY2JnvDhLCDpQq",
    score: 1_640,
    accuracyBps: 5000,
    totalPredictions: 10,
    correctPredictions: 5,
    totalWonPot: pot(390),
    currentStreak: 0,
  },
];
