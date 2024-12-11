import { ItemMetadata } from "@/types";

export function isItemMetadata(metadata: unknown): metadata is ItemMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    !Array.isArray(metadata) &&
    'votes' in metadata &&
    'voters' in metadata &&
    typeof (metadata as any).votes === 'number' &&
    typeof (metadata as any).voters === 'number'
  );
} 