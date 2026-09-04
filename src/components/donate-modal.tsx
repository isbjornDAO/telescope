"use client";

import { useState, useEffect } from "react";
import { Coffee } from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { useAccount, usePrepareTransactionRequest, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useToast } from "@/hooks/use-toast";
import { avalanche } from "wagmi/chains";

const DONATION_ADDRESS = "0x0C39f0970CF3118Fd004A3f069E59dabc6714980";

export function DonateModal() {
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const chainId = avalanche.id;

  const { data: donateRequest } = usePrepareTransactionRequest({
    chainId: chainId,
    account: address,
    to: DONATION_ADDRESS as `0x${string}`,
    value: amount && parseFloat(amount) > 0 ? parseEther(amount) : BigInt(0)
  });

  const { data: hash, sendTransaction, isPending, reset } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: "Donation sent!",
        description: `Thank you for supporting with ${amount} AVAX`,
        txHash: hash
      });
      setAmount("");
      reset();
    }
  }, [isSuccess, hash, amount, toast, reset]);

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      });
      return;
    }

    if (!donateRequest) {
      toast({
        title: "Transaction preparation failed",
        description: "Unable to prepare donation. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      sendTransaction(donateRequest);
    } catch (error) {
      console.error("Donation error:", error);
      toast({
        title: "Transaction failed",
        description: "Unable to send donation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const presetAmounts = ["0.1", "0.5", "1", "5"];

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <button className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 h-9 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
          <Coffee className="h-4 w-4" />
          
        </button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Support Development</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="space-y-4">
            {isConnected ? (
              <>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  Send AVAX to support the continued development of Telescope
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 break-all">
                  {DONATION_ADDRESS}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                    Amount (AVAX)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-2">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className="flex-1 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDonate}
                  disabled={!amount || isPending || isConfirming}
                  className="w-full snow-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Confirming..." : isConfirming ? "Sending..." : `Send ${amount || "0"} AVAX`}
                </button>
                
                {hash && !isSuccess && (
                  <div className="text-xs text-sky-600 text-center">
                    Transaction submitted! Waiting for confirmation...
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                  Connect your wallet to make a donation
                </p>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Wallet address:
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 mt-2 text-xs font-mono text-zinc-600 dark:text-zinc-300 break-all">
                  {DONATION_ADDRESS}
                </div>
              </div>
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}