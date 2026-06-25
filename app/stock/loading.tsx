export default function StockLoading() {
  return (
    <section className="min-h-full bg-[#f8f7ff] p-4 md:p-6">
      <div className="mb-6">
        <div className="h-6 w-16 animate-pulse rounded-lg bg-purple-100" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-purple-50" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-purple-100 bg-white p-4">
            <div className="h-5 w-5 animate-pulse rounded-lg bg-purple-50" />
            <div className="mt-2 h-6 w-12 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-1 h-3 w-16 animate-pulse rounded-lg bg-gray-50" />
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full border border-purple-100 bg-white" />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white">
        <div className="bg-purple-50 px-4 py-3">
          <div className="h-3 w-full animate-pulse rounded bg-purple-100 opacity-50" />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-50 px-4 py-3 last:border-0">
            <div className="h-4 w-36 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-4 w-20 animate-pulse rounded-lg bg-gray-50" />
            <div className="h-4 w-20 animate-pulse rounded-lg bg-gray-50" />
            <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-emerald-50" />
          </div>
        ))}
      </div>
    </section>
  );
}
