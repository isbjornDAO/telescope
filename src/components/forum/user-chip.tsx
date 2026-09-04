import Link from "next/link";
import Image from "next/image";

export type ChipUser = {
  id: string;
  name: string | null;
  handle: string | null;
  image: string | null;
  reputation: number;
};

/**
 * A named author with their reputation — the visible reward for answering, and
 * the reason reputation is worth tracking at all.
 */
export function UserChip({ user }: { user: ChipUser }) {
  const label = user.name ?? user.handle ?? "Builder";
  const href = user.handle ? `/u/${user.handle}` : undefined;

  const content = (
    <span className="inline-flex items-center gap-1.5">
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase"
        >
          {label.slice(0, 1)}
        </span>
      )}
      <span className="font-medium text-foreground/80">{label}</span>
      <span className="tabular-nums text-muted-foreground">{user.reputation}</span>
    </span>
  );

  return href ? (
    <Link href={href} className="hover:underline underline-offset-4">
      {content}
    </Link>
  ) : (
    content
  );
}
