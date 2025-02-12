"use client";

import { useAccount, usePrepareTransactionRequest, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@/components/connect-button";
import { WLRoundIndicator } from "@/components/wl-round-indicator";
import { useEffect, useMemo, useState } from "react";
import { MintCounter } from "@/components/mint-counter";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address, encodeFunctionData, parseEther } from "viem";
import { ConnectDiscordButton } from "./connect-discord-button";
import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { puppets_nft_abi, puppets_nft_address } from "@/lib/constants";
import { Loader } from "@/components/loader";
import { useToast } from "@/hooks/use-toast";


export function MintWindow() {
    const { address, isConnected } = useAccount();
    const { toast } = useToast();

    const MAX_SUPPLY = 1000;
    const [numMinted, setNumMinted] = useState(250);

    const [isMinting, setIsMinting] = useState(false);
    const [canAccessMinting, setCanAccessMinting] = useState(false);
    const [mintPhase, setMintPhase] = useState<number>(0);
    const [numToMint, setNumToMint] = useState<number>(1);
    const [maxAllowedToMint, setMaxAllowedToMint] = useState<number>(10);
    const [totalCost, setTotalCost] = useState(0);

    const [isWhiteList, setIsWhiteList] = useState(false);
    const [numMintedThisPhase, setNumMintedThisPhase] = useState(0);
    const [whiteListString, setWhiteListString] = useState<string>('Connect your wallet to see if you got WL');

    const { data: userStats, isLoading: isUserStatsLoading } = useUserStats(
        address as Address,
        isConnected
    );

    const puppetPrices: { [round: number]: number } = {
        0: 0,
        1: 1,
        2: 1.25,
        3: 1.5,
        4: 1.75,
        5: 2
    };

    const { data: mintPhaseData, refetch: fetchMintPhase } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "getCurrentPhase",
        chainId: 43113
    });

    const { data: numMintedData, refetch: fetchNumMinted } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "totalSupply",
        chainId: 43113
    });

    const { data: whiteListData, refetch: fetchWhiteList } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "whiteList",
        args: [address],
        chainId: 43113
    });

    const { data: numMintedThisPhaseData, refetch: fetchNumMintedThisPhase } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "mintsInPhase",
        args: [BigInt(mintPhase), address],
        chainId: 43113
    });

    useEffect(() => {
        if (!userStats?.discordId) {
            setCanAccessMinting(false);
        } else {
            setCanAccessMinting(true);
        }
    }, [userStats]);

    useEffect(() => {
        if (mintPhase === 1) {
            setMaxAllowedToMint(1 - numMintedThisPhase);
        } else {
            setMaxAllowedToMint(2 - numMintedThisPhase);
            if (numMintedThisPhase == 2) {
                setMaxAllowedToMint(0);
            }
        }
    }, [mintPhase, numMintedThisPhase]);

    useEffect(() => {
        if (isWhiteList) {
            setWhiteListString(`You are on the WL. You can also mint in each round after`);
        } else {
            setWhiteListString(`You are not on the list. Feel free to mint in the public rounds`);
        }
    }, [isWhiteList]);

    useEffect(() => {
        const price = puppetPrices[mintPhase];
        const total = BigInt(Math.round(price * 1e18)) * BigInt(numToMint);
        setTotalCost(Number(total) / 1e18);
    }, [numToMint, mintPhase]);

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

    useEffect(() => {
        if (numMintedData !== undefined) {
            setNumMinted(Number(numMintedData));
        }
    }, [numMintedData]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchNumMinted();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [fetchNumMinted]);

    useEffect(() => {
        if (isConnected) {
            fetchWhiteList();
        }
    }, [address]);

    useEffect(() => {
        if (whiteListData !== undefined) {
            const whiteListBool = Boolean(whiteListData);
            if (whiteListBool) {
                setIsWhiteList(true);
            }
        }
    }, [whiteListData]);

    useEffect(() => {
        if (numMintedThisPhaseData !== undefined) {
            const numMintedThisPhaseNum = Number(numMintedThisPhaseData);
            setNumMintedThisPhase(numMintedThisPhaseNum);
        }
    }, [numMintedThisPhaseData]);

    useEffect(() => {
        if (isConnected) {
            const interval = setInterval(() => {
                fetchNumMintedThisPhase();
            }, 15000); // Poll every 15 seconds

            return () => clearInterval(interval);
        }
    }, [fetchNumMintedThisPhase]);


    const mintTransactionData = useMemo(() => {
        if (!address || numToMint <= 0) return null;

        const functionName = mintPhase === 1
            ? 'wlMint'
            : 'publicMint';

        return encodeFunctionData({
            abi: puppets_nft_abi,
            functionName,
            args: mintPhase === 1 ? undefined : [BigInt(mintPhase), BigInt(numToMint)]
        });
    }, [address, numToMint, mintPhase]);

    const { data: request } = usePrepareTransactionRequest({
        chainId: 43113,
        account: address,
        to: puppets_nft_address,
        data: mintTransactionData ?? undefined,
        value: parseEther(totalCost.toString())
    });

    const { sendTransaction: sendMintTx, isPending: isMintPending, data: mintTxHash } = useSendTransaction();

    const { data: mintReceipt, isError: mintError, isLoading: isConfirming, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintTxHash });

    const handleMint = async () => {
        if (request) {
            try {
                // Send the transaction
                sendMintTx(request);

            } catch (error) {
                console.error("Minting failed", error);
                toast({
                    title: "Mint Failed",
                    description: error instanceof Error ? error.message : "There was an issue with your minting transaction. Please refresh and try again.",
                    variant: "destructive"
                });
            }
        } else {
            console.error("Failed to queue up mint tx.");
        }
    };

    useEffect(() => {
        if (mintSuccess) {
            toast({
                title: "Mint Successful!",
                description: `Mint successful! Transaction hash: ${mintTxHash?.slice(0, 6)}...${mintTxHash?.slice(-4)}`,
            });
        }

        if (mintError) {
            toast({
                title: "Mint Failed",
                description: "There was an error with your minting transaction. Please try again.",
                variant: "destructive"
            });
        }

        fetchNumMinted();
        fetchNumMintedThisPhase();
        fetchWhiteList();
        fetchMintPhase();
    }, [mintSuccess, mintError]);

    return canAccessMinting && isMinting
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
                            className="flex snow-button max-w-[150px] items-center justify-center relative min-h-[36px]"
                            disabled={isMintPending || isConfirming || maxAllowedToMint === 0}
                            onClick={handleMint}>
                            <div className="flex items-center justify-center w-full h-full">
                                {isMintPending || isConfirming ? (
                                    <div className="flex items-center justify-center">
                                        <Loader />
                                    </div>
                                ) : (
                                    "Mint"
                                )}
                            </div>
                        </Button>)
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
                                            <span className="text-green-500 font-semibold">You are Ready for the Mint!</span><CheckCircle className="h-8 w-8 stroke-green-500" />
                                        </div>
                                    )
                                }
                            </div>)
                        : (<ConnectButton />)}
                </div>
            </div>
        )
}