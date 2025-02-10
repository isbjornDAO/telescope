"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/connect-button";
import { MintButton } from "@/components/mint-button";
import { WLRoundIndicator } from "@/components/wl-round-indicator";
import { useState } from "react";
import { MintCounter } from "@/components/mint-counter";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address } from "viem";
import { ConnectDiscordButton } from "./connect-discord-button";
import { CheckCircle } from "lucide-react";


export function MintWindow() {
    const { address, isConnected } = useAccount();


    const [isMinting, setIsMinting] = useState(false);
    const [numToMint, setNumToMint] = useState<number>(1);
    const [maxAllowedToMint, setMaxAllowedToMint] = useState<number>(10);
    const [roundJoined, setRoundJoined] = useState(5);

    const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
        address as Address,
        isConnected
    );

    const puppetPrices: { [round: number]: number } = {
        1: 1,
        2: 1.2,
        3: 1.6,
        4: 1.8,
        5: 2
    }

    return isMinting
        ? (
            <div className="w-full flex flex-col md:flex-row gap-1 pl-12 pr-8 items-center">
                <img
                    className="w-[300px] border-zinc-300 border-2"
                    src="example_puppet.png"
                />
                <div className="mt-2 md:mt-0 flex-1 text-center flex flex-col gap-1 items-center">
                    <h2 className="text-2xl font-bold mb-2">Mint a puppet</h2>
                    <div className="w-[300px]">Welcome new student to Bear University! Those who picked up the avax pamphlet first have a lower enrollment fee!</div>
                    <WLRoundIndicator roundJoined={roundJoined} prices={puppetPrices} />
                    <br />
                    <MintCounter value={numToMint} setValue={setNumToMint} max={maxAllowedToMint} />
                    <div className="font-semibold text-sm mb-1">{`Total: ${numToMint * puppetPrices[roundJoined]} AVAX`}</div>
                    {isConnected
                        ? (<MintButton />)
                        : (<ConnectButton />)}
                </div>
            </div>
        ) : (
            <div className="w-full flex flex-col md:flex-row gap-1 pl-12 pr-8 items-center">
                <img
                    className="w-[300px] border-zinc-300 border-2"
                    src="example_puppet.png"
                />
                <div className="mt-2 md:mt-0 flex-1 text-center flex flex-col gap-1 items-center">
                    <div className="flex flex-col gap-1 items-center mb-6">
                        <h2 className="text-2xl font-bold">Sign Up to Bear University</h2>
                        {isConnected && <span className=" text-zinc-500 font-semibold">
                            {`Wallet Connected: ${address?.substring(0, 4)}...${address?.substring(address.length - 4)}`}
                        </span>}
                    </div>
                    {isConnected
                        ? (
                            <div className="flex flex-col gap-3">
                                {!userStats?.discordId
                                    ? (
                                        <div>
                                            <ConnectDiscordButton />
                                        </div>
                                    )
                                    : (
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="text-green-500 font-semibold">You are Signed Up!</span><CheckCircle className="h-8 w-8 stroke-green-500" />
                                        </div>
                                    )
                                }
                            </div>)
                        : (<ConnectButton />)}
                </div>
            </div>
        )
}