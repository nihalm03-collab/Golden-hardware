"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Layers,
  Loader2,
  PackageOpen,
  Plus,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, InventoryLog } from "@/types";

/* ── Derived row type ──────────────────────────────────────────────── */
type StockRow = Product & {
  currentStock: number;
  lastUpdated: string | null; // ISO timestamp of latest inventory_log entry
  status: "in-stock" | "low-stock" | "out-of-stock";
};

/* ── Restock modal state ──────────────────────────────────────────── */
type RestockTarget = { id: string; name: string; unit: string | null };

function getStatus(stock: number, lowAt: number): StockRow["status"] {
  if (stock <= 0) return "out-of-stock";
  if (stock <= lowAt) return "low-stock";
  return "in-stock";
}

const STATUS_STYLES: Record<StockRow["status"], string> = {
  "in-stock": "bg-emerald-50 text-emerald-600",
  "low-stock": "bg-amber-50 text-amber-600",
  "out-of-stock": "bg-red-50 text-red-500",
};

const STATUS_LABELS: Record<StockRow["status"], string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Stat card ─────────────────────────────────────────────────────── */
/* ── Main page ─────────────────────────────────────────────────────── */
export default function StockPage() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* restock modal */
  const [target, setTarget] = useState<RestockTarget | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError(null);

    /* fetch all products */
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (pErr || !products) {
      setError(pErr?.message ?? "Failed to load products.");
      setLoading(false);
      return;
    }

    /* fetch all inventory_log rows */
    const { data: logs, error: lErr } = await supabase
      .from("inventory_log")
      .select("product_id, change_qty, created_at");

    if (lErr) {
      setError(lErr.message);
      setLoading(false);
      return;
    }

    const typedLogs = (logs ?? []) as Pick<
      InventoryLog,
      "product_id" | "change_qty" | "created_at"
    >[];

    /* aggregate per product */
    const stockMap = new Map<
      string,
      { total: number; lastUpdated: string | null }
    >();

    for (const log of typedLogs) {
      const existing = stockMap.get(log.product_id) ?? {
        total: 0,
        lastUpdated: null,
      };
      existing.total += log.change_qty;
      if (
        !existing.lastUpdated ||
        log.created_at > existing.lastUpdated
      ) {
        existing.lastUpdated = log.created_at;
      }
      stockMap.set(log.product_id, existing);
    }

    const derived: StockRow[] = (products as Product[]).map((p) => {
      const agg = stockMap.get(p.id) ?? { total: 0, lastUpdated: null };
      return {
        ...p,
        currentStock: agg.total,
        lastUpdated: agg.lastUpdated,
        status: getStatus(agg.total, p.low_stock_at),
      };
    });

    setRows(derived);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  /* stat card counts */
  const inStock = rows.filter((r) => r.status === "in-stock").length;
  const lowStock = rows.filter((r) => r.status === "low-stock").length;
  const outOfStock = rows.filter((r) => r.status === "out-of-stock").length;

  /* open restock modal */
  function openRestock(product: StockRow) {
    setTarget({ id: product.id, name: product.name, unit: product.unit });
    setQty(1);
    setNote("");
    setModalError(null);
  }

  function closeModal() {
    setTarget(null);
  }

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    if (qty <= 0) {
      setModalError("Quantity must be greater than 0.");
      return;
    }
    setSubmitting(true);
    setModalError(null);

    const { error: insertErr } = await supabase.from("inventory_log").insert({
      product_id: target.id,
      change_qty: qty,
      reason: "restock",
      note: note.trim() || null,
    });

    if (insertErr) {
      setModalError(insertErr.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    await loadStock();
  }

  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Stock</h1>
        <p className="mt-1 text-sm text-slate-600">
            Live inventory levels across all products
        </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-purple-100 bg-white p-4">
          <Layers className="text-indigo-950" size={18} />
          <p className="mt-2 text-xl font-semibold text-indigo-950">{rows.length}</p>
          <p className="mt-1 text-xs text-gray-400">Total</p>
        </article>
        <article className="rounded-xl border border-purple-100 bg-white p-4">
          <CheckCircle className="text-emerald-500" size={18} />
          <p className="mt-2 text-xl font-semibold text-emerald-600">{inStock}</p>
          <p className="mt-1 text-xs text-gray-400">In stock</p>
        </article>
        <article className="rounded-xl border border-purple-100 bg-white p-4">
          <AlertTriangle className="text-amber-500" size={18} />
          <p className="mt-2 text-xl font-semibold text-amber-600">{lowStock}</p>
          <p className="mt-1 text-xs text-gray-400">Low stock</p>
        </article>
        <article className="rounded-xl border border-purple-100 bg-white p-4">
          <XCircle className="text-red-500" size={18} />
          <p className="mt-2 text-xl font-semibold text-red-500">{outOfStock}</p>
          <p className="mt-1 text-xs text-gray-400">Out of stock</p>
        </article>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Loading stock data...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <PackageOpen className="mx-auto mb-3 h-10 w-10 text-purple-200" />
            <p className="text-sm text-gray-400">No products found</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-purple-50">
              <tr>
                {[
                  "Product Name",
                  "SKU",
                  "Category",
                  "Current Stock",
                  "Status",
                  "Low Stock At",
                  "Last Updated",
                  "",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-purple-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 transition-colors hover:bg-purple-50/40">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.sku}</td>
                  <td className={`px-4 py-3 text-sm ${row.category ? "text-gray-700" : "text-gray-300"}`}>
                    {row.category ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <p>
                      {row.currentStock}
                      {row.unit ? ` ${row.unit}` : ""}
                    </p>
                    <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full ${
                          row.status === "in-stock"
                            ? "bg-emerald-400"
                            : row.status === "low-stock"
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((row.currentStock / (row.low_stock_at * 3 || 1)) * 100),
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        STATUS_STYLES[row.status]
                      }`}
                    >
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.low_stock_at}
                  </td>
                  <td className={`px-4 py-3 text-sm ${row.lastUpdated ? "text-gray-700" : "text-gray-300"}`}>
                    {formatDate(row.lastUpdated)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <button
                      onClick={() => openRestock(row)}
                      className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-emerald-200 px-2.5 py-1 text-xs text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <Plus size={12} />
                      Add stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Restock modal */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-base font-semibold text-indigo-950">Add Stock</h2>
            <p className="mb-5 text-xs text-gray-400">{target.name}</p>

            <form onSubmit={handleRestock} className="px-6 py-5 space-y-4">
              {modalError && (
                <p className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
                  <AlertCircle size={16} />
                  {modalError}
                </p>
              )}

              <div>
                <label
                  htmlFor="restock-qty"
                  className="mb-1.5 block text-xs font-medium text-gray-600"
                >
                  Units to add{target.unit ? ` (${target.unit})` : ""} *
                </label>
                <input
                  id="restock-qty"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label
                  htmlFor="restock-note"
                  className="mb-1.5 block text-xs font-medium text-gray-600"
                >
                  Note (optional)
                </label>
                <input
                  id="restock-note"
                  type="text"
                  placeholder="e.g. Restocked from supplier"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Add Stock"}
                </button>
              </div>
            </form>

            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-300 transition hover:bg-gray-50 hover:text-gray-500"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
