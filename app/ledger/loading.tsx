export default function LedgerLoading() {
  return (
    <section className="min-h-full bg-[#f8f7ff] p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-lg border border-purple-100 bg-white" />
        <div className="h-5 w-48 animate-pulse rounded-lg bg-purple-100" />
        <div className="h-8 w-8 animate-pulse rounded-lg border border-purple-100 bg-white" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
            <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-purple-100" />
            <div className="mb-3 h-9 w-9 animate-pulse rounded-xl bg-purple-50" />
            <div className="mb-1.5 h-7 w-24 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded-lg bg-gray-50" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-purple-100 bg-white p-5">
            <div className="mb-3 flex justify-between">
              <div className="h-4 w-24 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-4 w-10 animate-pulse rounded-lg bg-purple-100" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0">
                <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-50" />
                <div className="h-3 flex-1 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 w-16 animate-pulse rounded-lg bg-gray-50" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-purple-100 bg-white p-5">
            <div className="mb-4 h-4 w-16 animate-pulse rounded-lg bg-gray-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 animate-pulse rounded-xl bg-emerald-50" />
              <div className="h-20 animate-pulse rounded-xl bg-blue-50" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <div className="mb-4 flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-8 w-28 animate-pulse rounded-xl bg-amber-100" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0">
              <div className="h-8 w-8 animate-pulse rounded-xl bg-purple-50" />
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded-lg bg-gray-100" />
                <div className="mt-1.5 h-3 w-32 animate-pulse rounded-lg bg-gray-50" />
              </div>
              <div className="h-4 w-14 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
