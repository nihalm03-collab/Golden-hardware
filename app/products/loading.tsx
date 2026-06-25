export default function ProductsLoading() {
  return (
    <section className="min-h-full bg-[#f8f7ff] p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-6 w-24 animate-pulse rounded-lg bg-purple-100" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-purple-50" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-amber-100" />
      </div>
      <div className="mb-4 h-11 animate-pulse rounded-xl border border-purple-100 bg-white" />
      <div className="mb-4 h-3 w-28 animate-pulse rounded-lg bg-gray-100" />
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white">
        <div className="bg-purple-50 px-4 py-3">
          <div className="h-3 w-full animate-pulse rounded bg-purple-100 opacity-50" />
        </div>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-50 px-4 py-3.5 last:border-0">
            <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-4 w-20 animate-pulse rounded-lg bg-gray-50" />
            <div className="h-4 w-20 animate-pulse rounded-lg bg-gray-50" />
            <div className="h-4 w-12 animate-pulse rounded-lg bg-gray-50" />
            <div className="h-4 w-16 animate-pulse rounded-lg bg-gray-50" />
            <div className="ml-auto flex gap-2">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-purple-50" />
              <div className="h-7 w-7 animate-pulse rounded-lg bg-red-50" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
