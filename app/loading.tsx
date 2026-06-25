export default function Loading() {
  return (
    <section className="min-h-full bg-[#f8f7ff] p-4 md:p-6">
      <div className="mb-6">
        <div className="h-6 w-32 animate-pulse rounded-lg bg-purple-100" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-purple-50" />
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-purple-100 bg-white p-5">
            <div className="mb-4 h-4 w-28 animate-pulse rounded-lg bg-gray-100" />
            {[0, 1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0">
                <div className="h-8 w-8 animate-pulse rounded-xl bg-purple-50" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 animate-pulse rounded-lg bg-gray-100" />
                  <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded-lg bg-gray-50" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
