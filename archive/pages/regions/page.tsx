"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useWorldQuery } from "@/hooks/use-world";
import { WorldPage, Frost, Empty, LoadingBlock, ErrorBlock, Weight } from "@/components/world/primitives";
import { ArcticMap, type MapRegion } from "@/components/world/arctic-map";

interface Region extends MapRegion { description: string | null; country: string | null; isChapter: boolean; runsNode: boolean }

export default function RegionsPage() {
  const { data, isLoading, error } = useWorldQuery<Region[]>(["regions"], "/api/world/regions");
  return (
    <WorldPage title="Regions" subtitle="A region is a local community that has physically met: a Team1 chapter or an in-person network. Regions anchor the trust graph and solve local problems. Telescope is the network that connects them.">
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}
      {data && data.length === 0 && <Empty>No regions yet.</Empty>}
      {data && data.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <Frost className="p-3"><ArcticMap regions={data} roaming={4} /></Frost>
          <div className="space-y-2">
            {data.map((r) => (
              <Link key={r.slug} href={`/regions/${r.slug}`} className="frost rounded-xl p-3 flex items-start justify-between gap-3 hover:border-sky-400 transition-colors">
                <div className="min-w-0">
                  <div className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-500" />{r.name}{r.isChapter && <span className="text-[10px] rounded bg-sky-100 dark:bg-sky-900/40 px-1.5">Team1</span>}{r.runsNode && <span className="text-[10px] rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5">runs a node</span>}</div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.description ?? r.country ?? ""}</p>
                  <div className="text-xs text-muted-foreground mt-1">{r.nodes} nodes · {r.anchors} anchors · {r.crews} crews</div>
                </div>
                <Weight value={r.standing} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </WorldPage>
  );
}
