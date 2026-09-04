"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Mail, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Providers are rendered in the same order build.avax.network shows them, so
 * the flow feels continuous to someone arriving from there.
 */
export function SignInButtons({
  available,
  callbackUrl,
}: {
  available: string[];
  callbackUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const has = (id: string) => available.includes(id);
  const oauth = (id: string) => {
    setPending(id);
    signIn(id, { callbackUrl });
  };

  return (
    <div className="mt-8 flex flex-col gap-3">
      {has("github") ? (
        <Button
          variant="outline"
          className="h-11 w-full justify-center gap-2"
          onClick={() => oauth("github")}
          disabled={pending !== null}
        >
          {pending === "github" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Github className="h-4 w-4" />
          )}
          Continue with GitHub
        </Button>
      ) : null}

      {has("google") ? (
        <Button
          variant="outline"
          className="h-11 w-full justify-center gap-2"
          onClick={() => oauth("google")}
          disabled={pending !== null}
        >
          {pending === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleMark />
          )}
          Continue with Google
        </Button>
      ) : null}

      {has("discord") ? (
        <Button
          variant="outline"
          className="h-11 w-full justify-center gap-2"
          onClick={() => oauth("discord")}
          disabled={pending !== null}
        >
          {pending === "discord" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DiscordMark />
          )}
          Continue with Discord
        </Button>
      ) : null}

      {has("email") ? (
        <form
          className="mt-2 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPending("email");
            signIn("email", { email, callbackUrl });
          }}
        >
          <div className="relative flex items-center">
            <span className="h-px flex-1 bg-border" />
            <span className="px-3 text-xs uppercase tracking-wide text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11"
          />
          <Button
            type="submit"
            className="h-11 w-full gap-2"
            disabled={pending !== null || email.length === 0}
          >
            {pending === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Email me a sign-in link
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.8l-3.72-2.88c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.71v2.98A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.18a6.9 6.9 0 0 1 0-4.36V6.84H1.71a11.51 11.51 0 0 0 0 10.32l3.84-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.28 15.1.25 12 .25A11.5 11.5 0 0 0 1.71 6.84l3.84 2.98C6.46 7.1 9 4.75 12 4.75Z"
      />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
      <path d="M20.32 4.57A19.79 19.79 0 0 0 15.45 3c-.24.42-.5.99-.69 1.44a18.3 18.3 0 0 0-5.52 0C9.05 3.99 8.78 3.42 8.54 3a19.74 19.74 0 0 0-4.88 1.57C.55 9.2-.32 13.72.12 18.17a19.9 19.9 0 0 0 6.06 3.07c.49-.67.93-1.38 1.3-2.13-.71-.27-1.4-.6-2.04-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.13 0c.16.14.33.27.5.4-.65.39-1.33.72-2.05 1 .38.74.81 1.45 1.3 2.12a19.86 19.86 0 0 0 6.07-3.07c.51-5.15-.88-9.63-3.57-13.6ZM8.02 15.44c-1.18 0-2.16-1.09-2.16-2.42 0-1.34.95-2.43 2.16-2.43 1.22 0 2.19 1.1 2.17 2.43 0 1.33-.96 2.42-2.17 2.42Zm7.96 0c-1.19 0-2.16-1.09-2.16-2.42 0-1.34.95-2.43 2.16-2.43 1.21 0 2.18 1.1 2.16 2.43 0 1.33-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}
