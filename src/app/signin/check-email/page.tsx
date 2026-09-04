import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We sent you a sign-in link. It expires in 10 minutes, and it only works
        in the browser you requested it from.
      </p>
      <Link
        href="/signin"
        className="mt-8 text-sm underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </div>
  );
}
