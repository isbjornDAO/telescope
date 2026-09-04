import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProviders } from "next-auth/react";

import { currentUser } from "@/lib/session";
import { SignInButtons } from "@/components/auth/sign-in-buttons";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Telescope with the same account you use on build.avax.network.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  if (await currentUser()) redirect(searchParams.callbackUrl ?? "/");

  const providers = (await getProviders()) ?? {};
  const available = Object.keys(providers);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Sign in to Telescope
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use the same account you use on{" "}
        <a
          href="https://build.avax.network"
          className="font-medium underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          build.avax.network
        </a>{" "}
        and you will land on the same profile here.
      </p>

      {searchParams.error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {errorMessage(searchParams.error)}
        </p>
      ) : null}

      <SignInButtons
        available={available}
        callbackUrl={searchParams.callbackUrl ?? "/"}
      />

      {available.length === 0 ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          No sign-in provider is configured. Set the GitHub, Google or email
          credentials described in <code>.env.example</code>.
        </p>
      ) : null}

      <p className="mt-8 text-xs text-muted-foreground">
        A wallet is not required to sign in. You can link one later from your
        profile to receive bounty payouts.{" "}
        <Link href="/" className="underline underline-offset-4">
          Back to Telescope
        </Link>
      </p>
    </div>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "OAuthAccountNotLinked":
      return "That email is already registered with a different provider. Sign in the way you did the first time, then link the other provider from your profile.";
    case "Verification":
      return "That sign-in link has expired. Request a new one.";
    default:
      return "Sign-in failed. Please try again.";
  }
}
