import { prisma } from "@/lib/prisma";
import { findOrCreateUserByWallet } from "@/lib/user";

// Award XP and Coins for interacting (1 XP + 1 Coin per day via posting)
export async function awardPostXP(walletAddress: string): Promise<{ xpAwarded: boolean; newXp: number; newCoins: number; newLevel: number }> {
  try {
    // Ensure user exists
    const user = await findOrCreateUserByWallet(walletAddress);

    // Check if user already posted today (UTC)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Get last post date from posts table
    const lastPost = await prisma.post.findFirst({
      where: { walletAddress },
      orderBy: { createdAt: 'desc' }
    });

    if (lastPost) {
      const lastPostDate = new Date(lastPost.createdAt);
      const lastPostUTC = new Date(Date.UTC(lastPostDate.getUTCFullYear(), lastPostDate.getUTCMonth(), lastPostDate.getUTCDate()));

      // If already posted today, don't award XP
      if (lastPostUTC.getTime() === todayUTC.getTime()) {
        return { xpAwarded: false, newXp: user.xp, newCoins: user.coins, newLevel: user.level };
      }
    }

    // Award 1 XP and 1 Coin
    const newXp = user.xp + 1;
    const newCoins = user.coins + 1;
    let newLevel = user.level;

    // Check if leveled up (using the same logic as calculateLevel in xp.ts)
    if (newXp <= 10) {
      newLevel = 1;
    } else {
      newLevel = Math.floor((newXp - 11) / 30) + 2;
    }

    // Update user - increment both xp and coins
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        coins: newCoins,
        level: newLevel
      }
    });

    return { xpAwarded: true, newXp, newCoins, newLevel };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return { xpAwarded: false, newXp: 0, newCoins: 0, newLevel: 1 };
  }
}

