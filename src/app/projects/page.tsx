"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { useAccount } from "wagmi";
import { useWorldMutation, useWorldQuery, worldFetch } from "@/hooks/use-world";
import { RetroBox } from "@/components/world/primitives";
import { BuildPageShell } from "@/components/build/build-page-shell";
import { WorldGate } from "@/components/world/world-gate";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  BUILDER_COLUMNS,
  COLUMN_LABELS,
  type BuilderCategory,
  type BuilderColumn,
  groupByColumn,
} from "@/lib/world/builder-board";

interface BoardProject {
  id: string;
  title: string;
  summary: string;
  category: BuilderCategory;
  categoryLabel: string;
  column: BuilderColumn;
  columnLabel: string;
  repoUrl: string | null;
  liveUrl: string | null;
  owner: { handle: string | null; address: string };
  crew: { name: string; slug: string } | null;
  updatedAt: string;
}

interface BoardPayload {
  projects: BoardProject[];
  categories: Array<{ id: BuilderCategory; label: string }>;
  columns: Array<{ id: BuilderColumn; label: string }>;
}

export default function ProjectsPage() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useWorldQuery<BoardPayload>(
    ["builder-projects"],
    "/api/world/builder-projects"
  );
  const [category, setCategory] = useState<BuilderCategory | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [formCategory, setFormCategory] = useState<BuilderCategory>("OTHER");
  const [formColumn, setFormColumn] = useState<BuilderColumn>("EXPLORING");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const create = useWorldMutation(async () => {
    await worldFetch("/api/world/builder-projects", {
      method: "POST",
      body: {
        title,
        summary,
        category: formCategory,
        column: formColumn,
        repoUrl: repoUrl || undefined,
        liveUrl: liveUrl || undefined,
      },
    });
    setTitle("");
    setSummary("");
    setRepoUrl("");
    setLiveUrl("");
    setShowForm(false);
    refetch();
  });

  const move = useWorldMutation(
    async (vars: { id: string; column: BuilderColumn }) => {
      await worldFetch(`/api/world/builder-projects/${vars.id}`, {
        method: "PATCH",
        body: { column: vars.column },
      });
      refetch();
    }
  );

  const columns = useMemo(() => {
    const cards = (data?.projects ?? []).map((p) => ({
      id: p.id,
      category: p.category,
      column: p.column,
    }));
    return groupByColumn(cards, category);
  }, [data?.projects, category]);

  const byId = useMemo(() => {
    const m = new Map<string, BoardProject>();
    for (const p of data?.projects ?? []) m.set(p.id, p);
    return m;
  }, [data?.projects]);

  return (
    <BuildPageShell
      eyebrow="Public builder board"
      title="Projects"
      description="What everyone is working on, at once. Not a hackathon application form — a giant board organised by category. Pin a card when you connect your wallet."
      actions={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="retro-btn-blue text-sm px-4 py-2 font-bold inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Pin a project"}
        </button>
      }
    >
        {showForm && (
          <WorldGate>
            <RetroBox title="New project card" iconColor="blue">
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate(undefined);
                }}
              >
                <div className="sm:col-span-2">
                  <Label htmlFor="bp-title">Title</Label>
                  <Input
                    id="bp-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="bp-summary">What are you building?</Label>
                  <Textarea
                    id="bp-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    required
                    rows={3}
                    minLength={10}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full h-9 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-2"
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as BuilderCategory)
                    }
                  >
                    {(data?.categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Column</Label>
                  <select
                    className="w-full h-9 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-2"
                    value={formColumn}
                    onChange={(e) =>
                      setFormColumn(e.target.value as BuilderColumn)
                    }
                  >
                    {BUILDER_COLUMNS.map((c) => (
                      <option key={c} value={c}>
                        {COLUMN_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="bp-repo">Repo URL (optional)</Label>
                  <Input
                    id="bp-repo"
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bp-live">Live URL (optional)</Label>
                  <Input
                    id="bp-live"
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                  />
                </div>
                {create.isError && (
                  <p className="sm:col-span-2 text-xs text-red-600 dark:text-red-400">
                    {(create.error as Error)?.message || "Failed"}
                  </p>
                )}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={create.isPending}
                    className="retro-btn-blue text-sm px-4 py-2 font-bold"
                  >
                    {create.isPending ? "Pinning…" : "Pin to board"}
                  </button>
                </div>
              </form>
            </RetroBox>
          </WorldGate>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors ${
              category === "ALL"
                ? "bg-sky-100 dark:bg-sky-950 border-sky-400 text-sky-800 dark:text-sky-200"
                : "border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            All categories
          </button>
          {(data?.categories ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors ${
                category === c.id
                  ? "bg-sky-100 dark:bg-sky-950 border-sky-400 text-sky-800 dark:text-sky-200"
                  : "border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Kanban */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {BUILDER_COLUMNS.map((c) => (
              <div
                key={c}
                className="h-48 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 min-w-0 lg:min-w-[900px]">
              {BUILDER_COLUMNS.map((col) => (
                <div
                  key={col}
                  className="retro-box flex flex-col min-h-[200px]"
                >
                  <div className="retro-box-title px-3 py-2 justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {COLUMN_LABELS[col]}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                      {columns[col].length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 flex-1">
                    {columns[col].length === 0 && (
                      <p className="text-[11px] text-muted-foreground px-1 py-4 text-center">
                        Empty
                      </p>
                    )}
                    {columns[col].map((card) => {
                      const p = byId.get(card.id);
                      if (!p) return null;
                      const isOwner =
                        address &&
                        p.owner.address.toLowerCase() === address.toLowerCase();
                      return (
                        <div
                          key={p.id}
                          className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 p-2.5 space-y-1.5 shadow-sm"
                        >
                          <div className="text-sm font-bold leading-snug">
                            {p.title}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-3">
                            {p.summary}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <span className="retro-profile-tag text-[10px]">
                              {p.categoryLabel}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {p.owner.handle ||
                              `${p.owner.address.slice(0, 6)}…${p.owner.address.slice(-4)}`}
                            {p.crew ? ` · ${p.crew.name}` : ""}
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {p.repoUrl && (
                              <a
                                href={p.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-0.5"
                              >
                                Repo <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                            {p.liveUrl && (
                              <a
                                href={p.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-0.5"
                              >
                                Live <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                          {isOwner && (
                            <select
                              className="w-full mt-1 h-7 text-[10px] rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                              value={p.column}
                              onChange={(e) =>
                                move.mutate({
                                  id: p.id,
                                  column: e.target.value as BuilderColumn,
                                })
                              }
                            >
                              {BUILDER_COLUMNS.map((c) => (
                                <option key={c} value={c}>
                                  Move to {COLUMN_LABELS[c]}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Shop / admin project directory stays under{" "}
          <Link href="/admin/projects" className="font-bold hover:underline">
            /admin/projects
          </Link>
          . This board is social — what builders are working on right now.
        </p>
    </BuildPageShell>
  );
}
