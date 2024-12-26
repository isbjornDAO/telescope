"use client";

import { useSignMessage } from "wagmi";
import { useAccount } from "wagmi";
import { signIn, useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export function ConnectDiscordAlert() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    const connectDiscordAccount = async () => {
      console.log("🔄 Checking for pending Discord connection...");
      const pendingConnection = localStorage.getItem(
        "pendingDiscordConnection"
      );
      console.log("📦 Pending connection data:", pendingConnection);

      if (pendingConnection && session?.discordUser?.id) {
        console.log("🎮 Discord session found:", {
          discordUser: session.discordUser,
          pendingConnection: JSON.parse(pendingConnection),
        });

        try {
          const { signature, address, message } = JSON.parse(pendingConnection);
          console.log("🔐 Attempting to connect Discord with:", {
            address,
            discordId: session.discordUser.id,
            messageLength: message.length,
            signatureLength: signature.length,
          });

          // Connect the Discord account
          const response = await fetch("/api/connect-discord", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              signature,
              address,
              message,
            }),
          });

          if (!response.ok) {
            localStorage.removeItem("pendingDiscordConnection");
            const errorData = await response.json();
            console.error("❌ Discord connection failed:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
            });
            throw new Error("Failed to connect Discord account");
          }

          const result = await response.json();
          console.log("✅ Discord connection successful:", result);

          // Clear the stored data
          localStorage.removeItem("pendingDiscordConnection");
          console.log("🗑️ Cleared pending connection data");

          toast({
            title: "Success",
            description: "Discord account connected successfully!",
          });
        } catch (error) {
          console.error("❌ Error in Discord connection flow:", error);
          toast({
            title: "Error",
            description: "Failed to connect Discord account. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log("ℹ️ No pending connection or Discord session:", {
          hasPendingConnection: !!pendingConnection,
          hasDiscordSession: !!session?.discordUser?.id,
        });
      }
    };

    connectDiscordAccount();
  }, [session, toast]);

  const handleConnectDiscord = async () => {
    console.log("🚀 Starting Discord connection flow...");
    try {
      // Create a message to sign that includes the wallet address
      const message = `Connect Discord Account\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      console.log("📝 Created message to sign:", message);

      console.log("🔑 Requesting wallet signature...");
      // Get the signature
      const signature = await signMessageAsync({ message });
      console.log("✍️ Got signature:", signature.slice(0, 20) + "...");

      // Store the wallet data in localStorage
      const walletData = { signature, address, message };
      localStorage.setItem(
        "pendingDiscordConnection",
        JSON.stringify(walletData)
      );
      console.log("💾 Stored wallet data in localStorage");

      // Redirect to Discord OAuth
      console.log("🎮 Redirecting to Discord OAuth...");
      await signIn("discord", {
        callbackUrl: "/profile",
      });
    } catch (error) {
      console.error("❌ Error in Discord connection initiation:", error);
      toast({
        title: "Error",
        description: "Failed to sign the message. Please try again.",
        variant: "destructive",
      });

      // Type guard to check if error is an object with response property
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as { status: number; json: () => Promise<{ connectedWallet?: string }> };
        if (errorResponse.status === 400) {
          const data = await errorResponse.json();
          if (data.connectedWallet) {
            toast({
              title: "Error",
              description: "Discord account already connected.",
              variant: "destructive",
            });
          }
        }
      }
    }
  };

  return (
    <div>
      <Alert
        variant="default"
        className="bg-white border-zinc-300 py-4 flex flex-col md:flex-row justify-between items-center"
      >
        <div className="flex flex-row gap-2">
          <AlertCircle className="h-4 w-4 stroke-zinc-500" />
          <div className="flex flex-col">
            <AlertTitle className="font-bold">
              Connect your Discord account
            </AlertTitle>
            <AlertDescription className="text-zinc-500">
              Link your Discord account to be able to vote.
            </AlertDescription>
          </div>
        </div>
        <Button onClick={handleConnectDiscord} className="snow-button">
          Connect Discord
        </Button>
      </Alert>
    </div>
  );
}
