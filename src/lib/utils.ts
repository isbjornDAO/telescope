import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Address } from "viem";
import { ItemMetadata } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: Address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

export function isItemMetadata(metadata: unknown): metadata is ItemMetadata {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return false;
  }

  const meta = metadata as Record<string, unknown>;

  return (
    typeof meta.votes === "number" &&
    typeof meta.voters === "number"
  );
}


export const getTextColorClass = (rank: number) => {
  return rank === 1 || rank === 2 || rank === 3
    ? "text-zinc-700 dark:text-zinc-200"
    : "text-zinc-400 dark:text-zinc-500";
};
