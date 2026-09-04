import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/session";
import { listCategories } from "@/lib/forum-queries";
import { AskForm } from "@/components/forum/ask-form";

export const metadata: Metadata = {
  title: "Ask a question",
  description: "Ask the Avalanche builder community a question.",
};

export default async function AskPage() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/forum/ask");

  const categories = await listCategories();

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">New topic</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Include what you tried and what happened. Topics with detail get answered;
        topics without it usually do not.
      </p>

      <AskForm
        categories={categories.map((category) => ({
          slug: category.slug,
          title: category.title,
        }))}
      />
    </div>
  );
}
