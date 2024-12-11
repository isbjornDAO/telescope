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
