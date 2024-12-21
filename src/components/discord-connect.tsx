import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { useSignMessage } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { useAccount } from 'wagmi';

export const DiscordConnect = ({ isConnected }: { isConnected: boolean }) => {
  const { signMessageAsync, isPending } = useSignMessage();
  const { address } = useAccount();

  if (!isConnected) return null;

  const handleConnect = async () => {
    try {
      const message = "Sign this message to verify wallet ownership before connecting Discord.";
      
      // Request wallet signature
      await signMessageAsync({ message });
      
      // Proceed to sign in with Discord and include wallet address
      signIn("discord", { callbackUrl: "/", walletAddress: address }); // Pass wallet address
    } catch (error) {
      console.error("Failed to sign message:", error);
      toast({
        title: "Signature Required",
        description: "You need to sign the message to connect Discord.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Alert
        variant="default"
        className="bg-white border-zinc-300 py-4 flex flex-row justify-between"
      >
        <div className="flex flex-row gap-2">
          <AlertCircle className="h-4 w-4 stroke-zinc-500" />
          <div className="flex flex-col">
            <AlertTitle className="font-bold">
              Connect your Discord account
            </AlertTitle>
            <AlertDescription className="text-zinc-500">
              You need to connect your Discord account to vote.
            </AlertDescription>
          </div>
        </div>
        <Button onClick={handleConnect} disabled={isPending}>
          {isPending ? "Signing..." : "Connect"}
        </Button>
      </Alert>
    </div>
  );
};
