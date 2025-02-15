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
    min: propMin,
    max = 10
}: MintCounterProps): JSX.Element {
    // Determine effective min value based on max
    const effectiveMin = max === 0 ? 0 : (propMin ?? 1);

    // If max is 0, force the value to 0
    if (max === 0 && value !== 0) {
        setValue(0);
    }

    // If max > 0 and value is less than effectiveMin, set to effectiveMin
    if (max > 0 && value < effectiveMin) {
        setValue(effectiveMin);
    }

    const handleIncrement = () => {
        // Only allow increment if max is not 0
        if (max === 0) return;
        setValue(prev => Math.min(prev + 1, max));
    };

    const handleDecrement = () => {
        // Only allow decrement if max is not 0
        if (max === 0) return;
        setValue(prev => Math.max(prev - 1, effectiveMin));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        // If max is 0, don't allow any changes
        if (max === 0) return;

        const newValue = parseInt(e.target.value, 10);
        if (!isNaN(newValue) && newValue >= effectiveMin && newValue <= max) {
            setValue(newValue);
        }
    };

    return (
        <div className="flex items-center space-x-2 mb-[1px]">
            <button
                onClick={handleDecrement}
                disabled={value <= effectiveMin || max === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Minus className="w-4 h-4" />
            </button>

            <Input
                type="number"
                value={value}
                onChange={handleChange}
                min={effectiveMin}
                max={max}
                disabled={max === 0}
                className="w-16 text-center font-bold no-arrows"
            />

            <button
                onClick={handleIncrement}
                disabled={value >= max || max === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}