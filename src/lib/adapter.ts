import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";

import { handleFromIdentity } from "@/lib/handle";

/**
 * NextAuth's Prisma adapter, wrapped so a user is never written with a null
 * `handle`.
 *
 * MongoDB unique indexes treat null as a value, and Prisma writes an explicit
 * null for an absent optional scalar — so two users without a handle collide on
 * `User_handle_key`, and the signup simply fails. Generating the handle inside
 * `createUser`, rather than in a `createUser` event afterwards, closes the
 * window where that null exists at all.
 */
export function telescopeAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma);

  return {
    ...base,
    async createUser(user: AdapterUser) {
      const handle = await handleFromIdentity(
        { name: user.name, email: user.email },
        async (candidate) =>
          (await prisma.user.count({ where: { handle: candidate } })) > 0
      );

      // Cast: AdapterUser has no `handle`, but the column is ours.
      return base.createUser!({ ...user, handle } as AdapterUser & {
        handle: string;
      }) as Promise<AdapterUser>;
    },
  };
}
