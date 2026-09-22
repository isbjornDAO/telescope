"use client";

import { useEffect, useState } from "react";
import { Activity, Fuel, TrendingUp, TrendingDown, ExternalLink, RefreshCw } from "lucide-react";
import type { AvaxPulseData } from "@/app/api/avax/pulse/route";

export function AvaxPulseWidget() {
  const [pulse, setPulse] = useState<AvaxPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPulse = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/avax/pulse");
      if (res.ok) {
        const data = await res.json();
        setPulse(data);
      }
    } catch {
      // Ignored, state preserved
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(() => fetchPulse(), 30000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = (pulse?.change24h ?? 0) >= 0;

  return (
    <div className="retro-box">
      <div className="retro-box-title justify-between px-3.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#E84142] shrink-0" />
          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            AVAX Pulse
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fetchPulse(true)}
            title="Refresh network pulse"
            className="retro-btn retro-btn-gray p-1 h-6 w-6 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {loading && !pulse ? (
          <div className="grid grid-cols-2 gap-2 animate-pulse">
            <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {/* AVAX Price Metric */}
              <div className="p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>AVAX Price</span>
                  <span className="text-[9px] text-zinc-400">USD</span>
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    ${pulse?.priceUsd?.toFixed(2) ?? "28.50"}
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                    )}
                    {isPositive ? "+" : ""}
                    {pulse?.change24h ? pulse.change24h.toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>

              {/* Gas Fee Metric */}
              <div className="p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-800/40">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-500" />
                    <span>C-Chain Gas</span>
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1 rounded ${
                      pulse?.gasStatus === "low"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {pulse?.gasStatus ?? "low"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {pulse?.gasPriceGwei ?? 25}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    nAVAX
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-bar: Network Links & Block */}
            <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Avalanche C-Chain</span>
                {pulse?.blockNumber && (
                  <span className="text-zinc-400 font-mono">
                    #{pulse.blockNumber.toLocaleString()}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://snowtrace.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E84142] hover:underline flex items-center gap-0.5 font-medium transition-colors"
                >
                  <span>Snowtrace</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
