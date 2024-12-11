import { prisma } from "@/lib/prisma";

export async function findOrCreateUser(walletAddress: string) {
  try {
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { address: walletAddress },
    });

    // If user doesn't exist, create new one
    if (!user) {
      user = await prisma.user.create({
        data: {
          address: walletAddress,
          // Don't set username field at all
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error in findOrCreateUser:", error);
    throw error;
  }
} 