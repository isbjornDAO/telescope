import { prisma } from "@/lib/prisma";

/**
 * Award a collectable to a user
 * @param userId - The user's database ID
 * @param collectableId - The collectable's ID (e.g., "snowdog")
 * @returns The UserCollectable record or null if user already has it
 */
export async function awardCollectable(userId: string, collectableId: string) {
  try {
    // Find the collectable
    const collectable = await prisma.collectable.findUnique({
      where: { collectableId }
    });

    if (!collectable) {
      console.error(`Collectable ${collectableId} not found`);
      return null;
    }

    // Check if user already has this collectable
    const existing = await prisma.userCollectable.findUnique({
      where: {
        userId_collectableId: {
          userId,
          collectableId: collectable.id
        }
      }
    });

    if (existing) {
      console.log(`User ${userId} already has ${collectableId}`);
      return null;
    }

    // Award the collectable
    const userCollectable = await prisma.userCollectable.create({
      data: {
        userId,
        collectableId: collectable.id
      },
      include: {
        collectable: true
      }
    });

    console.log(`✅ Awarded ${collectable.name} to user ${userId}`);
    return userCollectable;
  } catch (error) {
    console.error('Error awarding collectable:', error);
    return null;
  }
}

/**
 * Check if a user has a specific collectable
 * @param userId - The user's database ID
 * @param collectableId - The collectable's ID (e.g., "snowdog")
 * @returns Boolean indicating if user has the collectable
 */
export async function hasCollectable(userId: string, collectableId: string): Promise<boolean> {
  try {
    const collectable = await prisma.collectable.findUnique({
      where: { collectableId }
    });

    if (!collectable) return false;

    const userCollectable = await prisma.userCollectable.findUnique({
      where: {
        userId_collectableId: {
          userId,
          collectableId: collectable.id
        }
      }
    });

    return !!userCollectable;
  } catch (error) {
    console.error('Error checking collectable:', error);
    return false;
  }
}

/**
 * Get all collectables owned by a user
 * @param userId - The user's database ID
 * @returns Array of user's collectables with details
 */
export async function getUserCollectables(userId: string) {
  try {
    const collectables = await prisma.userCollectable.findMany({
      where: { userId },
      include: {
        collectable: true
      },
      orderBy: {
        acquiredAt: 'desc'
      }
    });

    return collectables;
  } catch (error) {
    console.error('Error fetching user collectables:', error);
    return [];
  }
}

/**
 * Get all available collectables
 * @returns Array of all collectables
 */
export async function getAllCollectables() {
  try {
    return await prisma.collectable.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching collectables:', error);
    return [];
  }
}

/**
 * Check and award achievement-based collectables
 * @param userId - The user's database ID
 */
export async function checkAndAwardAchievements(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        votes: true,
        votesS1: true
      }
    });

    if (!user) return;

    const totalVotes = user.votes.length + user.votesS1.length;

    // Award Vote Master for 100 votes
    if (totalVotes >= 100) {
      await awardCollectable(userId, 'vote_master');
    }

    // Award Streak Champion for 30-day streak
    if (user.streak >= 30) {
      await awardCollectable(userId, 'streak_champion');
    }

    // Award Early Adopter for users who joined before a certain date
    const earlyAdopterDate = new Date('2024-11-01');
    if (user.createdAt < earlyAdopterDate) {
      await awardCollectable(userId, 'early_adopter');
    }

  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

/**
 * Award a collectable to a user by their wallet address
 * @param address - The user's wallet address
 * @param collectableId - The collectable's ID (e.g., "snowdog")
 * @returns The UserCollectable record or null
 */
export async function awardCollectableByAddress(address: string, collectableId: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { wallets: { some: { address: address.toLowerCase() } } }
    });

    if (!user) {
      console.error(`User with address ${address} not found`);
      return null;
    }

    return await awardCollectable(user.id, collectableId);
  } catch (error) {
    console.error('Error awarding collectable by address:', error);
    return null;
  }
}

/**
 * Award a collectable to a user by their Discord ID
 * @param discordId - The user's Discord ID
 * @param collectableId - The collectable's ID (e.g., "snowdog")
 * @returns The UserCollectable record or null
 */
export async function awardCollectableByDiscordId(discordId: string, collectableId: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { discordId }
    });

    if (!user) {
      console.error(`User with Discord ID ${discordId} not found`);
      return null;
    }

    return await awardCollectable(user.id, collectableId);
  } catch (error) {
    console.error('Error awarding collectable by Discord ID:', error);
    return null;
  }
}
