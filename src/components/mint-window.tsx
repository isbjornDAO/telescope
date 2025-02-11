"use client";

import { useAccount, usePrepareTransactionRequest, useReadContract, useSendTransaction } from "wagmi";
import { ConnectButton } from "@/components/connect-button";
import { WLRoundIndicator } from "@/components/wl-round-indicator";
import { useEffect, useState } from "react";
import { MintCounter } from "@/components/mint-counter";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address, encodeFunctionData, parseEther } from "viem";
import { ConnectDiscordButton } from "./connect-discord-button";
import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { puppets_nft_abi, puppets_nft_address } from "@/lib/constants";


export function MintWindow() {
    const { address, isConnected } = useAccount();

    const MAX_SUPPLY = 1000;
    const [numMinted, setNumMinted] = useState(250);

    const [isMinting, setIsMinting] = useState(true);
    const [mintPhase, setMintPhase] = useState<number>(0);
    const [numToMint, setNumToMint] = useState<number>(1);
    const [maxAllowedToMint, setMaxAllowedToMint] = useState<number>(10);
    const [totalCost, setTotalCost] = useState(0);

    const [whiteListLevel, setWhiteListLevel] = useState(6);
    const [whiteListString, setWhiteListString] = useState<string>('Connect your wallet to see if you got WL');

    const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
        address as Address,
        isConnected
    );

    const puppetPrices: { [round: number]: number } = {
        1: 1,
        2: 1.2,
        3: 1.4,
        4: 1.6,
        5: 1.8,
        6: 2
    };

    const { data: mintPhaseData, refetch: fetchMintPhase } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "getCurrentPhase",
        chainId: 43113
    });

    const transactionData = encodeFunctionData({
        abi: puppets_nft_abi,
        functionName: whiteListLevel === 6 && mintPhase < 6 ? 'panicMint' :
            mintPhase === 6 ? 'publicMint' : 'wlMint',
        args: [BigInt(numToMint)]
    });

    const { data: request } = usePrepareTransactionRequest({
        chainId: 43113,
        account: address,
        to: puppets_nft_address,
        data: transactionData,
        value: parseEther(totalCost.toString())
    });

    const { sendTransaction: sendMintTx, isPending: isMintPending } = useSendTransaction();

    const handleMint = () => {
        if (request) {
            sendMintTx(request);
        } else {
            console.error("Failed to queue up mint tx.");
        }
    };

    useEffect(() => {
        if (mintPhase != 6) {
            setMaxAllowedToMint(mintPhase);
        } else {
            setMaxAllowedToMint(10);
        }
    }, [mintPhase]);

    useEffect(() => {
        if (whiteListLevel < 6) {
            setWhiteListString(`You are in round ${whiteListLevel}. You can also mint in each round after`);
        } else {
            setWhiteListString(`You are not on the list. Feel free to mint at the public price`);
        }
    }, [whiteListLevel]);

    useEffect(() => {
        if (whiteListLevel <= mintPhase) {
            setTotalCost(puppetPrices[mintPhase] * numToMint);
        } else {
            setTotalCost(puppetPrices[6] * numToMint);
        }
    }, [numToMint, whiteListLevel, mintPhase]);

    useEffect(() => {
        if (mintPhaseData !== undefined) {
            setMintPhase(Number(mintPhaseData));
        }
    }, [mintPhaseData]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchMintPhase();
        }, 15000); // Poll every 15 seconds

        return () => clearInterval(interval);
    }, [fetchMintPhase]);

    return isMinting
        ? (
            <div className="w-full flex flex-col md:flex-row gap-1 pl-12 pr-8 items-center">
                <div className="flex flex-col gap-2 items-center">
                    <img
                        className="w-[300px] border-zinc-300 border-2"
                        src="example_puppet.png"
                    />
                    <span className="font-semibold text-zinc-500">{`${numMinted} / ${MAX_SUPPLY} minted`}</span>
                </div>
                <div className="mt-2 md:mt-0 flex-1 text-center flex flex-col gap-1 items-center">
                    <h2 className="text-2xl font-bold mb-2">Mint a puppet</h2>
                    <div className="w-[300px] mb-2">{`Welcome new student to Bear University! ${whiteListString}`}</div>
                    <WLRoundIndicator currentPhase={mintPhase} prices={puppetPrices} />
                    <br />
                    <MintCounter value={numToMint} setValue={setNumToMint} max={maxAllowedToMint} />
                    <div className="font-semibold text-sm mb-1">{`Total: ${totalCost} AVAX`}</div>
                    {isConnected
                        ? (<Button
                            className="snow-button max-w-[150px]"
                            disabled={false && whiteListLevel >= mintPhase}
                            onClick={handleMint}>Mint</Button>)
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