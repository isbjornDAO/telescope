"use client";


/**
 * Boards list skeleton for Forum Overview and /forum page
 */
export function BoardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden dark:divide-zinc-800">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex min-h-14 items-center gap-3.5 px-4 py-3.5 animate-pulse"
        >
          {/* Badge skeleton */}
          <div className="w-16 sm:w-20 h-7 rounded bg-zinc-200 dark:bg-zinc-800 shrink-0" />

          {/* Title & description skeleton */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div
              className="h-4 rounded bg-zinc-200 dark:bg-zinc-800"
              style={{ width: `${100 + ((i * 37) % 80)}px` }}
            />
            <div
              className="h-3 rounded bg-zinc-100 dark:bg-zinc-800/60"
              style={{ width: `${180 + ((i * 43) % 120)}px` }}
            />
          </div>

          {/* Count badge skeleton */}
          <div className="w-10 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Thread card grid skeleton for /forum/[boardName]
 */
export function ThreadCardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="retro-box p-3 h-full flex flex-col animate-pulse"
        >
          {/* Thread Image thumbnail skeleton */}
          <div className="w-full aspect-square rounded bg-zinc-200 dark:bg-zinc-800 mb-2 border border-zinc-200 dark:border-zinc-700/60" />

          {/* Thread info */}
          <div className="space-y-2 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div
                className="h-3.5 rounded bg-zinc-200 dark:bg-zinc-800"
                style={{ width: `${75 + ((i * 19) % 25)}%` }}
              />
              <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800/60 w-11/12" />
              <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800/60 w-3/4" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="w-14 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-10 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Full thread detail skeleton for /forum/thread/[threadId]
 */
export function ThreadDetailSkeleton() {
  return (
    <div className="w-full space-y-4 pb-16 animate-pulse">
      {/* Retro breadcrumb bar skeleton */}
      <div className="retro-topic-header flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-12 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-zinc-400">/</span>
          <div className="w-14 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-zinc-400">/</span>
          <div className="w-32 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-16 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-16 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Post cards stream skeleton (unified header + 2-column retro layout) */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="retro-post-card">
            {/* Unified Top Header Bar Skeleton */}
            <div className="retro-post-header">
              <div className="retro-author-header">
                <div className="w-24 h-4 rounded bg-zinc-300 dark:bg-zinc-700" />
              </div>
              <div className="retro-post-infobar">
                <div className="w-36 h-3.5 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-6 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="w-16 h-6 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="w-20 h-6 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            </div>

            {/* Main 2-Column Body Skeleton */}
            <div className="retro-post-main">
              {/* Left author sidebar skeleton */}
              <div className="retro-post-author">
                <div className="retro-author-body">
                  <div className="w-[104px] h-[104px] rounded-md bg-zinc-300 dark:bg-zinc-700" />
                  <div className="w-16 h-4 rounded bg-zinc-300 dark:bg-zinc-700" />
                  {/* Tarja skeleton */}
                  <div className="w-36 h-8 rounded bg-zinc-300 dark:bg-zinc-700" />
                  <div className="w-20 h-3 rounded bg-zinc-300 dark:bg-zinc-700" />
                  {/* Badges rack skeleton */}
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                </div>
              </div>

              {/* Right content skeleton */}
              <div className="retro-post-content">
                <div className="p-4 sm:p-5 space-y-3 flex-1">
                  <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 w-3/4" />
                  <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800/80 w-full" />
                  <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800/80 w-5/6" />
                  {i === 1 && (
                    <div className="w-48 h-32 rounded bg-zinc-200 dark:bg-zinc-800 mt-2" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply composer skeleton */}
      <div className="retro-box p-4 space-y-3">
        <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 w-28" />
        <div className="h-24 rounded bg-zinc-100 dark:bg-zinc-800/60 w-full" />
        <div className="flex justify-between items-center">
          <div className="w-36 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-24 h-8 rounded bg-zinc-300 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}

/**
 * Magazine 2-column profile skeleton for /profile/[address]
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Cover Banner Skeleton */}
      <div className="retro-box overflow-hidden shadow-sm">
        <div className="retro-profile-cover flex items-end justify-end p-4 min-h-[140px] bg-gradient-to-r from-sky-900/30 via-slate-800/30 to-blue-900/30">
          <div className="w-24 h-8 rounded bg-white/20" />
        </div>
      </div>

      {/* Dual column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Identity card */}
        <div className="lg:col-span-4 space-y-5">
          <div className="retro-box p-4 sm:p-5 space-y-4">
            {/* Avatar and names */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg bg-zinc-300 dark:bg-zinc-700 shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-5 rounded bg-zinc-300 dark:bg-zinc-700 w-3/4" />
                <div className="h-3.5 rounded bg-zinc-200 dark:bg-zinc-800 w-1/2" />
              </div>
            </div>

            {/* Level & XP bar */}
            <div className="space-y-1.5 p-2.5 rounded bg-zinc-100 dark:bg-zinc-800/60">
              <div className="flex justify-between items-center">
                <div className="w-14 h-4 rounded bg-zinc-300 dark:bg-zinc-700" />
                <div className="w-16 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 w-full" />
            </div>

            {/* Badges / Stats list */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-12 rounded bg-zinc-100 dark:bg-zinc-800/60 p-2 space-y-1">
                <div className="h-2.5 rounded bg-zinc-200 dark:bg-zinc-700 w-12" />
                <div className="h-4 rounded bg-zinc-300 dark:bg-zinc-600 w-8" />
              </div>
              <div className="h-12 rounded bg-zinc-100 dark:bg-zinc-800/60 p-2 space-y-1">
                <div className="h-2.5 rounded bg-zinc-200 dark:bg-zinc-700 w-12" />
                <div className="h-4 rounded bg-zinc-300 dark:bg-zinc-600 w-8" />
              </div>
            </div>

            {/* Bio box */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800 w-full" />
              <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800 w-5/6" />
            </div>
          </div>
        </div>

        {/* Right Column: Activity tabs & feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="retro-box overflow-hidden">
            {/* Tabs bar */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-3 pt-2 gap-2">
              <div className="w-24 h-8 rounded-t bg-zinc-200 dark:bg-zinc-700" />
              <div className="w-24 h-8 rounded-t bg-zinc-100 dark:bg-zinc-800" />
              <div className="w-24 h-8 rounded-t bg-zinc-100 dark:bg-zinc-800" />
            </div>

            {/* Feed items */}
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded border border-zinc-200/80 dark:border-zinc-800 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-2/5" />
                    <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-16" />
                  </div>
                  <div className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800/80 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tournament detail page skeleton for /tournaments/[number]
 */
export function TournamentDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Panorama Hero */}
      <div className="retro-box overflow-hidden shadow-sm">
        <div className="retro-profile-cover flex flex-col justify-between p-5 sm:p-6 text-white min-h-[190px] bg-gradient-to-r from-sky-900/40 via-slate-800/40 to-blue-900/40">
          <div className="flex justify-between items-center">
            <div className="w-28 h-6 rounded bg-white/20" />
            <div className="w-32 h-6 rounded bg-white/20" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="w-24 h-4 rounded bg-white/30" />
            <div className="w-72 h-8 rounded bg-white/40" />
            <div className="w-96 h-4 rounded bg-white/30" />
          </div>
        </div>
      </div>

      {/* 4-Cell metric counters strip */}
      <div className="retro-stat-counters grid-cols-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-2 space-y-1">
            <div className="h-5 rounded bg-zinc-300 dark:bg-zinc-700 w-16" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800 w-20" />
          </div>
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 px-1">
        <div className="w-28 h-9 rounded-t bg-zinc-200 dark:bg-zinc-700" />
        <div className="w-28 h-9 rounded-t bg-zinc-100 dark:bg-zinc-800" />
        <div className="w-28 h-9 rounded-t bg-zinc-100 dark:bg-zinc-800" />
      </div>

      {/* Match bracket skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="retro-box p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="w-16 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-14 rounded bg-zinc-100 dark:bg-zinc-800/60 p-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-1/2" />
                  <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-1/3" />
                </div>
              </div>
              <div className="h-14 rounded bg-zinc-100 dark:bg-zinc-800/60 p-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-1/2" />
                  <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 w-1/3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calendar page skeleton for /calendar
 */
export function CalendarSkeleton() {
  return (
    <div className="w-full space-y-6 pb-8 animate-pulse">
      {/* Calendar Header Controls */}
      <div className="retro-topic-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-16 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <div className="w-32 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-14 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-24 h-7 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid - 8 cols */}
        <div className="lg:col-span-8">
          <div className="retro-box">
            {/* Calendar title bar */}
            <div className="retro-box-title justify-between px-3.5 sm:px-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="w-20 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>

            <div className="p-3 sm:p-4 space-y-3">
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                  <div key={i} className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto w-6" />
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square p-2 sm:p-2.5 rounded-[5px] border border-zinc-200/60 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 flex flex-col justify-between"
                  >
                    <div className="w-4 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                    {i % 4 === 1 && (
                      <div className="w-full h-4 rounded bg-sky-200 dark:bg-sky-900/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Servers Sidebar - 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <div className="retro-box">
            <div className="retro-box-title justify-between px-3.5 sm:px-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="w-6 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-2.5 rounded border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 rounded bg-zinc-200 dark:bg-zinc-700 w-3/4" />
                      <div className="h-2.5 rounded bg-zinc-100 dark:bg-zinc-800 w-1/2" />
                    </div>
                  </div>
                  <div className="w-10 h-5 rounded bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                </div>
              ))}
              <div className="pt-2">
                <div className="w-full h-9 rounded border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shop reward card skeleton for /shop
 */
export function ShopCardSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-6 flex flex-col md:flex-row gap-6 animate-pulse"
        >
          {/* Image placeholder */}
          <div className="w-full md:w-48 h-48 rounded-lg bg-zinc-200 dark:bg-zinc-700 shrink-0" />

          {/* Content details */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="h-7 rounded bg-zinc-200 dark:bg-zinc-700 w-1/2" />
              <div className="h-4 rounded bg-zinc-200/80 dark:bg-zinc-700/80 w-full" />
              <div className="h-4 rounded bg-zinc-200/80 dark:bg-zinc-700/80 w-3/4" />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex gap-6">
                <div className="space-y-1">
                  <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-10" />
                  <div className="h-6 rounded bg-zinc-300 dark:bg-zinc-600 w-20" />
                </div>
                <div className="border-l border-zinc-300 dark:border-zinc-700 pl-6 space-y-1">
                  <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-14" />
                  <div className="h-6 rounded bg-zinc-300 dark:bg-zinc-600 w-16" />
                </div>
              </div>
              <div className="w-32 h-10 rounded bg-zinc-300 dark:bg-zinc-700 sm:ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tournament matchup round skeleton for /rounds/[id]
 */
export function MatchupRoundSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="retro-box p-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-36 h-5 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="h-36 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 p-4 space-y-2">
            <div className="w-12 h-12 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-5 rounded bg-zinc-200 dark:bg-zinc-700 w-3/4" />
            <div className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800 w-1/2" />
          </div>
          <div className="h-36 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 p-4 space-y-2">
            <div className="w-12 h-12 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-5 rounded bg-zinc-200 dark:bg-zinc-700 w-3/4" />
            <div className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tournament entry detail skeleton for /entries/[id]
 */
export function EntryDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="retro-box p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-40 h-5 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="w-24 h-6 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700 w-2/3" />
        <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
        <div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 w-4/5" />
        <div className="h-64 rounded-lg bg-zinc-200 dark:bg-zinc-800 w-full" />
      </div>
    </div>
  );
}
