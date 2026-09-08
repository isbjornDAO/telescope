import { NextRequest } from "next/server";
import { z } from "zod";
import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";

export const dynamic = "force-dynamic";

const client = createPublicClient({ chain: avalanche, transport: http("https://avalanche-c-chain-rpc.publicnode.com") });

/**
 * ATTEST (MVP settlement on C-Chain): the voucher sends a zero-value
 * transaction to themselves carrying the vouch commitment as calldata.
 * We verify sender and calldata on-chain and record the tx. Migrates to
 * Iggy L1 when it is live.
 */
export const POST = handle(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireWorldUser(req);
  const { txHash } = await parseBody(req, z.object({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) }));
  const v = await prisma.vouch.findUnique({ where: { id: params.id } });
  if (!v) throw new WorldError("No such vouch.", 404);
  if (v.fromUserId !== user.id && v.toUserId !== user.id) throw new WorldError("Not your vouch.", 403);
  if (v.onchainTx) return ok({ onchainTx: v.onchainTx, already: true });

  const tx = await client.getTransaction({ hash: txHash as `0x${string}` }).catch(() => null);
  if (!tx) throw new WorldError("Transaction not found on the C-Chain yet.", 404);
  if (tx.from.toLowerCase() !== user.address.toLowerCase()) throw new WorldError("That transaction was not sent by your wallet.", 422);
  if (tx.input.toLowerCase() !== v.commitment.toLowerCase()) throw new WorldError("Calldata does not carry this vouch's commitment.", 422);

  await prisma.vouch.update({ where: { id: v.id }, data: { onchainTx: txHash } });
  await prisma.scoutLog.create({ data: { type: "ATTEST", fromUserId: user.id, toUserId: v.toUserId, payloadHash: v.commitment, paid: true } });
  return ok({ onchainTx: txHash });
});
