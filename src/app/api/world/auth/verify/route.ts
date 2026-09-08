import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { findOrCreateByAddress, readNonce, setSession, verifySignature } from "@/lib/world/session";
import { ADDRESS_RE } from "@/lib/world/queries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  address: z.string().regex(ADDRESS_RE),
  message: z.string().min(20).max(2000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export const POST = handle(async (req: NextRequest) => {
  const { address, message, signature } = await parseBody(req, schema);
  const nonce = readNonce(req);
  if (!nonce) throw new WorldError("Sign-in nonce missing or expired. Try again.", 401);
  if (!message.includes(`Nonce: ${nonce}`)) throw new WorldError("Message does not match the issued nonce.", 401);
  if (!message.toLowerCase().includes(`address: ${address.toLowerCase()}`)) throw new WorldError("Message does not match the address.", 401);

  const valid = await verifySignature(address as `0x${string}`, message, signature);
  if (!valid) throw new WorldError("Signature did not verify.", 401);

  const user = await findOrCreateByAddress(address);
  await prisma.user.update({ where: { id: user.id }, data: { lastWorldActive: new Date() } });

  const res = NextResponse.json({ address: user.address, handle: user.handle, nodeType: user.nodeType });
  setSession(res, address as `0x${string}`);
  return res;
});
