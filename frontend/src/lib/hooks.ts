"use client";

/**
 * SWR-backed data hooks. Each hook tries the chain via `contracts.ts`;
 * on `ChainNotWiredError` it falls back to the mock data in `markets-mock.ts`,
 * keeping the UI navigable for new contributors.
 */

import useSWR from "swr";
import {
  ChainNotWiredError,
  getMarket,
  getMarketCount,
  getMyVote,
  getPoll,
  getPollCount,
  getPosition,
  getReputationStats,
  listMarkets,
  listPolls,
} from "./contracts";
import { isChainWired, isPollsWired } from "./env";
import { EXTRA_MOCK_MARKETS, MOCK_MARKETS } from "./markets-mock";
import { EXTRA_MOCK_POLLS, MOCK_POLLS } from "./polls-mock";
import type { Market, Poll, ReputationStats, UserPosition } from "./types";

const REFRESH_MS = 12_000;

interface ChainAware<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  fromMock: boolean;
  refresh: () => void;
}

function fromMockSafe<T>(fn: () => T): T {
  return fn();
}

export function useMarkets(): ChainAware<Market[]> {
  const swr = useSWR<Market[]>(
    "polagon:markets",
    async () => {
      if (!isChainWired) throw new ChainNotWiredError();
      const count = await getMarketCount();
      return listMarkets(0, Math.max(count, 1));
    },
    { refreshInterval: REFRESH_MS },
  );

  if (swr.error instanceof ChainNotWiredError || (swr.error && !isChainWired)) {
    return {
      data: fromMockSafe(() => [...EXTRA_MOCK_MARKETS, ...MOCK_MARKETS]),
      isLoading: false,
      error: undefined,
      fromMock: true,
      refresh: () => void swr.mutate(),
    };
  }
  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    fromMock: false,
    refresh: () => void swr.mutate(),
  };
}

export function useMarket(id: number | undefined): ChainAware<Market> {
  const key = id != null ? ["polagon:market", id] : null;
  const swr = useSWR(
    key,
    async () => {
      if (id == null) return undefined;
      if (!isChainWired) throw new ChainNotWiredError();
      return getMarket(id);
    },
    { refreshInterval: REFRESH_MS },
  );

  if (swr.error instanceof ChainNotWiredError || (swr.error && !isChainWired)) {
    return {
      data: id != null
        ? [...EXTRA_MOCK_MARKETS, ...MOCK_MARKETS].find((m) => m.id === id)
        : undefined,
      isLoading: false,
      error: undefined,
      fromMock: true,
      refresh: () => void swr.mutate(),
    };
  }
  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    fromMock: false,
    refresh: () => void swr.mutate(),
  };
}

export function usePosition(
  marketId: number | undefined,
  who: string | undefined,
): ChainAware<UserPosition> {
  const key = marketId != null && who ? ["polagon:position", marketId, who] : null;
  const swr = useSWR(
    key,
    async () => {
      if (marketId == null || !who) return { yes: 0n, no: 0n };
      if (!isChainWired) throw new ChainNotWiredError();
      return getPosition(marketId, who);
    },
    { refreshInterval: REFRESH_MS },
  );

  if (swr.error instanceof ChainNotWiredError || (swr.error && !isChainWired)) {
    return {
      data: { yes: 0n, no: 0n },
      isLoading: false,
      error: undefined,
      fromMock: true,
      refresh: () => void swr.mutate(),
    };
  }
  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    fromMock: false,
    refresh: () => void swr.mutate(),
  };
}

/* --------------------------------- polls --------------------------------- */

export function usePolls(): ChainAware<Poll[]> {
  const swr = useSWR<Poll[]>(
    "polagon:polls",
    async () => {
      if (!isPollsWired) throw new ChainNotWiredError();
      const count = await getPollCount();
      return listPolls(0, Math.max(count, 1));
    },
    { refreshInterval: REFRESH_MS },
  );
  if (swr.error instanceof ChainNotWiredError || (swr.error && !isPollsWired)) {
    return {
      data: [...EXTRA_MOCK_POLLS, ...MOCK_POLLS],
      isLoading: false,
      error: undefined,
      fromMock: true,
      refresh: () => void swr.mutate(),
    };
  }
  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    fromMock: false,
    refresh: () => void swr.mutate(),
  };
}

export function usePoll(id: number | undefined): ChainAware<Poll> {
  const key = id != null ? ["polagon:poll", id] : null;
  const swr = useSWR(
    key,
    async () => {
      if (id == null) return undefined;
      if (!isPollsWired) throw new ChainNotWiredError();
      return getPoll(id);
    },
    { refreshInterval: REFRESH_MS },
  );
  if (swr.error instanceof ChainNotWiredError || (swr.error && !isPollsWired)) {
    return {
      data: id != null
        ? [...EXTRA_MOCK_POLLS, ...MOCK_POLLS].find((p) => p.id === id)
        : undefined,
      isLoading: false,
      error: undefined,
      fromMock: true,
      refresh: () => void swr.mutate(),
    };
  }
  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    fromMock: false,
    refresh: () => void swr.mutate(),
  };
}

export function useMyVote(
  pollId: number | undefined,
  who: string | undefined,
): ChainAware<number | undefined> {
  const key = pollId != null && who ? ["polagon:my-vote", pollId, who] : null;
  const swr = useSWR(
    key,
    async () => {
      if (pollId == null || !who) return undefined;
      if (!isPollsWired) throw new ChainNotWiredError();
      return getMyVote(pollId, who);
    },
    { refreshInterval: REFRESH_MS },
  );
  if (swr.error instanceof ChainNotWiredError || (swr.error && !isPollsWired)) {
    return {
      data: undefined,
      isLoading: false,
      error: undefined,
      fromMock: true,
      refresh: () => void swr.mutate(),
    };
  }
  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    fromMock: false,
    refresh: () => void swr.mutate(),
  };
}

/* ------------------------------- reputation ------------------------------ */

export function useReputation(who: string | undefined): ChainAware<ReputationStats> {
  const key = who ? ["polagon:reputation", who] : null;
  const swr = useSWR(
    key,
    async () => {
      if (!who) return undefined;
      if (!isChainWired) throw new ChainNotWiredError();
      return getReputationStats(who);
    },
    { refreshInterval: REFRESH_MS },
  );

  if (swr.error instanceof ChainNotWiredError || (swr.error && !isChainWired)) {
    return {
      data: {
        totalPredictions: 0,
        correctPredictions: 0,
        totalStaked: 0n,
        totalWon: 0n,
        currentStreak: 0,
        bestStreak: 0,
        lastActive: 0,
        score: 0,
        accuracyBps: 0,
      },
      isLoading: false,
      error: undefined,
      fromMock: true,
      refresh: () => void swr.mutate(),
    };
  }
  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    fromMock: false,
    refresh: () => void swr.mutate(),
  };
}
