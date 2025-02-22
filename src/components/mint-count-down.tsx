"use client";

import { useEffect, useState } from "react";

interface MintCountDownProps {
    end: number;
}

export function MintCountDown({ end }: MintCountDownProps): JSX.Element {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const now = Math.floor(Date.now() / 1000);
        const difference = Math.max(0, end - now);

        const hours = Math.floor(difference / 3600);
        const minutes = Math.floor((difference % 3600) / 60);
        const seconds = difference % 60;

        return { hours, minutes, seconds };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [end]);

    return (
        <div className="font-semibold text-[40px]">
            {timeLeft.hours}:{timeLeft.minutes.toString().padStart(2, "0")}:
            {timeLeft.seconds.toString().padStart(2, "0")}
        </div>
    );
}
