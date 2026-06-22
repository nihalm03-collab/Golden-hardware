"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  PackageOpen,
  Receipt,
  Search,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, Sale } from "@/types";

/* ── Local derived types ──────────────────────────────────────────── */
type ProductWithStock = Product & { currentStock: number };
type CartItem = { product: ProductWithStock; qty: number };
type BillItem = { name: string; qty: number; unit_price: number; subtotal: number };
type BillRow = Sale & { itemCount: number; items: BillItem[] };

/* ── Helpers ──────────────────────────────────────────────────────── */
function getTodayRange() {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
  return { start, end };
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Stat card ──────────────────────────────────────────────────── */
/* ── Page ─────────────────────────────────────────────────────────── */
export default function SalesPage() {
  /* ── Today's bills ──────────────────────────────────────────────── */
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  /* ── Stats derived from bills ─────────────────────────────────── */
  const todayRevenue = bills.reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const todayTxns = bills.length;
  const todayItemsSold = bills.reduce(
    (s, b) => s + b.items.reduce((si, i) => si + i.qty, 0),
    0,
  );

  let topProduct = "—";
  {
    const tally = new Map<string, number>();
    for (const b of bills)
      for (const i of b.items)
        tally.set(i.name, (tally.get(i.name) ?? 0) + i.qty);
    let best = 0;
    for (const [name, qty] of tally)
      if (qty > best) { best = qty; topProduct = name; }
  }

  /* ── Product search ─────────────────────────────────────────────── */
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductWithStock[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Cart ────────────────────────────────────────────────────────── */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const subtotal = cart.reduce(
    (s, c) => s + (c.product.selling_price ?? 0) * c.qty,
    0,
  );
  const grandTotal = Math.max(0, subtotal - discount);

  /* ── Sale state ─────────────────────────────────────────────────── */
  const [completing, setCompleting] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [successBill, setSuccessBill] = useState<string | null>(null);

  /* ── Load today's bills ─────────────────────────────────────────── */
  const loadBills = useCallback(async () => {
    setLoadingBills(true);
    const { start, end } = getTodayRange();

    const { data: salesData, error: sErr } = await supabase
      .from("sales")
      .select("*")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false });

    if (sErr || !salesData) {
      setLoadingBills(false);
      return;
    }

    if (salesData.length === 0) {
      setBills([]);
      setLoadingBills(false);
      return;
    }

    const saleIds = (salesData as Sale[]).map((s) => s.id);

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
      const productName = Array.isArray(row.products)
        ? row.products[0]?.name
        : row.products?.name;
      const arr = itemsBySale.get(row.sale_id) ?? [];
      arr.push({
        name: productName ?? "Unknown",
        qty: row.quantity,
        unit_price: row.unit_price,
        subtotal: row.subtotal,
      });
      itemsBySale.set(row.sale_id, arr);
    }

    setBills(
      (salesData as Sale[]).map((s) => {
        const items = itemsBySale.get(s.id) ?? [];
        return { ...s, itemCount: items.length, items };
      }),
    );
    setLoadingBills(false);
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  /* ── Debounced product search ───────────────────────────────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);

      const { data: products } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${q}%`)
        .limit(10);

      if (!products || products.length === 0) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      const ids = (products as Product[]).map((p) => p.id);
      const { data: logs } = await supabase
        .from("inventory_log")
        .select("product_id, change_qty")
        .in("product_id", ids);

      const stockMap = new Map<string, number>();
      for (const log of (logs ?? []) as {
        product_id: string;
        change_qty: number;
      }[]) {
        stockMap.set(
          log.product_id,
          (stockMap.get(log.product_id) ?? 0) + log.change_qty,
        );
      }

      setSearchResults(
        (products as Product[]).map((p) => ({
          ...p,
          currentStock: stockMap.get(p.id) ?? 0,
        })),
      );
      setSearching(false);
    }, 300);
  }, [query]);

  /* ── Cart helpers ────────────────────────────────────────────────── */
  function addToCart(product: ProductWithStock) {
    setCart((prev) => {
      const exists = prev.find((c) => c.product.id === product.id);
      if (exists)
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c,
        );
      return [...prev, { product, qty: 1 }];
    });
    setQuery("");
    setSearchResults([]);
    setSaleError(null);
    setSuccessBill(null);
  }

  function adjustQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((c) =>
        c.product.id === productId
          ? { ...c, qty: Math.max(1, c.qty + delta) }
          : c,
      ),
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  /* ── Complete sale ───────────────────────────────────────────────── */
  async function completeSale() {
    if (cart.length === 0) {
      setSaleError("Add at least one product to the cart.");
      return;
    }
    setCompleting(true);
    setSaleError(null);
    setSuccessBill(null);

    const billNumber = `S-${Date.now()}`;

    // 1. Insert sale
    const { data: saleData, error: saleErr } = await supabase
      .from("sales")
      .insert({ bill_number: billNumber, total_amount: grandTotal, discount })
      .select()
      .single();

    if (saleErr || !saleData) {
      setSaleError(saleErr?.message ?? "Failed to create sale.");
      setCompleting(false);
      return;
    }

    const saleId = (saleData as Sale).id;

    // 2. Insert sale_items
    const { error: itemsErr } = await supabase.from("sale_items").insert(
      cart.map((c) => ({
        sale_id: saleId,
        product_id: c.product.id,
        quantity: c.qty,
        unit_price: c.product.selling_price ?? 0,
        subtotal: (c.product.selling_price ?? 0) * c.qty,
      })),
    );

    if (itemsErr) {
      setSaleError(itemsErr.message);
      setCompleting(false);
      return;
    }

    // 3. Insert inventory_log entries (negative qty = stock reduction)
    const { error: logErr } = await supabase.from("inventory_log").insert(
      cart.map((c) => ({
        product_id: c.product.id,
        change_qty: -c.qty,
        reason: "sale",
        sale_id: saleId,
      })),
    );

    if (logErr) {
      setSaleError(logErr.message);
      setCompleting(false);
      return;
    }

    setCart([]);
    setDiscount(0);
    setSuccessBill(billNumber);
    setCompleting(false);
    await loadBills();
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Sales</h1>
        <p className="mt-1 text-sm text-slate-600">
            Record sales and generate bills
        </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* ── LEFT: New Sale ───────────────────────────────────────── */}
        <div className="order-1 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">New Sale</h2>
          <p className="mb-3 text-[10px] text-gray-400">Bill #S-XXXX</p>

          {/* Product search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-purple-100 bg-white px-4 py-2.5 pl-9 text-base text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
            />

            {/* Dropdown results */}
            {(searching || query.trim()) && (
              <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-purple-100 bg-white shadow-lg">
                {searching && (
                  <li className="px-3 py-3 text-xs text-gray-400">
                    <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                    Searching...
                  </li>
                )}
                {!searching && searchResults.length === 0 && query.trim() && (
                  <li className="px-3 py-2 text-xs text-gray-400">
                    No products found.
                  </li>
                )}
                {searchResults.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex cursor-pointer items-center justify-between border-b border-gray-50 px-3 py-2.5 transition hover:bg-purple-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">{p.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        ₹{p.selling_price ?? 0} · Stock {p.currentStock}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-purple-500">
                      + Add
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cart */}
          <div className="mt-4 border-t border-purple-100 pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Cart</p>
          {cart.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-300">
                Add products to get started
            </p>
          ) : (
              <div>
              {cart.map((c) => (
                <div
                  key={c.product.id}
                    className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                      {c.product.name}
                    </p>
                      <p className="text-xs text-gray-400">
                      ₹{c.product.selling_price ?? 0}
                      {c.product.unit ? ` / ${c.product.unit}` : ""}
                    </p>
                  </div>

                  {/* Qty +/- */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustQty(c.product.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-100 text-sm text-gray-600 transition hover:bg-purple-50"
                    >
                      −
                    </button>
                      <span className="min-w-[20px] text-center text-sm font-medium text-gray-800">
                      {c.qty}
                    </span>
                    <button
                      onClick={() => adjustQty(c.product.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-100 text-sm text-gray-600 transition hover:bg-purple-50"
                    >
                      +
                    </button>
                  </div>

                  {/* Line subtotal */}
                    <span className="min-w-[60px] text-right text-sm font-semibold text-gray-800">
                    ₹{((c.product.selling_price ?? 0) * c.qty).toFixed(2)}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(c.product.id)}
                    aria-label="Remove item"
                      className="ml-1 text-xl leading-none text-gray-300 transition hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
              </div>
          )}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <div className="mt-4 rounded-xl bg-purple-50/50 p-4">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
                <label htmlFor="discount" className="shrink-0">
                  Discount ₹
                </label>
                <input
                  id="discount"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Math.max(0, Number(e.target.value)))
                  }
                  className="h-11 w-20 rounded-lg border border-purple-100 px-2 py-1 text-right text-base md:text-sm"
                />
              </div>
              <div className="my-2 border-t border-purple-100" />
              <div className="flex justify-between text-base font-semibold text-indigo-950">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Feedback */}
          {saleError && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
              <AlertCircle size={16} />
              {saleError}
            </p>
          )}
          {successBill && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle size={16} />
              Sale complete! Bill:{" "}
              <strong className="font-semibold">{successBill}</strong>
            </p>
          )}

          <button
            onClick={completeSale}
            disabled={completing || cart.length === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 md:py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            <ShoppingCart size={16} />
            {completing ? "Processing…" : "Complete Sale"}
          </button>
        </div>

        {/* ── RIGHT: Today's bills ─────────────────────────────────── */}
        <div className="order-2 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            Today&apos;s Bills
          </h2>

          {loadingBills ? (
            <div className="py-12 text-center text-sm text-gray-400">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
              Loading bills...
            </div>
          ) : bills.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-purple-100" />
              <p className="text-sm text-gray-400">No bills recorded today</p>
            </div>
          ) : (
            <div>
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="mb-1"
                >
                  {/* Summary row — click to expand */}
                  <button
                    onClick={() =>
                      setExpandedBill(
                        expandedBill === bill.id ? null : bill.id,
                      )
                    }
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-purple-50/50"
                  >
                    <div className="rounded-lg bg-purple-50 p-1.5 text-purple-400">
                      <Receipt className="h-5 w-5" />
                    </div>

                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {bill.bill_number}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {bill.itemCount} item
                        {bill.itemCount !== 1 ? "s" : ""} ·{" "}
                        {fmtTime(bill.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{(bill.total_amount ?? 0).toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{fmtTime(bill.created_at)}</p>
                    </div>
                  </button>

                  {/* Expanded item breakdown */}
                  {expandedBill === bill.id && (
                    <div className="mb-2 mt-1 rounded-xl bg-purple-50/30 p-3">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="pb-1 text-left font-medium">
                              Product
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Qty
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Unit Price
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.items.map((item, i) => (
                            <tr key={i}>
                              <td className="py-1 text-gray-700">
                                {item.name}
                              </td>
                              <td className="py-1 text-right text-gray-700">
                                {item.qty}
                              </td>
                              <td className="py-1 text-right text-gray-700">
                                ₹{item.unit_price.toFixed(2)}
                              </td>
                              <td className="py-1 text-right font-medium text-gray-700">
                                ₹{item.subtotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(bill.discount ?? 0) > 0 && (
                        <p className="mt-2 text-right text-xs text-gray-400">
                          Discount: −₹{bill.discount}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
