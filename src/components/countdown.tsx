import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";

export function Countdown() {
  const calculateTimeLeft = () => {
    const targetDate = new Date("January 1, 2025 00:00:00").getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    let timeLeft = {
      days: "0",
      hours: "0",
      minutes: "0",
      seconds: "0",
    };

    if (difference > 0) {
      timeLeft = {
        days: String(Math.floor(difference / (1000 * 60 * 60 * 24))),
        hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)),
        minutes: String(Math.floor((difference / (1000 * 60)) % 60)),
        seconds: String(Math.floor((difference / 1000) % 60)),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Helper function to pad numbers with leading zeros
  const padNumber = (number: string) => number.padStart(2, "0");

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
              First Vote Epoch ends in {padNumber(timeLeft.days)}d{" "}
              {padNumber(timeLeft.hours)}h {padNumber(timeLeft.minutes)}m{" "}
              {padNumber(timeLeft.seconds)}s
            </AlertTitle>
            <AlertDescription className="text-zinc-500">
              Vote for your favourite project to immortalise it, join our
              Discord to learn more.
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
