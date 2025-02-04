"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/connect-button";
import { MintButton } from "@/components/mint-button";
import { WLRoundIndicator } from "@/components/wl-round-indicator";
import { useState } from "react";
import { MintCounter } from "@/components/mint-counter";


export function MintWindow() {
    const { address, isConnected } = useAccount();
    const [numToMint, setNumToMint] = useState<number>(1);
    const [maxAllowedToMint, setMaxAllowedToMint] = useState<number>(10);
    const [roundJoined, setRoundJoined] = useState(5);

    const puppetPrices: { [round: number]: number } = {
        1: 1,
        2: 1.2,
        3: 1.6,
        4: 2,
        5: 2.5
    }

    return (
        <div className="w-full flex flex-col md:flex-row gap-1 px-10 items-center">
            <img
                className="w-[300px] border-zinc-300 border-2"
                src="logo.png"
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
    );
}