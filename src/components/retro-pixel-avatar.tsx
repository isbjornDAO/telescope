"use client";

import React from "react";
import { User } from "lucide-react";

export interface RetroPixelAvatarProps {
  seed?: string;
  avatarUrl?: string | null;
  /** @deprecated Post image attachment, not used as avatar */
  imageHash?: string | null;
  className?: string;
  size?: number;
  alt?: string;
  pixelArtFallback?: boolean;
}

/**
 * Returns a simple 32-bit integer hash from a string seed.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * 8 Authentic retro pixel-art avatar heads (16x16 pixel grid).
 */
function renderAvatarHead(index: number) {
  switch (index) {
    // 0: Blonde Spiky Hair with 3D Glasses
    case 0:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Hair: Spiky Blonde */}
          <rect x="4" y="1" width="8" height="2" fill="#FACC15" />
          <rect x="3" y="2" width="2" height="2" fill="#EAB308" />
          <rect x="7" y="0" width="3" height="2" fill="#FDE047" />
          <rect x="11" y="2" width="2" height="3" fill="#CA8A04" />
          {/* Head base */}
          <rect x="4" y="3" width="8" height="8" fill="#FBD38D" />
          <rect x="3" y="5" width="1" height="3" fill="#E2A76F" />
          <rect x="12" y="5" width="1" height="3" fill="#E2A76F" />
          {/* 3D Glasses Frame */}
          <rect x="3" y="6" width="10" height="3" fill="#18181B" />
          {/* 3D Glasses Lenses: Cyan left, Red right */}
          <rect x="4" y="7" width="3" height="2" fill="#00E5FF" />
          <rect x="9" y="7" width="3" height="2" fill="#FF1744" />
          {/* Smile */}
          <rect x="7" y="10" width="2" height="1" fill="#9C4221" />
          {/* Shirt: White collar */}
          <rect x="3" y="12" width="10" height="4" fill="#FFFFFF" />
          <rect x="7" y="12" width="2" height="2" fill="#E2E8F0" />
          <rect x="5" y="13" width="1" height="3" fill="#3B82F6" />
          <rect x="10" y="13" width="1" height="3" fill="#3B82F6" />
        </svg>
      );

    // 1: Dark Styled Hair
    case 1:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Hair: Voluminous Dark */}
          <rect x="4" y="1" width="8" height="3" fill="#27272A" />
          <rect x="3" y="2" width="10" height="2" fill="#3F3F46" />
          <rect x="2" y="3" width="3" height="4" fill="#18181B" />
          <rect x="12" y="3" width="2" height="3" fill="#18181B" />
          {/* Face: Tan skin tone */}
          <rect x="4" y="4" width="8" height="7" fill="#F6AD55" />
          {/* Eyes */}
          <rect x="5" y="6" width="2" height="2" fill="#18181B" />
          <rect x="9" y="6" width="2" height="2" fill="#18181B" />
          <rect x="5" y="6" width="1" height="1" fill="#FFFFFF" />
          <rect x="9" y="6" width="1" height="1" fill="#FFFFFF" />
          {/* Mouth */}
          <rect x="7" y="9" width="2" height="1" fill="#C05621" />
          {/* Casual Shirt */}
          <rect x="3" y="12" width="10" height="4" fill="#10B981" />
          <rect x="7" y="12" width="2" height="2" fill="#F6AD55" />
        </svg>
      );

    // 2: Black Hoodie Character
    case 2:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Dark Hood Framing */}
          <rect x="3" y="1" width="10" height="12" fill="#1E1E24" />
          <rect x="4" y="0" width="8" height="2" fill="#27272A" />
          <rect x="2" y="3" width="12" height="10" fill="#18181B" />
          {/* Face cutout inside hood */}
          <rect x="5" y="4" width="6" height="6" fill="#FED7AA" />
          {/* Shaded Eyes */}
          <rect x="6" y="6" width="1" height="2" fill="#1E3A8A" />
          <rect x="9" y="6" width="1" height="2" fill="#1E3A8A" />
          {/* Mouth */}
          <rect x="7" y="9" width="2" height="1" fill="#9A3412" />
          {/* Hoodie Body & drawstrings */}
          <rect x="2" y="12" width="12" height="4" fill="#18181B" />
          <rect x="6" y="12" width="1" height="3" fill="#E2E8F0" />
          <rect x="9" y="12" width="1" height="3" fill="#E2E8F0" />
        </svg>
      );

    // 3: Orange Head / Retro Cap Avatar
    case 3:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Orange/Yellow Cap */}
          <rect x="4" y="1" width="8" height="4" fill="#F97316" />
          <rect x="3" y="3" width="11" height="2" fill="#EA580C" />
          <rect x="2" y="4" width="3" height="1" fill="#C2410C" />
          {/* Face */}
          <rect x="4" y="5" width="8" height="6" fill="#FDBA74" />
          {/* Eyes */}
          <rect x="5" y="7" width="2" height="1" fill="#18181B" />
          <rect x="9" y="7" width="2" height="1" fill="#18181B" />
          {/* Cheerful grin */}
          <rect x="7" y="9" width="2" height="1" fill="#9A3412" />
          {/* Blue Jacket */}
          <rect x="3" y="12" width="10" height="4" fill="#2563EB" />
          <rect x="7" y="12" width="2" height="2" fill="#FDBA74" />
        </svg>
      );

    // 4: Telescope Polar Bear Cadet
    case 4:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Ears */}
          <rect x="3" y="1" width="3" height="3" fill="#F1F5F9" />
          <rect x="4" y="2" width="1" height="1" fill="#F472B6" />
          <rect x="10" y="1" width="3" height="3" fill="#F1F5F9" />
          <rect x="11" y="2" width="1" height="1" fill="#F472B6" />
          {/* Bear Head */}
          <rect x="4" y="2" width="8" height="8" fill="#FFFFFF" />
          <rect x="3" y="4" width="10" height="6" fill="#F8FAFC" />
          {/* Eyes */}
          <rect x="5" y="5" width="2" height="2" fill="#0F172A" />
          <rect x="9" y="5" width="2" height="2" fill="#0F172A" />
          <rect x="5" y="5" width="1" height="1" fill="#FFFFFF" />
          <rect x="9" y="5" width="1" height="1" fill="#FFFFFF" />
          {/* Snout */}
          <rect x="7" y="7" width="2" height="2" fill="#CBD5E1" />
          <rect x="7" y="7" width="2" height="1" fill="#0F172A" />
          {/* Sky Blue Scarf */}
          <rect x="2" y="11" width="12" height="3" fill="#0284C7" />
          <rect x="8" y="13" width="3" height="3" fill="#0369A1" />
        </svg>
      );

    // 5: Cyber Visor Agent
    case 5:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Cyber Hair */}
          <rect x="3" y="1" width="10" height="3" fill="#4F46E5" />
          <rect x="2" y="2" width="3" height="4" fill="#4338CA" />
          <rect x="11" y="2" width="3" height="3" fill="#312E81" />
          {/* Face */}
          <rect x="4" y="4" width="8" height="7" fill="#FED7AA" />
          {/* Glowing Visor */}
          <rect x="3" y="5" width="10" height="3" fill="#06B6D4" />
          <rect x="4" y="6" width="8" height="1" fill="#EC4899" />
          {/* Mouth */}
          <rect x="7" y="9" width="2" height="1" fill="#7C2D12" />
          {/* Tech Suit */}
          <rect x="3" y="12" width="10" height="4" fill="#0F172A" />
          <rect x="6" y="12" width="4" height="1" fill="#06B6D4" />
        </svg>
      );

    // 6: Crimson Bandana Brawler
    case 6:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Hair Top */}
          <rect x="4" y="1" width="8" height="2" fill="#78350F" />
          {/* Red Bandana */}
          <rect x="3" y="3" width="10" height="3" fill="#DC2626" />
          <rect x="1" y="4" width="2" height="2" fill="#B91C1C" />
          {/* Face */}
          <rect x="4" y="5" width="8" height="6" fill="#FDBA74" />
          {/* Eyes */}
          <rect x="5" y="7" width="2" height="1" fill="#18181B" />
          <rect x="9" y="7" width="2" height="1" fill="#18181B" />
          {/* Grin */}
          <rect x="7" y="9" width="3" height="1" fill="#9A3412" />
          {/* Gi */}
          <rect x="3" y="12" width="10" height="4" fill="#F8FAFC" />
          <rect x="7" y="12" width="2" height="3" fill="#FDBA74" />
        </svg>
      );

    // 7: Gold Crown OG
    default:
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
          {/* Crown */}
          <rect x="4" y="1" width="2" height="2" fill="#EAB308" />
          <rect x="7" y="0" width="2" height="3" fill="#EAB308" />
          <rect x="10" y="1" width="2" height="2" fill="#EAB308" />
          <rect x="4" y="2" width="8" height="2" fill="#CA8A04" />
          <rect x="7" y="2" width="2" height="1" fill="#EF4444" />
          {/* Face */}
          <rect x="4" y="4" width="8" height="7" fill="#FDE047" />
          {/* Sunglasses */}
          <rect x="3" y="5" width="10" height="3" fill="#18181B" />
          <rect x="4" y="6" width="3" height="1" fill="#3F3F46" />
          <rect x="9" y="6" width="3" height="1" fill="#3F3F46" />
          {/* Smile */}
          <rect x="7" y="9" width="2" height="1" fill="#854D0E" />
          {/* Royal Cape / Suit */}
          <rect x="3" y="12" width="10" height="4" fill="#7C3AED" />
          <rect x="7" y="12" width="2" height="2" fill="#FDE047" />
        </svg>
      );
  }
}

