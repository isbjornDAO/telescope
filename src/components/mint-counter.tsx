"use client";

import { Input } from "./ui/input";
import { Minus, Plus } from "lucide-react";
import { Dispatch, SetStateAction, ChangeEvent } from "react";

interface MintCounterProps {
    value: number;
    setValue: Dispatch<SetStateAction<number>>;
    min?: number;
    max?: number;
}

export function MintCounter({
    value,
    setValue,
    min = 1,
    max = 10
}: MintCounterProps): JSX.Element {
    const handleIncrement = () => {
        setValue(prev => Math.min(prev + 1, max));
    };

    const handleDecrement = () => {
        setValue(prev => Math.max(prev - 1, min));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const newValue = parseInt(e.target.value, 10);
        if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            setValue(newValue);
        }
    };

    return (
        <div className="flex items-center space-x-2 mb-2">
            <button
                onClick={handleDecrement}
                disabled={value <= min}
                className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Minus className="w-4 h-4" />
            </button>

            <Input
                type="number"
                value={value}
                onChange={handleChange}
                min={min}
                max={max}
                className="w-16 text-center font-bold no-arrows"
            />

            <button
                onClick={handleIncrement}
                disabled={value >= max}
                className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}