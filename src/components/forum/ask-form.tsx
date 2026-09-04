"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { normalizeTags, TOPIC_KINDS } from "@/lib/forum";

export function AskForm({
  categories,
}: {
  categories: { slug: string; title: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [kind, setKind] = useState<(typeof TOPIC_KINDS)[number]>("question");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [pending, setPending] = useState(false);

  function addTag() {
    const next = normalizeTags([...tags, tagDraft]);
    setTags(next);
    setTagDraft("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    try {
      const response = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, categorySlug, kind, tags }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Could not post your question");
      }

      const { topic } = await response.json();
      router.push(`/forum/t/${topic.slug}`);
    } catch (error) {
      toast({
        title: "Question not posted",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <fieldset>
        <legend className="text-sm font-medium">What are you posting?</legend>
        <div className="mt-2 flex gap-2">
          {TOPIC_KINDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              aria-pressed={kind === option}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                kind === option
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {kind === "question"
            ? "Questions can be marked solved once someone answers them."
            : "Discussions stay open — no accepted answer."}
        </p>
      </fieldset>

      <div>
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          minLength={10}
          maxLength={160}
          placeholder="Why does my L1 validator fail to sync after a restart?"
          className="mt-2 text-base sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          required
          className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-foreground/30 sm:h-10 sm:text-sm"
        >
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-medium">
          Details
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          minLength={20}
          rows={12}
          placeholder={"What you are trying to do, what you tried, and the exact error you got."}
          className="mt-2 text-base sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="tags" className="text-sm font-medium">
          Tags <span className="font-normal text-muted-foreground">(up to 5)</span>
        </label>
        <div className="mt-2 flex gap-2">
          <Input
            id="tags"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="subnet-evm, avalanche-cli"
            disabled={tags.length >= 5}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={tagDraft.trim().length < 2 || tags.length >= 5}
          >
            Add
          </Button>
        </div>

        {tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((entry) => entry !== tag))}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-foreground/30"
                >
                  {tag}
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove tag</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end sm:gap-3">
        <Button type="button" variant="ghost" className="h-11 sm:h-10" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || title.trim().length < 10 || body.trim().length < 20}
          className="h-11 gap-2 sm:h-10"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Post {kind}
        </Button>
      </div>
    </form>
  );
}
