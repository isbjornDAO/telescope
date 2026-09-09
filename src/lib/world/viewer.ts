import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorldSession } from "@/lib/world/session";
import { type Viewer } from "@/lib/world/audience";

/**
 * Build the attribute bundle a reader can prove, from their session.
 *
 * This is the server's half of the access-control concept in
 * `audience.ts`. Nothing here is taken from the request body — a reader
 * cannot claim to be an Anchor, they either are one in the database or they
 * are not — and the result never leaves the server. The forum API uses it
 * to decide what to send; the client is told only what it is allowed to see
 * and, when refused, which attribute would have opened the door.
 *
 * A signed-out reader is a real case, not an error: they get an empty
 * bundle and can still read everything open to everyone, which is the
 * whole forum by default.
 */
export async function viewerFromRequest(req: NextRequest): Promise<Viewer> {
  const session = getWorldSession(req);
  if (!session) return {};

  const address = session.address.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { address },
    select: {
      address: true,
      nodeType: true,
      faction: { select: { slug: true } },
      region: { select: { slug: true } },
      crewMemberships: { where: { leftAt: null }, select: { crew: { select: { slug: true } } } },
    },
  });

  // A proven wallet with no world profile yet still owns what it wrote, so
  // keep the address even when there is no row to hang attributes on.
  if (!user) return { address };

  return {
    address: user.address,
    nodeType: user.nodeType,
    factionSlug: user.faction?.slug ?? null,
    regionSlug: user.region?.slug ?? null,
    crewSlugs: user.crewMemberships.map((m) => m.crew.slug),
  };
}
