"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { shortAddr } from "@/lib/format";

export function ConnectWalletButton() {
  const {
    active,
    accounts,
    isConnecting,
    isDemoMode,
    connect,
    connectDemo,
    disconnect,
    setActive,
    error,
  } = useWallet();
  const [open, setOpen] = useState(false);

  if (!active) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void connect()}
          className="btn-primary"
          disabled={isConnecting}
          title={error}
        >
          {isConnecting ? "Connecting…" : "Connect wallet"}
        </button>
        <button
          type="button"
          onClick={connectDemo}
          className="btn-ghost hidden text-xs sm:inline-flex"
          title="Explore the app with a demo account (no extension needed)"
        >
          Try demo
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost"
      >
        <span className="h-2 w-2 rounded-full bg-success" />
        <span className="font-mono text-xs">{shortAddr(active.address)}</span>
        {isDemoMode && (
          <span className="rounded-sm bg-accent/20 px-1 py-0.5 font-sans text-[10px] text-accent">
            demo
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-bg-elev shadow-card"
          onMouseLeave={() => setOpen(false)}
        >
          {isDemoMode ? (
            <>
              <div className="border-b border-border px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-text-dim">
                  Demo mode
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  Connect a real wallet (polkadot-js or Talisman) to sign
                  on-chain transactions.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  void connect();
                  setOpen(false);
                }}
                className="block w-full border-b border-border px-3 py-2 text-left text-xs text-text hover:bg-bg-card"
              >
                Connect real wallet →
              </button>
            </>
          ) : (
            <>
              <div className="border-b border-border px-3 py-2 text-[10px] uppercase tracking-wider text-text-dim">
                Accounts
              </div>
              {accounts.map((a) => (
                <button
                  key={a.address}
                  type="button"
                  onClick={() => {
                    setActive(a.address);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-bg-card ${
                    a.address === active.address ? "text-text" : "text-text-muted"
                  }`}
                >
                  <span className="truncate">{a.meta.name ?? "Account"}</span>
                  <span className="font-mono text-xs text-text-dim">
                    {shortAddr(a.address)}
                  </span>
                </button>
              ))}
            </>
          )}
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="block w-full border-t border-border px-3 py-2 text-left text-xs text-danger hover:bg-bg-card"
          >
            {isDemoMode ? "Exit demo" : "Disconnect"}
          </button>
        </div>
      )}
    </div>
  );
}
