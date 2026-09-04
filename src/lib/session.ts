import { getServerSession } from "next-auth";
import { authOptions, canModerate } from "@/lib/auth";

export type SessionUser = {
  id: string;
  handle: string | null;
  role: string;
  reputation: number;
  address: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/** The signed-in user, or null. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as SessionUser) ?? null;
}

/**
 * The signed-in user, or a thrown 401. Route handlers catch this via
 * `respondToError` so authorisation reads as a single line at the top.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Sign in to continue");
  return user;
}

export async function requireModerator(): Promise<SessionUser> {
  const user = await requireUser();
  if (!canModerate(user.role)) {
    throw new HttpError(403, "Moderator access required");
  }
  return user;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}
