import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || "YourApiKeyToken";

export async function GET() {
  try {
    // Get all users with addresses
    const users = await prisma.user.findMany({
      select: {
        address: true,
      },
      take: 1000, // Limit for performance
    });

    // Fetch first transaction data for all users (in batches to avoid rate limits)
    const classDistribution: Record<number, number> = {};
    let processedCount = 0;

    // Check if we have cached data in the database
    // For now, we'll return a mock distribution or fetch from external API
    // In production, you'd want to cache this data

    for (const user of users.slice(0, 100)) { // Process first 100 for demo
      try {
        const response = await fetch(
          `https://api.snowtrace.io/api?module=account&action=txlist&address=${user.address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${SNOWTRACE_API_KEY}`
        );

        const data = await response.json();

        if (data.status === "1" && data.result && data.result.length > 0) {
          const firstTx = data.result[0];
          const timestamp = parseInt(firstTx.timeStamp) * 1000;
          const year = new Date(timestamp).getFullYear();

          classDistribution[year] = (classDistribution[year] || 0) + 1;
        }

        processedCount++;

        // Add small delay to avoid rate limiting
        if (processedCount % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${user.address}:`, error);
      }
    }

    // Sort by year
    const sortedDistribution = Object.entries(classDistribution)
      .map(([year, count]) => ({
        year: parseInt(year),
        count,
      }))
      .sort((a, b) => a.year - b.year);

    return NextResponse.json({
      distribution: sortedDistribution,
      totalProcessed: processedCount,
      totalUsers: users.length,
    });
  } catch (error) {
    console.error("Failed to fetch class distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch class distribution" },
      { status: 500 }
    );
  }
}
