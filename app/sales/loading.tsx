export default function SalesLoading() {
  return (
    <section className="min-h-full bg-[#f8f7ff] p-4 md:p-6">
      <div className="mb-6">
        <div className="h-6 w-20 animate-pulse rounded-lg bg-purple-100" />
        <div className="mt-2 h-4 w-44 animate-pulse rounded-lg bg-purple-50" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <div className="mb-4 h-4 w-24 animate-pulse rounded-lg bg-gray-100" />
          <div className="mb-4 h-11 animate-pulse rounded-xl bg-purple-50" />
          <div className="border-t border-purple-100 pt-4">
            <div className="mb-3 h-3 w-10 animate-pulse rounded-lg bg-gray-100" />
            <div className="py-4 text-center">
              <div className="mx-auto h-3 w-48 animate-pulse rounded-lg bg-gray-50" />
            </div>
          </div>
          <div className="mt-4 h-12 animate-pulse rounded-xl bg-amber-100" />
        </div>
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <div className="mb-4 h-4 w-28 animate-pulse rounded-lg bg-gray-100" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-purple-50" />
              <div className="flex-1">
                <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-100" />
                <div className="mt-1.5 h-3 w-24 animate-pulse rounded-lg bg-gray-50" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
