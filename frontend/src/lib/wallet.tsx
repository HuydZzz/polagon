"use client";

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

const DEMO_ACCOUNT: InjectedAccountWithMeta = {
  address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  meta: { name: "Demo User", source: "demo" },
  type: "sr25519",
};

const STORAGE_KEY = "polagon:active-account";
const DEMO_KEY = "polagon:demo-mode";

interface WalletState {
  isReady: boolean;
  isConnecting: boolean;
  accounts: InjectedAccountWithMeta[];
  active: InjectedAccountWithMeta | undefined;
  signer: Signer | undefined;
  isDemoMode: boolean;
  error: string | undefined;
}

interface WalletApi extends WalletState {
  connect: () => Promise<void>;
  connectDemo: () => void;
  disconnect: () => void;
  setActive: (address: string) => void;
}

const initialState: WalletState = {
  isReady: false,
  isConnecting: false,
  accounts: [],
  active: undefined,
  signer: undefined,
  isDemoMode: false,
  error: undefined,
};

const WalletContext = createContext<WalletApi | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);

  const connectDemo = useCallback(() => {
    setState({
      isReady: true,
      isConnecting: false,
      accounts: [DEMO_ACCOUNT],
      active: DEMO_ACCOUNT,
      signer: undefined,
      isDemoMode: true,
      error: undefined,
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_KEY, "1");
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

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

      // Clear demo mode when a real wallet connects
      window.localStorage.removeItem(DEMO_KEY);

      setState({
        isReady: true,
        isConnecting: false,
        accounts,
        active,
        signer: injector.signer,
        isDemoMode: false,
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
      /* no-op */
    }
  }, []);

  const disconnect = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(DEMO_KEY);
    }
    setState(initialState);
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DEMO_KEY)) {
      connectDemo();
      return;
    }
    const had = window.localStorage.getItem(STORAGE_KEY);
    if (had) void connect();
  }, [connect, connectDemo]);

  const api = useMemo<WalletApi>(
    () => ({ ...state, connect, connectDemo, disconnect, setActive }),
    [state, connect, connectDemo, disconnect, setActive],
  );

  return (
    <WalletContext.Provider value={api}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletApi {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
