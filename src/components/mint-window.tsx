"use client";

import { useAccount, usePrepareTransactionRequest, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@/components/connect-button";
import { useEffect, useState } from "react";
import { MintCounter } from "@/components/mint-counter";
import { useUserStats } from "@/hooks/use-user-stats";
import { Address, encodeFunctionData, parseEther } from "viem";
import { ConnectDiscordButton } from "./connect-discord-button";
import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { puppets_nft_abi, puppets_nft_address } from "@/lib/constants";
import { Loader } from "@/components/icons/loader";
import { useToast } from "@/hooks/use-toast";
import { avalanche } from "wagmi/chains";
import ProgressBar from "@/components/progress-bar";


export function MintWindow() {
    const chainId = avalanche.id;
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

    const [, setIsWhiteList] = useState(false);
    const [numMintedThisPhase, setNumMintedThisPhase] = useState(0);

    const [stickerNum,] = useState(Math.floor(Math.random() * 6) + 1);

    const { data: userStats } = useUserStats(
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

    const { data: isMintingData, refetch: fetchIsMinting } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "mintActive",
        chainId: chainId
    });

    const { data: mintPhaseData, refetch: fetchMintPhase } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "getCurrentPhase",
        chainId: chainId
    });

    const { data: numMintedData, refetch: fetchNumMinted } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "totalSupply",
        chainId: chainId
    });

    const { data: whiteListData, refetch: fetchWhiteList } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "whiteList",
        args: [address],
        chainId: chainId
    });

    const { data: numMintedThisPhaseData, refetch: fetchNumMintedThisPhase } = useReadContract({
        abi: puppets_nft_abi,
        address: puppets_nft_address,
        functionName: "mintsInPhase",
        args: [BigInt(mintPhase), address],
        chainId: chainId
    });

    useEffect(() => {
        if (isMintingData !== undefined) {
            setIsMinting(Boolean(isMintingData) && mintPhase > 0);
        }
    }, [isMintingData, mintPhase]);

    useEffect(() => {
        fetchIsMinting();
    }, [fetchIsMinting]);

    useEffect(() => {
        if (!userStats?.discordId) {
            setCanAccessMinting(true); // allow everyone now (flip to false to re gate via discord)
        } else {
            setCanAccessMinting(true);
        }
    }, [userStats]);

    useEffect(() => {
        if (mintPhase === 1) {
            setMaxAllowedToMint(1 - numMintedThisPhase);
        } else if (mintPhase === 5) {
            setMaxAllowedToMint(10 - numMintedThisPhase);
        } else if (mintPhase === 0) {
            setMaxAllowedToMint(0);
        } else {
            setMaxAllowedToMint(2 - numMintedThisPhase);
        }
    }, [mintPhase, numMintedThisPhase]);

    useEffect(() => {
        const price = puppetPrices[mintPhase];
        const total = BigInt(price) * BigInt(numToMint) * BigInt(1e18);
        setTotalCost(Number(total / BigInt(1e18)));
    }, [numToMint, mintPhase, puppetPrices]);

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
    }, [address, fetchWhiteList, isConnected]);

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
    }, [address, fetchNumMintedThisPhase, isConnected]);

    const mintTransactionData = () => {
        if (!address || numToMint <= 0) return null;

        const functionName = mintPhase === 1 ? 'wlMint' : 'publicMint';
        return encodeFunctionData({
            abi: puppets_nft_abi,
            functionName,
            args: mintPhase === 1 ? undefined : [BigInt(numToMint), BigInt(mintPhase)]
        });
    };

    const { data: mintRequest } = usePrepareTransactionRequest({
        chainId: chainId,
        account: address,
        to: puppets_nft_address,
        data: mintTransactionData() ?? undefined,
        value: parseEther(totalCost.toString())
    });

    const { sendTransaction: sendMintTx, isPending: isMintPending, data: mintTxHash } = useSendTransaction();

    const { isError: mintError, isLoading: isConfirming, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintTxHash });

    const handleMint = async () => {
        if (mintRequest) {
            try {
                // Send the transaction
                sendMintTx(mintRequest);

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
                description: "You are the proud owner of a puppet!",
                txHash: mintTxHash
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
    }, [mintSuccess, mintError, fetchMintPhase, fetchNumMinted, fetchNumMintedThisPhase, fetchWhiteList, mintTxHash, toast]);

    return canAccessMinting && isMinting
        ? (
            <div className="w-full flex flex-col md:flex-row gap-1 pl-12 pr-8 items-center">
                <div className="flex flex-col gap-2 items-center">
                    <img
                        className="w-[300px] border-zinc-300 border-2"
                        src="puppets/images/unrevealed.gif"
                        alt="unrevealed puppet"
                    />
                    <span className="font-semibold text-zinc-500">{`${numMinted} / ${MAX_SUPPLY} minted`}</span>
                </div>
                <div className="mt-2 md:mt-0 flex-1 text-center flex flex-col gap-1 items-center">
                    <h2 className="text-2xl font-bold mb-2">Mint a puppet</h2>
                    <div className="w-[300px] mb-2">{`Welcome new student to Bear University!`}</div>

                    <ProgressBar progress={numMinted} base={1000} />

                    <br />
                    <MintCounter value={numToMint} setValue={setNumToMint} max={maxAllowedToMint} />
                    <span className="text-zinc-500 text-xs mb-1">{`max: ${maxAllowedToMint}`}</span>
                    {isConnected
                        ? (<Button
                            className="flex snow-button max-w-[150px] items-center justify-center relative min-h-[36px]"
                            disabled={isMintPending || isConfirming || maxAllowedToMint === 0 || numMinted === 1000}
                            onClick={handleMint}>
                            <div className="flex items-center justify-center w-full h-full">
                                {isMintPending || isConfirming ? (
                                    <div className="flex items-center justify-center">
                                        <Loader />
                                    </div>
                                ) : (
                                    'Mint'
                                )}
                            </div>
                        </Button>)
                        : (<ConnectButton />)}
                </div>
            </div>
        ) : (
            <div className="w-full flex flex-col md:flex-row gap-1 pl-12 pr-8 items-center">
                <img
                    className="w-[300px] h-[300px] object-contain object-center mx-auto"
                    src={`stickers/sticker${stickerNum}.png`}
                    alt="cute student puppet"
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
                                {!canAccessMinting
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