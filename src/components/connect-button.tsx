"use client";

import { useState, useEffect } from "react";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccount, useDisconnect } from "wagmi";
import { useUserStats } from "@/hooks/use-user-stats";
import { useUserDiscord } from "@/hooks/use-user-discord";
import Link from "next/link";
import { Address } from "viem";
import { setWalletAddressCookie } from "@/lib/cookies";
import { getXpProgress } from "@/lib/xp";

/**
 * Loading skeleton matching the exact footprint of the retro connection button.
 */
function ConnectButtonSkeleton({ isReconnecting = false }: { isReconnecting?: boolean }) {
  if (isReconnecting) {
    return (
      <div
        className="retro-btn-blue select-none pointer-events-none opacity-85 animate-pulse min-w-[150px] justify-between gap-2"
        aria-hidden="true"
      >
        <div className="h-5 w-5 rounded-[3px] bg-white/30 shrink-0" />
        <div className="w-20 h-3 rounded bg-white/25" />
        <div className="w-8 h-4 rounded bg-black/15 shrink-0" />
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
      </div>
    );
  }

  return (
    <div
      className="retro-btn-blue select-none pointer-events-none opacity-90 animate-pulse min-w-[142px]"
      aria-hidden="true"
    >
      <Wallet className="w-4 h-4 shrink-0 opacity-80" />
      <span className="opacity-90">Connect Wallet</span>
    </div>
  );
}

export const ConnectButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { disconnect } = useDisconnect();
  const { address, isConnected, status } = useAccount();
  const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
    address as Address,
    isConnected
  );
  const { data: discordUser } = useUserDiscord(userStats?.discordId || "");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Set cookie when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      setWalletAddressCookie(address);
    }
  }, [address, isConnected]);

  // Initial SSR or pre-hydration render: display static button skeleton immediately
  if (!hasMounted) {
    return <ConnectButtonSkeleton />;
  }

  // Wagmi is in the process of reconnecting previous session: show account skeleton
  if (status === "reconnecting") {
    return <ConnectButtonSkeleton isReconnecting />;
  }

  return (
    <RainbowConnectButton.Custom>
      {({
        account: rainbowAccount,
        chain,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const progress = userStats?.progress || getXpProgress(userStats?.xp || 0);
        const account = {
          ...rainbowAccount,
          level: userStats?.level || 1,
          xp: userStats?.xp || 0,
          xpForNextLevel: userStats?.xpForNextLevel || 10,
          progress: progress,
        };

        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return <ConnectButtonSkeleton isReconnecting={status === "connecting"} />;
        }

        return (
          <div>
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="retro-btn-blue"
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span>Connect Wallet</span>
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="retro-btn-destructive"
                  >
                    Wrong network
                  </button>
                );
              }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="retro-btn-blue w-full justify-between gap-2"
                      >
                        {/* Face and level ride on the button itself */}
                        <Avatar className="h-5 w-5 flex-shrink-0 rounded-[3px] ring-1 ring-black/10">
                          <AvatarImage src={discordUser?.avatar_url} alt="" className="rounded-[3px]" />
                          <AvatarFallback className="bg-white/30 text-white text-[10px] font-bold rounded-[3px]">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        {/* The name is the first thing to go when the header
                            runs out of room on a phone; the face still says who
                            this is. */}
                        <span className="hidden sm:inline max-w-[9rem] truncate">
                          {discordUser?.username || userStats?.username || userStats?.discordId || account.displayName}
                        </span>
                        <span className="flex-shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                          {isUserStatsLoading && !userStats ? (
                            <span className="inline-block w-6 h-2.5 bg-white/30 animate-pulse rounded" />
                          ) : (
                            `Lv ${account.level}`
                          )}
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem className="flex flex-col items-start">
                        <span className="font-medium">
                          Level {account.level}
                        </span>
                        <div className="w-full mt-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-600 transition-all duration-300"
                            style={{
                              width: `${
                                ((account.progress?.currentProgress || 0) /
                                  (account.progress?.totalNeeded || 21)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 mt-1">
                          {account.xp} XP / {account.xpForNextLevel} XP to next
                          level
                        </span>
                      </DropdownMenuItem>
                      <Link href={`/profile`}>
                        <DropdownMenuItem className="w-full cursor-pointer hover:bg-zinc-100">
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <a href="https://discord.gg/K4z7xxFVGc" target="_blank">
                        <DropdownMenuItem className="w-full cursor-pointer hover:bg-zinc-100">
                          Collect Rewards
                        </DropdownMenuItem>
                      </a>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 cursor-pointer hover:bg-zinc-100"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
};
