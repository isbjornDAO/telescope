// In src/app/api/users/associate-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const associateSchema = z.object({
  userId: z.string(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, walletAddress } = associateSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        address: walletAddress,
      },
    });

    return NextResponse.json(
      { message: "Wallet address associated successfully.", user },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0;
