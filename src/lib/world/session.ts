import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, type Address } from "viem";
import { avalanche } from "viem/chains";
import { prisma } from "@/lib/prisma";
import { hmacHex, randomToken, safeEqualHex } from "@/lib/world/crypto";
import { WorldError } from "@/lib/world/errors";

const ADMIN_DISCORD_IDS = ["808694504726724628", "1078316901953966132"] as const;

/**
 * World session: a wallet signs one message, the server sets a signed
 * httpOnly cookie. Every world action (vouch, vote, scout, enter) requires
 * it. The message proves control of the wallet and nothing else — no
 * identity is requested or stored. Smart-contract wallets verify via
 * ERC-1271 through the public client.
 */

export const WORLD_SESSION_COOKIE = "world_session";
export const WORLD_NONCE_COOKIE = "world_nonce";
const SESSION_DAYS = 30;
const NONCE_MINUTES = 10;

const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http("https://avalanche-c-chain-rpc.publicnode.com"),
});

export interface WorldSession {
  address: Address;
  iat: number;
  exp: number;
}

function sign(payload: string): string {
  return hmacHex("world-session", payload);
}

function encode(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

function decode<T>(s: string): T | null {
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function buildSignInMessage(address: Address, nonce: string, issuedAt: string): string {
  const host = process.env.NEXT_PUBLIC_APP_URL || "telescope";
  return [
    `Telescope wants you to sign in with your wallet.`,
    ``,
    `This signature proves you control this wallet. It does not reveal who you are.`,
    ``,
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Domain: ${host}`,
  ].join("\n");
}

export function issueNonce(res: NextResponse): string {
  const nonce = randomToken(16);
  const exp = Date.now() + NONCE_MINUTES * 60 * 1000;
  const payload = encode({ nonce, exp });
  res.cookies.set(WORLD_NONCE_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: NONCE_MINUTES * 60,
  });
  return nonce;
}

export function readNonce(req: NextRequest): string | null {
  const raw = req.cookies.get(WORLD_NONCE_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqualHex(sig, sign(payload))) return null;
  const data = decode<{ nonce: string; exp: number }>(payload);
  if (!data || data.exp < Date.now()) return null;
  return data.nonce;
}

export async function verifySignature(address: Address, message: string, signature: string) {
  try {
    return await publicClient.verifyMessage({ address, message, signature: signature as `0x${string}` });
  } catch {
    return false;
  }
}

export function setSession(res: NextResponse, address: Address) {
  const iat = Date.now();
  const exp = iat + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = encode({ address: address.toLowerCase() as Address, iat, exp } satisfies WorldSession);
  res.cookies.set(WORLD_SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  res.cookies.set(WORLD_NONCE_COOKIE, "", { path: "/", maxAge: 0 });
}

export function clearSession(res: NextResponse) {
  res.cookies.set(WORLD_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export function getWorldSession(req: NextRequest): WorldSession | null {
  const raw = req.cookies.get(WORLD_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqualHex(sig, sign(payload))) return null;
  const data = decode<WorldSession>(payload);
  if (!data || data.exp < Date.now()) return null;
  return data;
}

export { WorldError };

/** Resolve the signed-in wallet to a User row, creating it on first contact. */
export async function requireWorldUser(req: NextRequest) {
  const session = getWorldSession(req);
  if (!session) throw new WorldError("Sign in with your wallet to act in the world.", 401);
  const address = session.address;
  return findOrCreateByAddress(address);
}

/** Legacy rows were stored in whatever case the wallet reported; match case-insensitively before creating. */
export async function findOrCreateByAddress(address: string) {
  const lower = address.toLowerCase();
  const existing =
    (await prisma.user.findUnique({ where: { address: lower } })) ??
    (await prisma.user.findFirst({ where: { address: { equals: lower, mode: "insensitive" } } }));
  if (existing) return existing;
  return prisma.user.create({ data: { address: lower } });
}

export function worldAdminAddresses(): string[] {
  return (process.env.WORLD_ADMIN_ADDRESSES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isWorldAdmin(user: { address: string; discordId?: string | null }): boolean {
  if (worldAdminAddresses().includes(user.address.toLowerCase())) return true;
  if (user.discordId && (ADMIN_DISCORD_IDS as readonly string[]).includes(user.discordId)) return true;
  return false;
}

export async function requireWorldAdmin(req: NextRequest) {
  const user = await requireWorldUser(req);
  if (!isWorldAdmin(user)) throw new WorldError("World admin only.", 403);
  return user;
}
