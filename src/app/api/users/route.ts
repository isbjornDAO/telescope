import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUser } from "@/lib/user";
import { z } from "zod";
import { getXpForNextLevel } from "@/lib/xp";

// Schema to validate the query parameters
const userQuerySchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      walletAddress: searchParams.get("walletAddress"),
    };

    // Validate query parameters
    const { walletAddress } = userQuerySchema.parse(query);

    // Fetch or create the user
    const user = await findOrCreateUser(walletAddress);
    const xpForNextLevel = getXpForNextLevel(user.xp);

    return NextResponse.json(
      {
        ...user,
        xpForNextLevel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
