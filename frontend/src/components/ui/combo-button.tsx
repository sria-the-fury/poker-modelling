'use client';
import {Button} from "@/components/ui/button";
import React from "react";

export function BetInput() {
    const [betAmount, setBetAmount] = React.useState(20);

    const handleDecrement = () => {
        setBetAmount((prev) => Math.max(0, prev - 10));
    };

    const handleIncrement = () => {
        setBetAmount((prev) => prev + 10);
    };

    return (
        <div className="flex items-center">
            {/* Minus Button */}
            <Button
                variant="ghost" // Use ghost variant to remove default background
                size="icon"
                disabled={betAmount === 20 }
                onClick={handleDecrement}
                className="
    rounded-full w-8 h-8
    bg-teal-400 text-black
    hover:bg-teal-500
    border-none
    -mr-6 // Overlap with the central part
    z-10 // Bring to front
    "
            >
                <span className="text font-bold">-</span>
            </Button>

            {/* Central Display */}
            <div
                className="
    bg-black text-white
    px-3 py-1.5
    rounded-full
    min-w-[100px]
    text-center
    "
            >
                Bet {betAmount}
            </div>

            {/* Plus Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleIncrement}
                className="
    rounded-full w-8 h-8
    bg-pink-500 text-white
    hover:bg-pink-600
    border-none
    -ml-6 // Overlap with the central part
    z-10 // Bring to front
    "
            >
                <span className="text font-bold">+</span>
            </Button>
        </div>
    );
}

export function RaiseInput() {
    const [raiseAmount, setRaiseAmount] = React.useState(40);

    const handleDecrement = () => {
        setRaiseAmount((prev) => Math.max(0, prev - 20));
    };

    const handleIncrement = () => {
        setRaiseAmount((prev) => prev + 20);
    };

    return (
        <div className="flex items-center">
            {/* Minus Button */}
            <Button
                variant="ghost" // Use ghost variant to remove default background
                size="icon"
                disabled={raiseAmount === 40}
                onClick={handleDecrement}
                className="
    rounded-full w-8 h-8
    bg-teal-400 text-black
    hover:bg-teal-500
    border-none
    -mr-6 // Overlap with the central part
    z-10 // Bring to front
    "
            >
                <span className="text font-bold">-</span>
            </Button>

            {/* Central Display */}
            <div
                className="
    bg-black text-white
    px-3 py-1.5
    rounded-full
    min-w-[120px]
    text-center
    "
            >
                Raise {raiseAmount}
            </div>

            {/* Plus Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleIncrement}
                className="
    rounded-full w-8 h-8
    bg-pink-500 text-white
    hover:bg-pink-600
    border-none
    -ml-6 // Overlap with the central part
    z-10 // Bring to front
    "
            >
                <span className="text font-bold">+</span>
            </Button>
        </div>
    );
}