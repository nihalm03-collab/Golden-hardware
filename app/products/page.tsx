"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import { useToast } from "@/components/Toaster";

type ProductForm = Omit<Product, "id" | "created_at">;

const EMPTY_FORM: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unit: "",
  mrp: null,
  selling_price: null,
  brand: "",
  low_stock_at: 10,
};

const TABLE_COLS = [
  "Name",
  "SKU",
  "Category",
  "Unit",
  "MRP (₹)",
  "Selling Price (₹)",
  "Brand",
  "Low Stock At",
  "Actions",
];

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setProducts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category ?? "",
      unit: product.unit ?? "",
      mrp: product.mrp,
      selling_price: product.selling_price,
      brand: product.brand ?? "",
      low_stock_at: product.low_stock_at,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? null : Number(value)) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload: ProductForm = {
      ...form,
      category: form.category || null,
      unit: form.unit || null,
      brand: form.brand || null,
    };

    let dbError: { message: string } | null = null;

    if (editingId) {
      const res = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);
      dbError = res.error;
    } else {
      const res = await supabase.from("products").insert(payload);
      dbError = res.error;
    }

    if (dbError) {
      setFormError(dbError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    toast(editingId ? "Product updated successfully!" : "Product added successfully!");
    await loadProducts();
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    if (deleteError) {
      toast(`Delete failed: ${deleteError.message}`, "error");
      return;
    }    toast(`"${name}" deleted.`, "info");    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Products</h1>
          <p className="mt-0.5 text-sm text-gray-400">Manage your hardware catalogue</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-purple-100 bg-white px-4 py-2.5 pl-9 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div className="mb-4 flex gap-6 text-xs text-gray-500">
        <p>Total: {products.length} products</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <PackageOpen className="mx-auto mb-3 h-10 w-10 text-purple-200" />
            <p className="text-sm text-gray-400">No products yet</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-purple-50">
              <tr>
                {TABLE_COLS.map((col) => (
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
              {products
                .filter((p) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    q === "" ||
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q)
                  );
                })
                .map((p) => (
                <tr key={p.id} className="border-b border-gray-50 transition-colors hover:bg-purple-50/40">
                  <td className="px-4 py-3 text-sm text-gray-700">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.sku}</td>
                  <td className={`px-4 py-3 text-sm ${p.category ? "text-gray-700" : "text-gray-300"}`}>{p.category ?? "—"}</td>
                  <td className={`px-4 py-3 text-sm ${p.unit ? "text-gray-700" : "text-gray-300"}`}>{p.unit ?? "—"}</td>
                  <td className={`px-4 py-3 text-sm ${p.mrp != null ? "text-gray-700" : "text-gray-300"}`}>
                    {p.mrp != null ? `₹${p.mrp}` : "—"}
                  </td>
                  <td className={`px-4 py-3 text-sm ${p.selling_price != null ? "text-gray-700" : "text-gray-300"}`}>
                    {p.selling_price != null ? `₹${p.selling_price}` : "—"}
                  </td>
                  <td className={`px-4 py-3 text-sm ${p.brand ? "text-gray-700" : "text-gray-300"}`}>{p.brand ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.low_stock_at}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-1.5 text-purple-300 transition hover:bg-purple-50 hover:text-purple-600"
                        aria-label="Edit product"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="rounded-lg p-1.5 text-red-300 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-base font-semibold text-indigo-950">
              {editingId ? "Edit Product" : "Add Product"}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {formError && (
                <p className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
                  <AlertCircle size={16} />
                  {formError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="SKU *"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Category"
                  name="category"
                  value={form.category ?? ""}
                  onChange={handleChange}
                />
                <Field
                  label="Unit"
                  name="unit"
                  value={form.unit ?? ""}
                  onChange={handleChange}
                />
                <Field
                  label="MRP (₹)"
                  name="mrp"
                  type="number"
                  value={form.mrp ?? ""}
                  onChange={handleChange}
                />
                <Field
                  label="Selling Price (₹)"
                  name="selling_price"
                  type="number"
                  value={form.selling_price ?? ""}
                  onChange={handleChange}
                />
                <Field
                  label="Brand"
                  name="brand"
                  value={form.brand ?? ""}
                  onChange={handleChange}
                />
                <Field
                  label="Low Stock At"
                  name="low_stock_at"
                  type="number"
                  value={form.low_stock_at}
                  onChange={handleChange}
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
                  {submitting ? "Saving…" : editingId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>

            <button
              onClick={closeModal}
              aria-label="Close modal"
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

/* ── Reusable form field ─────────────────────────────────────────── */
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-medium text-gray-600"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={type === "number" ? 0 : undefined}
        className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
      />
    </div>
  );
}
