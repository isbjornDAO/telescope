"use client";

import { SessionProvider } from "next-auth/react";
import { Web3Provider } from "./web3";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Web3Provider>{children}</Web3Provider>
    </SessionProvider>
  );
}
