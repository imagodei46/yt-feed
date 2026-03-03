export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b1120]">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4">
          <div>
            <div className="h-6 w-24 animate-pulse rounded bg-slate-700" />
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Tab skeleton */}
        <div className="flex gap-1 border-b border-slate-700 pb-2">
          <div className="h-5 w-12 animate-pulse rounded bg-slate-700" />
          <div className="h-5 w-20 animate-pulse rounded bg-slate-800" />
        </div>
        {/* Briefing + Notes skeleton */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-xl border-l-2 border-slate-700 bg-slate-900 p-5 space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-700" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-700" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        </div>
        {/* Filter skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-slate-800"
            />
          ))}
        </div>
        {/* Video grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
            >
              <div className="aspect-video w-full animate-pulse bg-slate-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-700" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 animate-pulse rounded bg-slate-800" />
                  <div className="h-5 w-12 animate-pulse rounded bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
