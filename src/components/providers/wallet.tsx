"use client";

import * as React from "react";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import {
  rainbowWallet,
  metaMaskWallet,
  coinbaseWallet,
  coreWallet,
  ledgerWallet,
  trustWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { WagmiProvider, http } from "wagmi";

import { env } from "@/env";
import { siteConfig } from "@/lib/site";

/**
 * A wallet is an optional credential in Telescope — you link one to receive
 * bounty payouts and claim rewards, you do not sign in with it.
 *
 * The config is built once at module scope with `ssr: true` so pages render on
 * the server. An earlier version created it in an effect and returned null
 * until it resolved, which left every page — the forum included — blank to
 * crawlers and slow to first paint.
 */
const config = getDefaultConfig({
  appName: siteConfig.name,
  projectId: env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "telescope",
  wallets: [
    { groupName: "Most used", wallets: [coreWallet, metaMaskWallet, rainbowWallet] },
    { groupName: "Other", wallets: [coinbaseWallet, trustWallet, ledgerWallet] },
  ],
  chains: [avalanche, avalancheFuji],
  transports: {
    [avalanche.id]: http("https://avalanche-c-chain-rpc.publicnode.com"),
    [avalancheFuji.id]: http("https://avalanche-fuji-c-chain-rpc.publicnode.com"),
  },
  ssr: true,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider modalSize="compact" theme={darkTheme()}>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
