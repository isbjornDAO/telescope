"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";

export class WorldApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function worldFetch<T = unknown>(
  url: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> }
): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new WorldApiError((data as { error?: string }).error || `Request failed (${res.status})`, res.status);
  return data as T;
}

export function useWorldQuery<T>(key: unknown[], url: string | null, options?: Partial<UseQueryOptions<T>>) {
  return useQuery<T>({
    queryKey: ["world", ...key],
    queryFn: () => worldFetch<T>(url as string),
    enabled: !!url && (options?.enabled ?? true),
    staleTime: 10_000,
    ...options,
  });
}

export interface WorldMe {
  signedIn: boolean;
  address?: string;
  handle?: string | null;
  name?: string;
  nodeType?: "NODE" | "ANCHOR" | "ELDER";
  trustScore?: number;
  standing?: number;
  faction?: { name: string; slug: string } | null;
  region?: { name: string; slug: string } | null;
  isAdmin?: boolean;
  isElder?: boolean;
  scoutBudget?: { remaining: number; dailyRemaining: number; perSeason: number; used: number; extra: number };
  pendingOffers?: number;
  pendingReviews?: number;
  seasonNumber?: number | null;
}

/** One signature proves the wallet and nothing else. Session lives in an httpOnly cookie. */
export function useWorldSession() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();

  const me = useQuery<WorldMe>({
    queryKey: ["world", "me"],
    queryFn: () => worldFetch<WorldMe>("/api/world/auth/me"),
    staleTime: 15_000,
  });

  const signedInAs = me.data?.signedIn ? me.data.address ?? null : null;
  const mismatch = !!signedInAs && !!address && signedInAs.toLowerCase() !== address.toLowerCase();

  const signIn = useMutation({
    mutationFn: async () => {
      if (!address) throw new WorldApiError("Connect a wallet first.", 400);
      const { message } = await worldFetch<{ message: string }>(`/api/world/auth/nonce?address=${address}`);
      const signature = await signMessageAsync({ message });
      await worldFetch("/api/world/auth/verify", { method: "POST", body: { address, message, signature } });
      await qc.invalidateQueries({ queryKey: ["world"] });
    },
  });

  const signOut = useMutation({
    mutationFn: async () => {
      await worldFetch("/api/world/auth/signout", { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["world"] });
    },
  });

  return {
    me: me.data,
    isLoading: me.isLoading,
    isConnected,
    address,
    isSignedIn: !!me.data?.signedIn && !mismatch,
    mismatch,
    signIn,
    signOut,
    refresh: () => qc.invalidateQueries({ queryKey: ["world"] }),
  };
}

export function useWorldMutation<TIn, TOut = unknown>(fn: (input: TIn) => Promise<TOut>, invalidate: unknown[][] = [["world"]]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      for (const key of invalidate) await qc.invalidateQueries({ queryKey: key });
    },
  });
}
