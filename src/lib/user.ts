import { prisma } from "@/lib/prisma";

export async function findOrCreateUser(walletAddress: string) {
  let user = await prisma.user.findUnique({
    where: { address: walletAddress },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        address: walletAddress,
        // Add more fields here if necessary
      },
    });
  }

  return user;
} 