"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Loader2,
  Printer,
  Receipt,
  Search,
  TrendingUp,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BillPrintModal } from "@/components/BillPrintModal";
import type { PrintBillData } from "@/components/BillPrintModal";

type BillItem = {
  name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
};

type BillRow = {
  id: string;
  bill_number: string;
  created_at: string;
  total_amount: number;
  discount: number;
  items: BillItem[];
};

type Range = "today" | "week" | "month" | "custom";

// Build IST-aware UTC timestamps for a given YYYY-MM-DD string
function istRange(dateStr: string): { start: string; end: string } {
  return {
    start: new Date(`${dateStr}T00:00:00+05:30`).toISOString(),
    end: new Date(`${dateStr}T23:59:59.999+05:30`).toISOString(),
  };
}

function getRange(range: Range, from: string, to: string): { start: string; end: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (range === "today") {
    const todayStr = toDateStr(now);
    return istRange(todayStr);
  }
  if (range === "week") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: new Date(`${toDateStr(monday)}T00:00:00+05:30`).toISOString(),
      end: new Date(`${toDateStr(sunday)}T23:59:59.999+05:30`).toISOString(),
    };
  }
  if (range === "month") {
    const firstDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: new Date(`${firstDay}T00:00:00+05:30`).toISOString(),
      end: new Date(`${toDateStr(lastDay)}T23:59:59.999+05:30`).toISOString(),
    };
  }
  // custom
  return {
    start: from ? new Date(`${from}T00:00:00+05:30`).toISOString() : new Date(0).toISOString(),
    end: to ? new Date(`${to}T23:59:59.999+05:30`).toISOString() : new Date().toISOString(),
  };
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [printBill, setPrintBill] = useState<PrintBillData | null>(null);

  const [range, setRange] = useState<Range>("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { start, end } = getRange(range, fromDate, toDate);

    const { data: salesData, error: sErr } = await supabase
      .from("sales")
      .select("*")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false });

    if (sErr || !salesData) {
      setError(sErr?.message ?? "Failed to load sales.");
      setLoading(false);
      return;
    }

    if (salesData.length === 0) {
      setBills([]);
      setLoading(false);
      return;
    }

    const saleIds = salesData.map((s) => s.id as string);

    const { data: itemsData } = await supabase
      .from("sale_items")
      .select("sale_id, quantity, unit_price, subtotal, products(name)")
      .in("sale_id", saleIds);

    const itemsBySale = new Map<string, BillItem[]>();
    for (const row of (itemsData ?? []) as Array<{
      sale_id: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      products: { name: string } | { name: string }[] | null;
    }>) {
      const name = Array.isArray(row.products)
        ? row.products[0]?.name
        : row.products?.name;
      const arr = itemsBySale.get(row.sale_id) ?? [];
      arr.push({
        name: name ?? "Unknown",
        qty: row.quantity,
        unit_price: row.unit_price,
        subtotal: row.subtotal,
      });
      itemsBySale.set(row.sale_id, arr);
    }

    setBills(
      salesData.map((s) => ({
        id: s.id as string,
        bill_number: (s.bill_number as string) ?? "—",
        created_at: s.created_at as string,
        total_amount: (s.total_amount as number) ?? 0,
        discount: (s.discount as number) ?? 0,
        items: itemsBySale.get(s.id as string) ?? [],
      })),
    );
    setLoading(false);
  }, [range, fromDate, toDate]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  /* ── Filtered list ──────────────────────────────────────────────── */
  const filtered = bills.filter((b) =>
    search.trim()
      ? b.bill_number.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  /* ── Summary stats ──────────────────────────────────────────────── */
  const totalRevenue = filtered.reduce((s, b) => s + b.total_amount, 0);
  const avgBill = filtered.length > 0 ? totalRevenue / filtered.length : 0;
  const totalItems = filtered.reduce((s, b) => s + b.items.reduce((si, i) => si + i.qty, 0), 0);

  const RANGE_LABELS: Record<Range, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    custom: "Custom",
  };

  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Sales History</h1>
          <p className="mt-0.5 text-sm text-gray-400">Browse and search all transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["today", "week", "month", "custom"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              range === r
                ? "bg-purple-600 text-white"
                : "border border-purple-100 bg-white text-gray-500 hover:bg-purple-50"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}

        {range === "custom" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-purple-100 bg-white px-3 py-1.5">
              <Calendar size={13} className="text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs text-gray-700 outline-none"
              />
            </div>
            <span className="text-xs text-gray-400">to</span>
            <div className="flex items-center gap-1.5 rounded-xl border border-purple-100 bg-white px-3 py-1.5">
              <Calendar size={13} className="text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs text-gray-700 outline-none"
              />
            </div>
          </div>
        )}

        {/* Search by bill number */}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-2.5 text-gray-300" />
          <input
            type="text"
            placeholder="Search bill no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-xl border border-purple-100 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Stat cards */}
      {!loading && (
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3">
          <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-4">
            <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <IndianRupee size={16} />
            </div>
            <p className="text-xl font-semibold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Total Revenue</p>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-4">
            <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-emerald-400 to-green-500" />
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingCart size={16} />
            </div>
            <p className="text-xl font-semibold text-gray-900">{filtered.length}</p>
            <p className="text-xs text-gray-400">Total Bills · {totalItems} items</p>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-4 col-span-2 md:col-span-1">
            <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp size={16} />
            </div>
            <p className="text-xl font-semibold text-gray-900">₹{avgBill.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Avg Bill Value</p>
          </article>
        </div>
      )}

      {/* Bills table */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Loading sales...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="mx-auto mb-3 h-10 w-10 text-purple-100" />
            <p className="text-sm text-gray-400">No sales found for this period</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="flex items-center gap-3 border-b border-purple-50 bg-purple-50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-purple-400">
              <span className="flex-1">Bill</span>
              <span className="hidden w-40 sm:block">Date &amp; Time</span>
              <span className="w-24 text-right">Amount</span>
              <span className="w-14 text-right">Action</span>
            </div>

            {filtered.map((bill) => (
              <div key={bill.id} className="border-b border-gray-50 last:border-0">
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() =>
                      setExpandedBill(expandedBill === bill.id ? null : bill.id)
                    }
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {expandedBill === bill.id ? (
                      <ChevronDown size={14} className="shrink-0 text-purple-400" />
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-gray-300" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{bill.bill_number}</p>
                      <p className="text-xs text-gray-400">
                        {bill.items.length} item{bill.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>

                  <span className="hidden w-40 text-xs text-gray-500 sm:block">
                    {fmtDateTime(bill.created_at)}
                  </span>

                  <span className="w-24 text-right text-sm font-semibold text-gray-900">
                    ₹{bill.total_amount.toFixed(2)}
                  </span>

                  <div className="flex w-14 justify-end">
                    <button
                      onClick={() =>
                        setPrintBill({
                          bill_number: bill.bill_number,
                          created_at: bill.created_at,
                          total_amount: bill.total_amount,
                          discount: bill.discount,
                          items: bill.items,
                        })
                      }
                      className="flex items-center gap-1 rounded-lg border border-purple-100 px-2 py-1 text-[10px] font-medium text-purple-500 transition hover:bg-purple-50"
                    >
                      <Printer size={11} />
                      Print
                    </button>
                  </div>
                </div>

                {/* Expanded items */}
                {expandedBill === bill.id && (
                  <div className="mx-4 mb-3 rounded-xl bg-purple-50/40 p-3">
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 sm:hidden">
                      {fmtDateTime(bill.created_at)}
                    </p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400">
                          <th className="pb-1 text-left font-medium">Product</th>
                          <th className="pb-1 text-right font-medium">Qty</th>
                          <th className="pb-1 text-right font-medium">Rate</th>
                          <th className="pb-1 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.items.map((item, i) => (
                          <tr key={i} className="border-t border-purple-100/50">
                            <td className="py-1 text-gray-700">{item.name}</td>
                            <td className="py-1 text-right text-gray-600">{item.qty}</td>
                            <td className="py-1 text-right text-gray-600">
                              ₹{item.unit_price.toFixed(2)}
                            </td>
                            <td className="py-1 text-right font-medium text-gray-800">
                              ₹{item.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bill.discount > 0 && (
                      <p className="mt-1.5 text-right text-xs text-gray-400">
                        Discount: −₹{bill.discount.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {printBill && (
        <BillPrintModal bill={printBill} onClose={() => setPrintBill(null)} />
      )}
    </section>
  );
}
