import { prisma } from "@/lib/prisma";

export async function findOrCreateUser(walletAddress: string) {
  try {
    // Find user by walletAddress
    let user = await prisma.user.findUnique({
      where: { address: walletAddress },
    });

    // If user doesn't exist, you might choose to handle it differently
    // For example, return null or throw an error if you expect the user
    // to be created via Discord sign-in first
    if (!user) {
      throw new Error("User not found. Please sign in first.");
    }

    return user;
  } catch (error) {
    console.error("Error in findOrCreateUser:", error);
    throw error;
  }
} 