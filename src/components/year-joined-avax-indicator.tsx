"use client"

const years = [2021, 2022, 2023, 2024, 2025];

export function YearJoinedAvaxIndicator({ yearJoined, prices }: { yearJoined: number | null, prices: Record<number, number> }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between w-full max-w-lg gap-3">
                {years.map((year) => (
                    <div key={year} className="flex flex-col items-center">
                        <span className="text-lg font-semibold">{year}</span>
                        <div
                            className={`w-6 h-6 rounded-full border border-gray-500 ${yearJoined === year ? "bg-green-500" : "bg-gray-300"
                                }`}
                        />
                        <span className={`mt-2 text-sm ${yearJoined === year ? "text-green-500 font-bold" : "text-gray-600"}`}>
                            {`${prices[year]} AVAX` || 0}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}