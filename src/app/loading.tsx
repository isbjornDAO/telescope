export default function Loading() {
  return (
    <div className="w-full space-y-4 pb-12 animate-pulse" aria-busy="true">
      {/* Retro breadcrumb bar skeleton */}
      <div className="retro-topic-header flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-14 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <div className="w-24 h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="w-20 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Main retro box skeleton */}
      <section className="retro-box overflow-hidden">
        <div className="retro-box-title px-4 py-2.5 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-300 dark:bg-zinc-700" />
          <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex min-h-14 items-center gap-3.5 px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/60"
            >
              <div className="w-12 h-6 rounded bg-zinc-200 dark:bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div
                  className="h-4 rounded bg-zinc-200 dark:bg-zinc-800"
                  style={{ width: `${120 + ((i * 41) % 150)}px` }}
                />
                <div
                  className="h-3 rounded bg-zinc-100 dark:bg-zinc-800/60"
                  style={{ width: `${180 + ((i * 53) % 200)}px` }}
                />
              </div>
              <div className="w-10 h-5 rounded bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
