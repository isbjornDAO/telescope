/**
 * Handles are the public identity in the forum: @alice rather than 0x1a2b…
 * They are derived once at sign-up and are stable afterwards.
 */

const RESERVED = new Set([
  "admin",
  "moderator",
  "telescope",
  "avalanche",
  "avax",
  "support",
  "official",
  "api",
  "forum",
  "new",
  "me",
]);

export function slugifyHandle(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,23}$/.test(handle) && !RESERVED.has(handle);
}

/**
 * Build a unique handle from whatever identity the provider gave us, falling
 * back through name, email local-part, then a generic prefix. `taken` reports
 * whether a candidate already exists; numeric suffixes are appended until one
 * is free.
 */
export async function handleFromIdentity(
  identity: { name?: string | null; email?: string | null },
  taken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const seeds = [
    identity.name,
    identity.email?.split("@")[0],
    "builder",
  ].filter(Boolean) as string[];

  let base = "";
  for (const seed of seeds) {
    const slug = slugifyHandle(seed);
    if (slug.length >= 2) {
      base = slug;
      break;
    }
  }
  if (!base || RESERVED.has(base)) base = "builder";

  if (!(await taken(base))) return base;

  for (let suffix = 2; suffix < 1000; suffix++) {
    const candidate = `${base}-${suffix}`.slice(0, 32);
    if (!(await taken(candidate))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}
