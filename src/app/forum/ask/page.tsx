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
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Ask a question</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Include what you tried and what happened. Questions with detail get
        answered; questions without it usually do not.
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
