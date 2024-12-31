import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { useState, useEffect } from "react";

export function Countdown() {
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
              First Vote Epoch ended!
            </AlertTitle>
            <AlertDescription className="text-zinc-500">
              Epoch 1 ended on 31st December 2024, results will be announced on
              our Discord.
            </AlertDescription>
          </div>
        </div>
        <a
          href="https://discord.gg/K4z7xxFVGc"
          target="_blank"
          className="snow-button w-full md:w-auto mt-4 md:mt-0"
        >
          Join Discord
        </a>
      </Alert>
    </div>
  );
}
