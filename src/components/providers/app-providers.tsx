"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WalletProvider } from "@/components/providers/wallet";

/**
 * One QueryClient per browser session. Created lazily in state so a re-render
 * never throws away the cache, and so each server request gets its own.
 */
function useQueryClient() {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );
  return client;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>{children}</WalletProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
