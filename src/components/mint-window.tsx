"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/connect-button";
import { MintButton } from "@/components/mint-button";
import { YearJoinedAvaxIndicator } from "@/components/year-joined-avax-indicator";
import { useState } from "react";

export function MintWindow() {
    const { address, isConnected } = useAccount();
    const [yearJoined, setYearJoined] = useState(2025);

    const puppetPrices = {
        2021: 1,
        2022: 1.2,
        2023: 1.6,
        2024: 2,
        2025: 2.5
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
                <YearJoinedAvaxIndicator yearJoined={yearJoined} prices={puppetPrices} />
                <br />
                {isConnected
                    ? (<MintButton />)
                    : (<ConnectButton />)}
            </div>
        </div>
    );
}