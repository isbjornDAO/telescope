"use client";

import { useMemo } from "react";

interface ProgressBarProps {
    progress: number;
    base: number;
}

export const ProgressBar = ({ progress, base }: ProgressBarProps) => {
    const percentage = useMemo(() => (progress / base) * 100, [progress, base]);

    return (
        <div className="w-[300px] bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
                className="bg-blue-400 h-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};
