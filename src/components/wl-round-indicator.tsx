"use client"

const rounds = [1, 2, 3, 4, 5];

export function WLRoundIndicator({ currentPhase, prices }: { currentPhase: number, prices: Record<number, number> }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full max-w-lg gap-3">
                {rounds.map((round) => {
                    if (round === 1) {
                        return (<div key={round} className="flex flex-col items-center">
                            <span className="text-lg font-semibold">{"WL"}</span>
                            <div
                                className={`w-6 h-6 rounded-full border border-gray-500 ${currentPhase === round ? "bg-green-500" : currentPhase > round ? "bg-red-500" : "bg-zinc-500"
                                    }`}
                            />
                            <span className={`mt-2 text-sm ${currentPhase === round ? "text-green-500 font-bold" : "text-gray-600"}`}>
                                {`${prices[round]} AVAX` || 0}
                            </span>
                        </div>);
                    }
                    return (
                        <div key={round} className="flex flex-col items-center">
                            <span className="text-lg font-semibold">{`P${round - 1}`}</span>
                            <div
                                className={`w-6 h-6 rounded-full border border-gray-500 ${currentPhase === round ? "bg-green-500" : currentPhase > round ? "bg-red-500" : "bg-zinc-500"
                                    }`}
                            />
                            <span className={`mt-2 text-sm ${currentPhase === round ? "text-green-500 font-bold" : "text-gray-600"}`}>
                                {`${prices[round]} AVAX` || 0}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}