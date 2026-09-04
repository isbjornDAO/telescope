import { prisma } from "@/lib/prisma";
import { handleFromIdentity } from "@/lib/handle";

/**
 * Wallet lookups all go through the Wallet relation.
 *
 * A wallet address used to be a unique optional column on User, which does not
 * work on MongoDB: Prisma writes an explicit null when the field is absent, and
 * the unique index then rejects the second wallet-less user — every signup
 * after the first. Addresses now live in their own model, so the unique index
 * only ever sees real addresses.
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/** The user who has linked this wallet, or null. */
export async function findUserByWallet(address: string) {
  return prisma.user.findFirst({
    where: { wallets: { some: { address: normalizeAddress(address) } } },
  });
}

/**
 * Look up the user for a wallet, creating an account for it if none exists.
 *
 * This keeps the legacy wallet-first surfaces (rewards, collectables, XP)
 * working for people who have not signed in yet. Such an account has no email
 * until its owner signs in and links it.
 */
export async function findOrCreateUserByWallet(address: string) {
  const normalized = normalizeAddress(address);

  const existing = await findUserByWallet(normalized);
  if (existing) return existing;

  const short = `${normalized.slice(0, 6)}-${normalized.slice(-4)}`;
  const handle = await handleFromIdentity(
    { name: short },
    async (candidate) =>
      (await prisma.user.count({ where: { handle: candidate } })) > 0
  );

  return prisma.user.create({
    data: {
      name: `${normalized.slice(0, 6)}...${normalized.slice(-4)}`,
      handle,
      // `email` carries a unique index, and MongoDB rejects a second document
      // holding null — so a wallet-only account gets a deterministic
      // placeholder rather than no email. It is namespaced under a reserved
      // TLD, never sent to, and replaced by the real address when the owner
      // signs in and links this wallet.
      email: `wallet-${normalized}@telescope.invalid`,
      wallets: { create: { address: normalized, primary: true } },
    },
  });
}

/** Link a wallet to a signed-in account. Refuses one already claimed. */
export async function linkWalletToUser(userId: string, address: string) {
  const normalized = normalizeAddress(address);

  const owner = await prisma.wallet.findUnique({
    where: { address: normalized },
    select: { userId: true },
  });

  if (owner && owner.userId !== userId) {
    throw new Error("That wallet is already linked to another account");
  }
  if (owner) return;

  const alreadyHasOne = await prisma.wallet.count({ where: { userId } });

  await prisma.wallet.create({
    data: { address: normalized, userId, primary: alreadyHasOne === 0 },
  });
}

/** @deprecated Use findOrCreateUserByWallet. Kept for existing call sites. */
export const findOrCreateUser = findOrCreateUserByWallet;
