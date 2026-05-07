/**
 * Mock seed data — used until contracts are deployed (`isChainWired === false`).
 * Hooks in `hooks.ts` swap to live data automatically once env addresses are set.
 */

import { pot } from "./format";
import type { Market } from "./types";

const now = Date.now();
const day = 86_400_000;

export const MOCK_MARKETS: Market[] = [
  {
    id: 0,
    question: "Will BTC close above $200,000 on December 31, 2026?",
    category: "Crypto",
    creator: "5GrwvaEF…ax8u",
    resolver: "5GrwvaEF…ax8u",
    endTime: now + 60 * day,
    totalYes: pot(1_240),
    totalNo: pot(820),
    status: "Open",
    createdAt: now - 3 * day,
  },
  {
    id: 1,
    question: "Will Portaldot mainnet launch before Q4 2026?",
    category: "Portaldot",
    creator: "5FHneW46…wbv2",
    resolver: "5FHneW46…wbv2",
    endTime: now + 120 * day,
    totalYes: pot(2_400),
    totalNo: pot(180),
    status: "Open",
    createdAt: now - 1 * day,
  },
  {
    id: 2,
    question: "Will the next US Fed decision cut rates by 50bps or more?",
    category: "Macro",
    creator: "5DAAnrj7…6gj9",
    resolver: "5DAAnrj7…6gj9",
    endTime: now + 14 * day,
    totalYes: pot(120),
    totalNo: pot(440),
    status: "Open",
    createdAt: now - 5 * day,
  },
  {
    id: 3,
    question: "Will at least 10 dApps be deployed on Portaldot by end of 2026?",
    category: "Portaldot",
    creator: "5HGjWAeF…d8gQ",
    resolver: "5HGjWAeF…d8gQ",
    endTime: now + 200 * day,
    totalYes: pot(560),
    totalNo: pot(140),
    status: "Open",
    createdAt: now - 10 * day,
  },
  {
    id: 4,
    question: "Will the Lakers make the 2026 NBA Finals?",
    category: "Sports",
    creator: "5CiPPseX…wKj1",
    resolver: "5CiPPseX…wKj1",
    endTime: now - 2 * day,
    totalYes: pot(80),
    totalNo: pot(220),
    status: "Resolved",
    outcome: false,
    createdAt: now - 60 * day,
  },
  {
    id: 5,
    question: "Will OpenAI release a new flagship model before Demo Day (May 31)?",
    category: "AI",
    creator: "5HpG9w8E…GZkr",
    resolver: "5HpG9w8E…GZkr",
    endTime: now + 27 * day,
    totalYes: pot(360),
    totalNo: pot(420),
    status: "Open",
    createdAt: now - 1 * day,
  },
  {
    id: 6,
    question: "Will Trump sign a Bitcoin strategic reserve executive order in 2026?",
    category: "Politics",
    creator: "5F3sa2TJ…3Fxk",
    resolver: "5F3sa2TJ…3Fxk",
    endTime: now + 90 * day,
    totalYes: pot(890),
    totalNo: pot(310),
    status: "Open",
    createdAt: now - 2 * day,
  },
  {
    id: 7,
    question: "Will Apple ship a standalone AI hardware device (not iPhone/Mac) before end of 2026?",
    category: "Tech",
    creator: "5EnkJx2D…8mXp",
    resolver: "5EnkJx2D…8mXp",
    endTime: now + 180 * day,
    totalYes: pot(210),
    totalNo: pot(780),
    status: "Open",
    createdAt: now - 4 * day,
  },
  {
    id: 8,
    question: "Will ETH hit $10,000 before the end of 2026?",
    category: "Crypto",
    creator: "5CFXsTk2…9pLq",
    resolver: "5CFXsTk2…9pLq",
    endTime: now + 45 * day,
    totalYes: pot(680),
    totalNo: pot(520),
    status: "Open",
    createdAt: now - 6 * day,
  },
  {
    id: 9,
    question: "Will Polkadot JAM upgrade launch on mainnet before Q3 2026?",
    category: "Portaldot",
    creator: "5Grp7MwE…vDhL",
    resolver: "5Grp7MwE…vDhL",
    endTime: now - 5 * day,
    totalYes: pot(940),
    totalNo: pot(160),
    status: "Resolved",
    outcome: true,
    createdAt: now - 30 * day,
  },
];

// Markets created during this browser session (demo/mock mode only)
export const EXTRA_MOCK_MARKETS: Market[] = [];
let _nextId = 100;

export function addMockMarket(
  question: string,
  endTime: number,
  creator: string,
  resolver: string,
): Market {
  const market: Market = {
    id: _nextId++,
    question,
    category: inferCategory(question),
    creator: creator.slice(0, 6) + "…" + creator.slice(-4),
    resolver: resolver.slice(0, 6) + "…" + resolver.slice(-4),
    endTime,
    totalYes: 0n,
    totalNo: 0n,
    status: "Open",
    createdAt: Date.now(),
  };
  EXTRA_MOCK_MARKETS.unshift(market); // newest first
  return market;
}

export function inferCategory(question: string): string {
  const s = question.toLowerCase();
  if (/btc|bitcoin|eth|ethereum|crypto|sol|token|defi|nft/.test(s)) return "Crypto";
  if (/portaldot|polkadot|ink!|substrate|\bdot\b|parachain|jam/.test(s)) return "Portaldot";
  if (/openai|gpt|llm|anthropic|gemini|\bai\b|artificial|claude/.test(s)) return "AI";
  if (/trump|biden|election|president|senate|congress|parliament|vote/.test(s)) return "Politics";
  if (/\bfed\b|interest rate|inflation|gdp|recession|economy/.test(s)) return "Macro";
  if (/apple|google|microsoft|meta|amazon|tesla|nvidia|tech/.test(s)) return "Tech";
  if (/nba|nfl|mlb|soccer|football|basketball|sports|champion|cup|finals/.test(s)) return "Sports";
  return "General";
}
