import { NextRequest, NextResponse } from "next/server";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || "YourApiKeyToken";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Fetch first transaction from Snowtrace API
    const response = await fetch(
      `https://api.snowtrace.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${SNOWTRACE_API_KEY}`
    );

    const data = await response.json();

    if (data.status === "1" && data.result && data.result.length > 0) {
      const firstTx = data.result[0];
      const timestamp = parseInt(firstTx.timeStamp) * 1000; // Convert to milliseconds
      const date = new Date(timestamp);
      const year = date.getFullYear();

      // Determine "class" based on year
      const classOf = `Class of ${year}`;

      return NextResponse.json({
        firstTxHash: firstTx.hash,
        firstTxDate: date.toISOString(),
        timestamp,
        year,
        classOf,
        blockNumber: firstTx.blockNumber,
      });
    }

    return NextResponse.json(
      { error: "No transactions found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Failed to fetch first Avax transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch first transaction" },
      { status: 500 }
    );
  }
}
