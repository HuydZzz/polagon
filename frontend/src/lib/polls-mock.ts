import type { Poll } from "./types";

const now = Date.now();
const day = 86_400_000;

export const MOCK_POLLS: Poll[] = [
  {
    id: 0,
    question: "What should we build next on Polagon?",
    options: ["Lending protocol", "Yield aggregator", "Stablecoin", "Cross-chain bridge"],
    creator: "5GrwvaEF…ax8u",
    endTime: now + 5 * day,
    votesPerOption: [42, 18, 31, 7],
    totalVoters: 98,
    status: "Open",
    createdAt: now - 1 * day,
    category: "Governance",
  },
  {
    id: 1,
    question: "Should the protocol fee stay at 2%?",
    options: ["Keep 2%", "Lower to 1%", "Raise to 3%"],
    creator: "5FHneW46…wbv2",
    endTime: now + 3 * day,
    votesPerOption: [120, 45, 8],
    totalVoters: 173,
    status: "Open",
    createdAt: now - 2 * day,
    category: "Protocol",
  },
  {
    id: 2,
    question: "Which Polagon Score formula change do you prefer for v2?",
    options: ["Brier-weighted accuracy", "Time-decayed score", "Status quo"],
    creator: "5DAAnrj7…6gj9",
    endTime: now + 10 * day,
    votesPerOption: [78, 22, 11],
    totalVoters: 111,
    status: "Open",
    createdAt: now - 4 * day,
    category: "Reputation",
  },
  {
    id: 3,
    question: "Pick the next category for featured markets.",
    options: ["AI", "Climate", "Sports", "Politics", "Finance"],
    creator: "5HpG9w8E…GZkr",
    endTime: now - 1 * day,
    votesPerOption: [54, 12, 38, 19, 27],
    totalVoters: 150,
    status: "Closed",
    createdAt: now - 14 * day,
    category: "Curation",
  },
];
