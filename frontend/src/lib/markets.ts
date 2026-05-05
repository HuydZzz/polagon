/**
 * Polagon — domain types + mock data.
 *
 * On D9 of the roadmap, the mock arrays here are replaced by live calls to the
 * `prediction_market` contract via `@polkadot/api-contract`. The component layer
 * is built against this typed surface so the swap is mechanical.
 */

export type MarketStatus = "Open" | "Resolved" | "Cancelled";

export interface Market {
  id: number;
  question: string;
  category: string;
  creator: string; // SS58 address
  resolver: string;
  endTime: number; // ms epoch
  totalYes: bigint; // POT base units
  totalNo: bigint;
  status: MarketStatus;
  outcome?: boolean;
  createdAt: number;
}

export interface UserPosition {
  yes: bigint;
  no: bigint;
}

const ONE_POT = 1_000_000_000_000n;

export function pot(n: number): bigint {
  return BigInt(Math.round(n * 1e6)) * (ONE_POT / 1_000_000n);
}

export function fmtPot(v: bigint, decimals = 2): string {
  const whole = v / ONE_POT;
  const frac = v % ONE_POT;
  const fracStr = (Number(frac) / Number(ONE_POT))
    .toFixed(decimals)
    .slice(2);
  return `${whole.toLocaleString()}${fracStr ? "." + fracStr : ""}`;
}

export function impliedOdds(yes: bigint, no: bigint): { yes: number; no: number } {
  const total = yes + no;
  if (total === 0n) return { yes: 50, no: 50 };
  const y = Number((yes * 10000n) / total) / 100;
  return { yes: y, no: 100 - y };
}

// ---------- Mock seed (replaced on D10) ----------

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
];

export function getMarket(id: number): Market | undefined {
  return MOCK_MARKETS.find((m) => m.id === id);
}

export function listMarkets(filter?: MarketStatus): Market[] {
  if (!filter) return MOCK_MARKETS;
  return MOCK_MARKETS.filter((m) => m.status === filter);
}
