export default function RevenueLoading() {
  return (
    <section className="min-h-full bg-[#f8f7ff] p-4 md:p-6">
      <div className="mb-6">
        <div className="h-6 w-24 animate-pulse rounded-lg bg-purple-100" />
        <div className="mt-2 h-4 w-52 animate-pulse rounded-lg bg-purple-50" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
            <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-purple-100" />
            <div className="mb-3 h-9 w-9 animate-pulse rounded-xl bg-purple-50" />
            <div className="mb-1.5 h-7 w-28 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded-lg bg-gray-50" />
          </div>
        ))}
      </div>
      <div className="mb-4 rounded-2xl border border-purple-100 bg-white p-5">
        <div className="mb-4 h-4 w-24 animate-pulse rounded-lg bg-gray-100" />
        <div className="flex items-end gap-2" style={{ height: "8rem" }}>
          {[65, 35, 80, 45, 70, 55, 60].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1" style={{ alignSelf: "flex-end" }}>
              <div className="w-full animate-pulse rounded-t-lg bg-purple-100" style={{ height: `${h}px` }} />
              <div className="h-2.5 w-6 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-purple-100 bg-white p-5">
            <div className="mb-4 h-4 w-36 animate-pulse rounded-lg bg-gray-100" />
            {[0, 1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0">
                <div className="h-5 w-5 animate-pulse rounded-full bg-purple-50" />
                <div className="h-4 flex-1 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-purple-50" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
