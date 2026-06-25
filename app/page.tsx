"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { InventoryLog, Product, Sale } from "@/types";

type SaleItemJoinRow = {
  sale_id: string;
  quantity: number;
  products: { name: string } | { name: string }[] | null;
};

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

type DerivedProductStock = {
  product: Product;
  currentStock: number;
  status: StockStatus;
};

function getTodayStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [todaySaleItems, setTodaySaleItems] = useState<SaleItemJoinRow[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);

      const todayStartIso = getTodayStartIso();

      const [productsRes, logsRes, salesRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("inventory_log").select("*"),
        supabase
          .from("sales")
          .select("*")
          .gte("created_at", todayStartIso)
          .order("created_at", { ascending: false }),
      ]);

      if (productsRes.error || logsRes.error || salesRes.error) {
        setError(
          productsRes.error?.message ||
            logsRes.error?.message ||
            salesRes.error?.message ||
            "Failed to load dashboard data.",
        );
        setLoading(false);
        return;
      }

      const loadedProducts = (productsRes.data ?? []) as Product[];
      const loadedLogs = (logsRes.data ?? []) as InventoryLog[];
      const loadedSales = (salesRes.data ?? []) as Sale[];

      setProducts(loadedProducts);
      setInventoryLogs(loadedLogs);
      setTodaySales(loadedSales);

      if (loadedSales.length === 0) {
        setTodaySaleItems([]);
        setLoading(false);
        return;
      }

      const saleIds = loadedSales.map((sale) => sale.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from("sale_items")
        .select("sale_id, quantity, products(name)")
        .in("sale_id", saleIds);

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      setTodaySaleItems((itemsData ?? []) as SaleItemJoinRow[]);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const derivedStock = useMemo<DerivedProductStock[]>(() => {
    const stockByProductId = new Map<string, number>();

    for (const row of inventoryLogs) {
      stockByProductId.set(
        row.product_id,
        (stockByProductId.get(row.product_id) ?? 0) + row.change_qty,
      );
    }

    return products.map((product) => {
      const currentStock = stockByProductId.get(product.id) ?? 0;
      let status: StockStatus = "in-stock";

      if (currentStock <= 0) {
        status = "out-of-stock";
      } else if (currentStock <= product.low_stock_at) {
        status = "low-stock";
      }

      return { product, currentStock, status };
    });
  }, [products, inventoryLogs]);

  const inStockCount = derivedStock.filter((row) => row.status === "in-stock").length;
  const lowStockCount = derivedStock.filter((row) => row.status === "low-stock").length;
  const outOfStockCount = derivedStock.filter((row) => row.status === "out-of-stock").length;

  const lowStockRows = derivedStock.filter(
    (row) => row.currentStock <= row.product.low_stock_at,
  );

  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount ?? 0), 0);
  const todayTransactions = todaySales.length;

  const topSellingProductToday = useMemo(() => {
    if (todaySaleItems.length === 0) {
      return "-";
    }

    const qtyByProductName = new Map<string, number>();

    for (const item of todaySaleItems) {
      const productName = Array.isArray(item.products)
        ? item.products[0]?.name
        : item.products?.name;
      const name = productName ?? "Unknown";
      qtyByProductName.set(name, (qtyByProductName.get(name) ?? 0) + item.quantity);
    }

    let topName = "-";
    let topQty = 0;

    for (const [name, qty] of qtyByProductName.entries()) {
      if (qty > topQty) {
        topQty = qty;
        topName = name;
      }
    }

    return topName;
  }, [todaySaleItems]);

  const dotColors = [
    "bg-violet-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-orange-400",
    "bg-rose-400",
  ];

  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-purple-100 bg-white p-6 text-sm text-slate-600">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <TrendingUp size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">₹{todayRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400">Today's Revenue</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-emerald-400 to-green-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingCart size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">{todayTransactions}</p>
              <p className="text-xs text-gray-400">Today's Transactions</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Package size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">{products.length}</p>
              <p className="text-xs text-gray-400">Total Products</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-rose-400 to-red-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <AlertTriangle size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">{lowStockCount + outOfStockCount}</p>
              <p className="text-xs text-gray-400">Low Stock alerts</p>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-purple-100 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Recent sales</h2>
                <Link href="/sales" className="text-xs text-purple-500 transition hover:text-purple-700">
                  View all →
                </Link>
              </div>

              {todaySales.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-400">No sales recorded today</p>
              ) : (
                <ul>
                  {todaySales.slice(0, 5).map((sale, index) => (
                    <li
                      key={sale.id}
                      className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0"
                    >
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColors[index % dotColors.length]}`} />

                      <div className="flex-1">
                        <p className="text-xs text-gray-700">{topSellingProductToday === "-" ? "Sale recorded" : topSellingProductToday}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400">{sale.bill_number}</p>
                      </div>

                      <p className="text-xs font-semibold text-gray-900">₹{(sale.total_amount ?? 0).toFixed(2)}</p>
                      <p className="ml-2 text-[10px] text-gray-300">{formatTime(sale.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Stock alerts</h2>
              <Link
                href="/stock"
                className="text-xs text-purple-500 transition hover:text-purple-700"
              >
                Go to stock →
              </Link>
              </div>

              {lowStockRows.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-center text-xs text-emerald-600">
                  <CheckCircle className="mx-auto mb-2" size={16} />
                  All items are well stocked
                </div>
              ) : (
                <ul>
                  {lowStockRows.map((row) => {
                    const isOut = row.currentStock <= 0;
                    const ratio = row.product.low_stock_at > 0
                      ? Math.max(0, Math.min(100, (row.currentStock / row.product.low_stock_at) * 100))
                      : 0;

                    return (
                      <li
                        key={row.product.id}
                        className="flex items-center gap-2 border-b border-gray-50 py-2.5 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{row.product.name}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {row.product.sku}
                            {row.product.category ? ` · ${row.product.category}` : ""}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isOut
                              ? "bg-red-50 text-red-500"
                              : "bg-amber-50 text-amber-500"
                          }`}
                        >
                          {isOut ? "out of stock" : "low stock"}
                        </span>

                        <div className="ml-2 h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-1.5 rounded-full ${isOut ? "bg-red-400" : "bg-amber-400"}`}
                            style={{ width: `${isOut ? 2 : Math.max(8, ratio)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
