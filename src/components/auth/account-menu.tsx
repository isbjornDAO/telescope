"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!session?.user) {
    return (
      <Button asChild size="sm">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  }

  const user = session.user;
  const label = user.name ?? user.handle ?? "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase">
              {label.slice(0, 1)}
            </span>
          )}
          <span className="hidden max-w-[10ch] truncate lg:inline">{label}</span>
          <span className="tabular-nums text-xs text-muted-foreground">
            {user.reputation}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={user.handle ? `/u/${user.handle}` : "/profile"} className="gap-2">
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          onSelect={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
