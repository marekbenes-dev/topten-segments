// app/activities/loading.tsx
export default function Loading() {
  // Show 12 tiles; it's fine if the target year has fewer months completed.
  const tiles = Array.from({ length: 12 });

  return (
    <div aria-busy className="animate-[fadeIn_.2s_ease]">
      {/* Header skeleton */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-9 w-20 rounded border bg-gray-100 dark:bg-gray-800 skeleton" />
        <div className="h-7 w-56 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
        <div className="h-9 w-20 rounded border bg-gray-100 dark:bg-gray-800 skeleton ml-auto" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((_, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 min-h-80 bg-white/40 dark:bg-black/20"
          >
            {/* top section */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="h-5 w-40 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-56 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
                <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
              </div>

              <div>
                <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800 skeleton mb-2" />
                <div className="space-y-1">
                  <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800 skeleton" />
                  <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
                  <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
                </div>
              </div>
            </div>

            {/* bottom cards + stats */}
            <div className="mt-auto pt-3 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="h-16 rounded border bg-gray-50 dark:bg-gray-900 skeleton" />
                <div className="h-16 rounded border bg-gray-50 dark:bg-gray-900 skeleton" />
              </div>
              <div className="h-4 w-48 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
              <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800 skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
