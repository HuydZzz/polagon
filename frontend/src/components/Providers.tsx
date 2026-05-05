"use client";

import { WalletProvider } from "@/lib/wallet";
import { NotifyProvider } from "@/lib/notify";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NotifyProvider>
      <WalletProvider>{children}</WalletProvider>
    </NotifyProvider>
  );
}
