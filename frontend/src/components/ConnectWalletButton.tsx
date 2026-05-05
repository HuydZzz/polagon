"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { shortAddr } from "@/lib/format";

export function ConnectWalletButton() {
  const { active, accounts, isConnecting, connect, disconnect, setActive, error } =
    useWallet();
  const [open, setOpen] = useState(false);

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => void connect()}
        className="btn-primary"
        disabled={isConnecting}
        title={error}
      >
        {isConnecting ? "Connecting…" : "Connect wallet"}
      </button>
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
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-bg-elev shadow-card"
          onMouseLeave={() => setOpen(false)}
        >
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
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="block w-full border-t border-border px-3 py-2 text-left text-xs text-danger hover:bg-bg-card"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
