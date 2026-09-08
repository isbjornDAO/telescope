import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

/** Set your home region. Anchoring still happens in a room. */
export const POST = handle(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const user = await requireWorldUser(req);
  const region = await prisma.region.findUnique({ where: { slug: params.slug } });
  if (!region) throw new WorldError("No such region.", 404);
  await prisma.user.update({ where: { id: user.id }, data: { regionId: region.id } });
  return ok({ region: { name: region.name, slug: region.slug } });
});
