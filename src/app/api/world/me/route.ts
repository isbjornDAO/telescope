import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, noStore } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { HANDLE_RE, privateProfile, publicProfile } from "@/lib/world/queries";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const [pub, priv] = await Promise.all([publicProfile(user), privateProfile(user)]);
  return ok({ ...pub, ...priv }, noStore);
});

const patchSchema = z.object({
  handle: z.string().regex(HANDLE_RE, "3–24 lowercase letters, digits or underscores").optional(),
  bio: z.string().max(280).nullable().optional(),
  regionSlug: z.string().nullable().optional(),
});

export const PATCH = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const body = await parseBody(req, patchSchema);
  const data: { handle?: string; bio?: string | null; regionId?: string | null } = {};

  if (body.handle !== undefined && body.handle !== user.handle) {
    const taken = await prisma.user.findUnique({ where: { handle: body.handle } });
    if (taken) throw new WorldError("That name is taken. Choose another.", 409);
    data.handle = body.handle;
  }
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.regionSlug !== undefined) {
    if (body.regionSlug === null) data.regionId = null;
    else {
      const region = await prisma.region.findUnique({ where: { slug: body.regionSlug } });
      if (!region) throw new WorldError("No such region.", 404);
      data.regionId = region.id;
    }
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return ok({ handle: updated.handle, bio: updated.bio, regionId: updated.regionId });
});
