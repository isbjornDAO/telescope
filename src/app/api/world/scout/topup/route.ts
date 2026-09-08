import { NextRequest } from "next/server";
import { z } from "zod";
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { avalanche } from "viem/chains";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody } from "@/lib/world/api";
import { WorldError } from "@/lib/world/errors";
import { requireWorldUser } from "@/lib/world/session";
import { SCOUT } from "@/lib/world/config";

export const dynamic = "force-dynamic";

const client = createPublicClient({ chain: avalanche, transport: http("https://avalanche-c-chain-rpc.publicnode.com") });
const transferEvent = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

/**
 * Capacity above the default budget, priced in USDC on the C-Chain (MVP).
 * Verify a USDC transfer from the signed-in wallet to the scout treasury
 * and credit queries. Moves to x402 on Iggy L1 when it is live.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireWorldUser(req);
  const treasury = process.env.SCOUT_TREASURY_ADDRESS?.toLowerCase();
  if (!treasury) throw new WorldError("Scout top-ups are not open yet.", 503);
  const { txHash } = await parseBody(req, z.object({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) }));
  const seen = await prisma.scoutTopUp.findUnique({ where: { txHash } });
  if (seen) throw new WorldError("That transaction was already credited.", 409);

  const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` }).catch(() => null);
  if (!receipt || receipt.status !== "success") throw new WorldError("Transaction not found or failed.", 404);
  const usdc = (process.env.USDC_ADDRESS ?? SCOUT.usdcAddress).toLowerCase() as Address;
  let paid = BigInt(0);
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdc) continue;
    try {
      const { decodeEventLog } = await import("viem");
      const decoded = decodeEventLog({ abi: [transferEvent], data: log.data, topics: log.topics });
      const args = decoded.args as { from: Address; to: Address; value: bigint };
      if (args.from.toLowerCase() === user.address.toLowerCase() && args.to.toLowerCase() === treasury) paid += args.value;
    } catch {
      // not a Transfer log
    }
  }
  if (paid === BigInt(0)) throw new WorldError("No USDC transfer from your wallet to the scout treasury in that transaction.", 422);
  const amountUsdc = Number(paid) / 1e6;
  const queries = Math.floor(amountUsdc / SCOUT.usdcPerQuery);
  if (queries <= 0) throw new WorldError(`Minimum top-up is ${SCOUT.usdcPerQuery} USDC.`, 422);
  await prisma.scoutTopUp.create({ data: { userId: user.id, txHash, amountUsdc, queries } });
  await prisma.user.update({ where: { id: user.id }, data: { scoutExtraQueries: { increment: queries } } });
  return ok({ credited: queries, amountUsdc }, { status: 201 });
});
