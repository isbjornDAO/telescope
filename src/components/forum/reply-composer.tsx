"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function ReplyComposer({ slug }: { slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    try {
      const response = await fetch(`/api/forum/topics/${slug}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Could not post your reply");
      }

      setBody("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Reply not posted",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="reply-body" className="text-sm font-medium">
        Your reply
      </label>
      <Textarea
        id="reply-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        required
        minLength={2}
        placeholder="Share what worked, and why."
        className="mt-2 text-base sm:text-sm"
      />
      <div className="mt-3 flex justify-end">
        <Button
          type="submit"
          disabled={pending || body.trim().length < 2}
          className="h-11 w-full gap-2 sm:h-10 sm:w-auto"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Post reply
        </Button>
      </div>
    </form>
  );
}
