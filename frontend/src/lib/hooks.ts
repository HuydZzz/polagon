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
  getPosition,
  getReputationStats,
  listMarkets,
} from "./contracts";
import { isChainWired } from "./env";
import { MOCK_MARKETS } from "./markets-mock";
import type { Market, ReputationStats, UserPosition } from "./types";

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
      data: fromMockSafe(() => MOCK_MARKETS),
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
      data: id != null ? MOCK_MARKETS.find((m) => m.id === id) : undefined,
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
