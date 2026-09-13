import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { useState, useEffect } from "react";

export function Countdown() {
  return (
    <div>
      <Alert
        variant="default"
        className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 py-4 flex flex-col md:flex-row justify-between items-center"
      >
        <div className="flex flex-row gap-2">
          <AlertCircle className="h-4 w-4 stroke-zinc-500 dark:stroke-zinc-400" />
          <div className="flex flex-col">
            <AlertTitle className="font-bold text-zinc-900 dark:text-zinc-100">Join the community!</AlertTitle>
            <AlertDescription className="text-zinc-500 dark:text-zinc-400">
              Discover trending avax projects and collect your season rewards in
              our server.
            </AlertDescription>
          </div>
        </div>
        <a
          href="https://discord.gg/K4z7xxFVGc"
          target="_blank"
          className="retro-btn-blue w-full md:w-auto mt-4 md:mt-0"
        >
          Join Discord
        </a>
      </Alert>
    </div>
  );
}
