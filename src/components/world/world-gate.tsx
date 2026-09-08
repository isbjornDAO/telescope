"use client";

import { type ReactNode } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorldSession } from "@/hooks/use-world";
import { Frost, LoadingBlock } from "@/components/world/primitives";

/** Wraps anything that acts in the world. One signature, then a cookie. */
export function WorldGate({ children, message, compact }: { children: ReactNode; message?: ReactNode; compact?: boolean }) {
  const s = useWorldSession();
  if (s.isLoading) return compact ? null : <LoadingBlock />;
  if (!s.isConnected) {
    return (
      <Frost className="text-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-sky-500 mt-0.5" />
          <div>
            <p className="font-semibold">Connect a wallet to act in the world.</p>
            <p className="text-muted-foreground">Use the button in the top right. A profile is a name you chose, not a legal identity.</p>
          </div>
        </div>
      </Frost>
    );
  }
  if (!s.isSignedIn) {
    return (
      <Frost className="text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-sky-500 mt-0.5" />
            <div>
              <p className="font-semibold">{message ?? "Sign in to the world."}</p>
              <p className="text-muted-foreground">
                {s.mismatch ? "Your wallet changed. Sign in again with this one." : "One signature. It proves you control the wallet and reveals nothing else."}
              </p>
              {s.signIn.error && <p className="text-red-600 mt-1">{(s.signIn.error as Error).message}</p>}
            </div>
          </div>
          <Button className="snow-button" onClick={() => s.signIn.mutate()} disabled={s.signIn.isPending}>
            {s.signIn.isPending ? "Waiting for signature…" : "Sign in"}
          </Button>
        </div>
      </Frost>
    );
  }
  return <>{children}</>;
}

export function SignInInline() {
  const s = useWorldSession();
  if (!s.isConnected || s.isSignedIn) return null;
  return (
    <Button size="sm" className="snow-button" onClick={() => s.signIn.mutate()} disabled={s.signIn.isPending}>
      {s.signIn.isPending ? "Signing…" : "Sign in to the world"}
    </Button>
  );
}