export function RetroPixelAvatar({
  seed = "default",
  avatarUrl,
  imageHash: _unusedImageHash,
  className = "",
  size = 24,
  alt = "User avatar",
  pixelArtFallback = false,
}: RetroPixelAvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const formattedUrl = React.useMemo(() => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith("ipfs://")) {
      return avatarUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    return avatarUrl;
  }, [avatarUrl]);

  const showImage = Boolean(formattedUrl && !imageFailed);

  if (showImage) {
    return (
      <div
        className={`retro-avatar relative flex items-center justify-center rounded-[4px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/80 overflow-hidden shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={formattedUrl!}
          alt={alt}
          className="w-full h-full object-cover rounded-[4px]"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  // Placeholder when user does not have an avatar
  if (pixelArtFallback) {
    const avatarIndex = hashString(seed) % 8;
    return (
      <div
        className={`retro-avatar relative flex items-center justify-center rounded-[4px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/80 overflow-hidden shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${className}`}
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
        }}
        aria-label="Avatar placeholder"
      >
        {renderAvatarHead(avatarIndex)}
      </div>
    );
  }

  const iconSize = Math.max(12, Math.round(size * 0.58));

  return (
    <div
      className={`retro-avatar relative flex items-center justify-center rounded-[4px] bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-300/80 dark:border-zinc-700/80 overflow-hidden shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${className}`}
      style={{ width: size, height: size }}
      aria-label="Avatar placeholder"
    >
      <User
        className="text-zinc-400 dark:text-zinc-500 stroke-[2]"
        style={{ width: iconSize, height: iconSize }}
      />
    </div>
  );
}
