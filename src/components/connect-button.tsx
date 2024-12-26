"use client";

import { useState } from "react";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";
import { useDisconnect } from "wagmi";
import { useUserStats } from "@/hooks/use-user-stats";
import Link from "next/link";

export const ConnectButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { disconnect } = useDisconnect();
  const { data: userStats } = useUserStats();

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
        const account = {
          ...rainbowAccount,
          level: userStats?.level || 1,
          xp: userStats?.xp || 0,
          xpForNextLevel: userStats?.xpForNextLevel || 10,
        };

        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    type="button"
                    className="snow-button"
                  >
                    Connect Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    type="button"
                  >
                    Wrong network
                  </Button>
                );
              }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="snow-button w-full justify-between hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <span>{account.displayName}</span>
                        </div>
                        <ChevronDown
                          className={`ml-2 h-4 w-4 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
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
                                (account.xp /
                                  (account.xpForNextLevel + account.xp)) *
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
                      <Link href="/profile">
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
