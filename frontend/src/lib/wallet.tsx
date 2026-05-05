"use client";

/**
 * WalletProvider — connects to the polkadot-js (or compatible) browser extension
 * and exposes the active account + a signer to React.
 *
 * Note: extension APIs only exist in the browser. Every entry point here is
 * gated by a `typeof window` check; the file is safe to import from server
 * components but does nothing useful there.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { Signer } from "@polkadot/types/types";

interface WalletState {
  isReady: boolean;
  isConnecting: boolean;
  accounts: InjectedAccountWithMeta[];
  active: InjectedAccountWithMeta | undefined;
  signer: Signer | undefined;
  error: string | undefined;
}

interface WalletApi extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  setActive: (address: string) => void;
}

const initialState: WalletState = {
  isReady: false,
  isConnecting: false,
  accounts: [],
  active: undefined,
  signer: undefined,
  error: undefined,
};

const WalletContext = createContext<WalletApi | null>(null);

const STORAGE_KEY = "polagon:active-account";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    setState((s) => ({ ...s, isConnecting: true, error: undefined }));
    try {
      const { web3Enable, web3Accounts, web3FromAddress } = await import(
        "@polkadot/extension-dapp"
      );
      const enabled = await web3Enable("Polagon");
      if (!enabled.length) {
        throw new Error(
          "No wallet extension detected. Install polkadot-js or Talisman.",
        );
      }
      const accounts = await web3Accounts();
      if (!accounts.length) {
        throw new Error("No accounts found in your wallet.");
      }
      const remembered = window.localStorage.getItem(STORAGE_KEY);
      const active =
        accounts.find((a) => a.address === remembered) ?? accounts[0];
      const injector = await web3FromAddress(active.address);

      setState({
        isReady: true,
        isConnecting: false,
        accounts,
        active,
        signer: injector.signer,
        error: undefined,
      });
      window.localStorage.setItem(STORAGE_KEY, active.address);
    } catch (e) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: e instanceof Error ? e.message : String(e),
      }));
    }
  }, []);

  const setActive = useCallback(async (address: string) => {
    if (typeof window === "undefined") return;
    setState((prev) => {
      const a = prev.accounts.find((x) => x.address === address);
      if (!a) return prev;
      window.localStorage.setItem(STORAGE_KEY, address);
      return { ...prev, active: a };
    });
    try {
      const { web3FromAddress } = await import("@polkadot/extension-dapp");
      const injector = await web3FromAddress(address);
      setState((p) => ({ ...p, signer: injector.signer }));
    } catch {
      /* no-op: user may switch back to a previously authorized account */
    }
  }, []);

  const disconnect = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setState(initialState);
  }, []);

  // Auto-reconnect on mount if a previous session is remembered.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const had = window.localStorage.getItem(STORAGE_KEY);
    if (had) void connect();
  }, [connect]);

  const api = useMemo<WalletApi>(
    () => ({ ...state, connect, disconnect, setActive }),
    [state, connect, disconnect, setActive],
  );

  return (
    <WalletContext.Provider value={api}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletApi {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside <WalletProvider>");
  }
  return ctx;
}
