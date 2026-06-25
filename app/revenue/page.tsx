"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Sale, SaleItem } from "@/types";

type SaleItemJoined = SaleItem & {
  products:
    | { name: string; category: string | null }
    | { name: string; category: string | null }[]
    | null;
};

function getProductName(productRel: SaleItemJoined["products"]) {
  if (!productRel) return "Unknown";
  if (Array.isArray(productRel)) return productRel[0]?.name ?? "Unknown";
  return productRel.name;
}

/* ── helpers ─────────────────────────────────────────────────────────── */
function formatAmount(n: number) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
}

function getDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short" });
}

function getDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function last7Days(): { dateKey: string; label: string }[] {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getDateKey(d.toISOString());
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    result.push({ dateKey: key, label });
  }
  return result;
}

/* ── page ──────────────────────────────────────────────────────────── */
export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItemJoined[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [salesRes, itemsRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, bill_number, total_amount, discount, created_at"),
        supabase
          .from("sale_items")
          .select("id, sale_id, product_id, quantity, unit_price, subtotal, products(name, category)"),
      ]);

      if (salesRes.error || itemsRes.error) {
        setError(salesRes.error?.message ?? itemsRes.error?.message ?? "Failed to load data.");
        setLoading(false);
        return;
      }

      setSales((salesRes.data ?? []) as Sale[]);
      setSaleItems((itemsRes.data ?? []) as SaleItemJoined[]);
      setLoading(false);
    }
    load();
  }, []);

  /* ── derived stats ─────────────────────────────────────────────── */
  const totalRevenue = useMemo(
    () => sales.reduce((sum, s) => sum + (s.total_amount ?? 0), 0),
    [sales],
  );
  const totalTransactions = sales.length;
  const avgSaleValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const days7 = useMemo(() => last7Days(), []);

  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of sales) {
      const key = getDateKey(sale.created_at);
      map.set(key, (map.get(key) ?? 0) + (sale.total_amount ?? 0));
    }
    return days7.map((d) => ({ ...d, revenue: map.get(d.dateKey) ?? 0 }));
  }, [sales, days7]);

  const maxDayRevenue = useMemo(
    () => Math.max(...dailyRevenue.map((d) => d.revenue), 1),
    [dailyRevenue],
  );

  const topByQty = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const item of saleItems) {
      const name = getProductName(item.products);
      const existing = map.get(name) ?? { name, qty: 0 };
      existing.qty += item.quantity;
      map.set(name, existing);
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [saleItems]);

  const topByRevenue = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>();
    for (const item of saleItems) {
      const name = getProductName(item.products);
      const existing = map.get(name) ?? { name, revenue: 0 };
      existing.revenue += item.subtotal ?? 0;
      map.set(name, existing);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [saleItems]);

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-indigo-950">Revenue</h1>
        <p className="mt-1 text-sm text-gray-400">Sales performance and product insights</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-purple-100 bg-white p-6 text-sm text-slate-600">
          Loading revenue data...
        </div>
      ) : (
        <>
          {/* Section 1 — Summary cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total Revenue */}
            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <TrendingUp size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">
                ₹{totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">Total Revenue</p>
            </article>

            {/* Total Transactions */}
            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-emerald-400 to-green-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingCart size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">{totalTransactions}</p>
              <p className="text-xs text-gray-400">Total Transactions</p>
            </article>

            {/* Avg Sale Value */}
            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <BarChart2 size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">
                ₹{avgSaleValue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">Avg Sale Value</p>
            </article>
          </div>

          {/* Section 2 — Last 7 days bar chart */}
          <div className="mb-4 rounded-2xl border border-purple-100 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">Last 7 days</h2>
            {/* Bar chart — pixel heights so percentage-in-flex-child works correctly */}
            <div className="flex items-end gap-2" style={{ height: "8rem" }}>
              {dailyRevenue.map((day) => {
                const MAX_BAR_PX = 80; // leaves ~48px for the two text labels
                const barPx = day.revenue > 0
                  ? Math.max(4, Math.round((day.revenue / maxDayRevenue) * MAX_BAR_PX))
                  : 4;
                return (
                  <div
                    key={day.dateKey}
                    className="flex flex-1 flex-col items-center gap-1"
                    style={{ alignSelf: "flex-end" }}
                  >
                    <span className="text-[10px] text-gray-500">
                      {day.revenue > 0 ? formatAmount(day.revenue) : ""}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-purple-400"
                      style={{ height: `${barPx}px` }}
                    />
                    <span className="text-[10px] text-gray-400">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3 — Two columns */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Top selling products by qty */}
            <div className="rounded-2xl border border-purple-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-800">Top selling products</h2>
              {topByQty.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No sales data yet</p>
              ) : (
                <ul>
                  {topByQty.map((row, i) => (
                    <li
                      key={row.name}
                      className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0"
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-50 text-[10px] font-medium text-purple-500">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-700">{row.name}</span>
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600">
                        {row.qty} units
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top products by revenue */}
            <div className="rounded-2xl border border-purple-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-800">Top by revenue</h2>
              {topByRevenue.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">No sales data yet</p>
              ) : (
                <ul>
                  {topByRevenue.map((row, i) => (
                    <li
                      key={row.name}
                      className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0"
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-50 text-[10px] font-medium text-purple-500">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-700">{row.name}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        ₹{row.revenue.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
