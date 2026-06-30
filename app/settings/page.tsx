"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Loader2,
  Phone,
  Save,
  Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toaster";
import { friendlyError } from "@/lib/errors";

type ShopSettings = {
  id: number;
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_gst: string;
  low_stock_threshold: number;
};

const DEFAULT: Omit<ShopSettings, "id"> = {
  shop_name: "",
  shop_address: "",
  shop_phone: "",
  shop_gst: "",
  low_stock_threshold: 5,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<Omit<ShopSettings, "id">>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (fetchErr) {
        toast(friendlyError(fetchErr.message), "error");
      } else if (data) {
        const row = data as ShopSettings;
        setForm({
          shop_name: row.shop_name ?? "",
          shop_address: row.shop_address ?? "",
          shop_phone: row.shop_phone ?? "",
          shop_gst: row.shop_gst ?? "",
          low_stock_threshold: row.low_stock_threshold ?? 5,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error: upsertErr } = await supabase.from("shop_settings").upsert(
      { id: 1, ...form },
      { onConflict: "id" },
    );

    if (upsertErr) {
      toast(friendlyError(upsertErr.message), "error");
    } else {
      toast("Settings saved successfully!");
    }
    setSaving(false);
  }

  function set(field: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
          <Settings size={18} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Settings</h1>
          <p className="text-sm text-gray-400">Configure your shop details</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-purple-100 bg-white py-16 text-center text-sm text-gray-400">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
          Loading settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Shop Info */}
          <div className="rounded-2xl border border-purple-100 bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
              <Building2 size={16} className="text-purple-500" />
              <h2 className="text-sm font-semibold text-gray-800">Shop Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Shop Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.shop_name}
                  onChange={(e) => set("shop_name", e.target.value)}
                  placeholder="e.g. Golden Hardwares"
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3.5 text-gray-300" />
                  <input
                    type="tel"
                    value={form.shop_phone}
                    onChange={(e) => set("shop_phone", e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="h-11 w-full rounded-xl border border-purple-100 py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Shop Address
                </label>
                <textarea
                  rows={2}
                  value={form.shop_address}
                  onChange={(e) => set("shop_address", e.target.value)}
                  placeholder="e.g. 12, Main Road, Coimbatore - 641001"
                  className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>

          {/* GST & Billing */}
          <div className="rounded-2xl border border-purple-100 bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
              <FileText size={16} className="text-purple-500" />
              <h2 className="text-sm font-semibold text-gray-800">GST & Billing</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  GST Number
                </label>
                <input
                  type="text"
                  value={form.shop_gst}
                  onChange={(e) => set("shop_gst", e.target.value.toUpperCase())}
                  placeholder="e.g. 33ABCDE1234F1Z5"
                  maxLength={15}
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 font-mono text-sm uppercase text-gray-700 placeholder-gray-300 placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <p className="mt-1 text-[10px] text-gray-400">Leave blank if not registered for GST</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.low_stock_threshold}
                  onChange={(e) => set("low_stock_threshold", Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Show alert when stock falls below this number
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {(form.shop_name || form.shop_phone || form.shop_address) && (
            <div className="rounded-2xl border border-purple-100 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-800">Bill Header Preview</h2>
              <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/40 p-4 text-center">
                {form.shop_name && (
                  <p className="text-base font-bold text-indigo-950">{form.shop_name}</p>
                )}
                {form.shop_address && (
                  <p className="mt-0.5 text-xs text-gray-500">{form.shop_address}</p>
                )}
                {form.shop_phone && (
                  <p className="mt-0.5 text-xs text-gray-500">Ph: {form.shop_phone}</p>
                )}
                {form.shop_gst && (
                  <p className="mt-0.5 text-xs font-medium text-gray-600">
                    GSTIN: {form.shop_gst}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
