import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface AvaxPulseData {
  priceUsd: number;
  change24h: number;
  gasPriceGwei: number;
  gasStatus: "low" | "normal" | "high";
  blockNumber?: number;
  updatedAt: string;
}

const FALLBACK_PULSE: AvaxPulseData = {
  priceUsd: 28.5,
  change24h: 3.25,
  gasPriceGwei: 25,
  gasStatus: "low",
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  let priceUsd = FALLBACK_PULSE.priceUsd;
  let change24h = FALLBACK_PULSE.change24h;
  let gasPriceGwei = FALLBACK_PULSE.gasPriceGwei;
  let blockNumber: number | undefined;

  // 1. Fetch live gas & block from Avalanche C-Chain public RPC
  try {
    const rpcController = new AbortController();
    const rpcTimeout = setTimeout(() => rpcController.abort(), 3500);

    const rpcRes = await fetch("https://api.avax.network/ext/bc/C/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        { jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 1 },
        { jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 2 },
      ]),
      signal: rpcController.signal,
      next: { revalidate: 15 },
    });
    clearTimeout(rpcTimeout);

    if (rpcRes.ok) {
      const results = await rpcRes.json();
      if (Array.isArray(results)) {
        const gasResult = results.find((r) => r.id === 1);
        const blockResult = results.find((r) => r.id === 2);

        if (gasResult?.result) {
          const wei = BigInt(gasResult.result);
          // 1 nAVAX = 1 Gwei = 10^9 wei
          gasPriceGwei = Math.max(1, Math.round(Number(wei) / 1e9));
        }
        if (blockResult?.result) {
          blockNumber = parseInt(blockResult.result, 16);
        }
      }
    }
  } catch (err) {
    // Non-fatal, use fallback gas
  }

  // 2. Fetch AVAX price from CoinGecko / fallback
  try {
    const priceController = new AbortController();
    const priceTimeout = setTimeout(() => priceController.abort(), 3500);

    const priceRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true",
      {
        signal: priceController.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      }
    );
    clearTimeout(priceTimeout);

    if (priceRes.ok) {
      const data = await priceRes.json();
      if (data["avalanche-2"]?.usd) {
        priceUsd = Number(data["avalanche-2"].usd);
        change24h = Number(data["avalanche-2"].usd_24h_change ?? 0);
      }
    }
  } catch (err) {
    // Non-fatal, use fallback price
  }

  const gasStatus: "low" | "normal" | "high" =
    gasPriceGwei <= 27 ? "low" : gasPriceGwei <= 50 ? "normal" : "high";

  const responseData: AvaxPulseData = {
    priceUsd,
    change24h,
    gasPriceGwei,
    gasStatus,
    blockNumber,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(responseData);
}
