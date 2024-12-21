"use client";

import { useEffect } from "react";
import { Address } from "viem";
import { useSignMessage } from "wagmi";

const SignMessage = ({
  message,
  discordId,
  walletAddress,
}: {
  message: string;
  discordId: string;
  walletAddress: Address;
}) => {
  const { data, isError, isPending, isSuccess, signMessage } = useSignMessage();

  useEffect(() => {
    if (isSuccess) {
      // Make an API call to save the user data
      //   fetch("/api/user/create", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       discordId,
      //       walletAddress,
      //     }),
      //   })
      console.log("isSuccess", isSuccess);
      console.log("discordId", discordId);
      console.log("walletAddress", walletAddress);
      //   .then((response) => response.json())
      //   .then((data) => {
      //     console.log("User data saved:", data);
      //   })
      // .catch((error) => {
      //   console.error("Error saving user data:", error);
      // });
    }
  }, [isSuccess, discordId, walletAddress]);

  const handleSign = () => {
    signMessage({ message });
  };

  return (
    <div>
      <button onClick={handleSign} disabled={isPending}>
        {isPending ? "Signing..." : "Sign Message"}
      </button>
      {isSuccess && <p>Message signed successfully!</p>}
      {isError && <p>Error signing message.</p>}
    </div>
  );
};

export default SignMessage;
