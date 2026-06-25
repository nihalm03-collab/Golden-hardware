"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Printer, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ShopSettings = {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_gst: string;
};

export type PrintBillData = {
  bill_number: string;
  created_at: string;
  total_amount: number;
  discount: number;
  items: { name: string; qty: number; unit_price: number; subtotal: number }[];
};

export function BillPrintModal({
  bill,
  onClose,
}: {
  bill: PrintBillData;
  onClose: () => void;
}) {
  const [shop, setShop] = useState<ShopSettings | null>(null);

  useEffect(() => {
    supabase
      .from("shop_settings")
      .select("shop_name, shop_address, shop_phone, shop_gst")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setShop(data as ShopSettings | null));
  }, []);

  const subtotal = bill.items.reduce((s, i) => s + i.subtotal, 0);
  const dateStr = new Date(bill.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = new Date(bill.created_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const shopName = shop?.shop_name || "Shop";

  /* ── WhatsApp text ──────────────────────────────────────────────── */
  const waLines = [
    `*${shopName} — Receipt*`,
    `Bill No: ${bill.bill_number}`,
    `Date: ${dateStr} ${timeStr}`,
    ``,
    `*Items:*`,
    ...bill.items.map(
      (i) => `• ${i.name}  x${i.qty}  ₹${i.subtotal.toFixed(2)}`,
    ),
    ``,
    bill.discount > 0 ? `Discount: -₹${bill.discount.toFixed(2)}` : null,
    `*Total: ₹${bill.total_amount.toFixed(2)}*`,
    shop?.shop_phone ? `\nContact: ${shop.shop_phone}` : null,
    `Thank you! 🙏`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  /* ── Print in a new popup window ────────────────────────────────── */
  function handlePrint() {
    const w = window.open("", "_blank", "width=420,height=680");
    if (!w) return;

    const rows = bill.items
      .map(
        (i) => `
        <tr>
          <td>${i.name}</td>
          <td style="text-align:right">${i.qty}</td>
          <td style="text-align:right">₹${i.unit_price.toFixed(2)}</td>
          <td style="text-align:right">₹${i.subtotal.toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill ${bill.bill_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 380px; margin: 0 auto; color: #111; }
    .center { text-align: center; }
    .shop-name { font-size: 16px; font-weight: bold; }
    .divider { border-top: 1px dashed #555; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { text-align: left; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 11px; color: #555; }
    th:not(:first-child), td:not(:first-child) { text-align: right; }
    td { padding: 3px 0; }
    .total-row { border-top: 1px dashed #555; padding-top: 6px; margin-top: 4px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
    .subtotal-row { display: flex; justify-content: space-between; font-size: 12px; color: #444; }
    .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #888; }
    @media print { body { padding: 4px; } }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-name">${shopName}</div>
    ${shop?.shop_address ? `<div>${shop.shop_address}</div>` : ""}
    ${shop?.shop_phone ? `<div>Ph: ${shop.shop_phone}</div>` : ""}
    ${shop?.shop_gst ? `<div>GSTIN: ${shop.shop_gst}</div>` : ""}
  </div>

  <div class="divider"></div>

  <div style="display:flex; justify-content:space-between;">
    <span><strong>${bill.bill_number}</strong></span>
    <span>${dateStr} ${timeStr}</span>
  </div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amt</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="divider"></div>

  <div class="subtotal-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
  ${bill.discount > 0 ? `<div class="subtotal-row"><span>Discount</span><span>-₹${bill.discount.toFixed(2)}</span></div>` : ""}
  <div class="total-row"><span>Grand Total</span><span>₹${bill.total_amount.toFixed(2)}</span></div>

  <div class="footer">Thank you for your purchase!</div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`);
    w.document.close();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Actions bar */}
        <div className="flex items-center justify-between border-b border-purple-100 px-4 py-3">
          <p className="text-sm font-semibold text-indigo-950">Bill Preview</p>
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waLines)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-600"
            >
              <MessageCircle size={13} />
              WhatsApp
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
            >
              <Printer size={13} />
              Print
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Bill preview */}
        <div className="p-5 font-mono text-xs">
          {/* Shop header */}
          <div className="mb-3 border-b border-dashed border-gray-300 pb-3 text-center">
            <p className="text-sm font-bold text-gray-900">{shopName}</p>
            {shop?.shop_address && (
              <p className="mt-0.5 text-gray-500">{shop.shop_address}</p>
            )}
            {shop?.shop_phone && (
              <p className="text-gray-500">Ph: {shop.shop_phone}</p>
            )}
            {shop?.shop_gst && (
              <p className="font-semibold text-gray-600">GSTIN: {shop.shop_gst}</p>
            )}
          </div>

          {/* Bill meta */}
          <div className="mb-3 flex justify-between text-gray-500">
            <span className="font-bold text-gray-800">{bill.bill_number}</span>
            <span>
              {dateStr} {timeStr}
            </span>
          </div>

          {/* Items */}
          <table className="mb-3 w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400">
                <th className="pb-1 text-left font-medium">Item</th>
                <th className="pb-1 text-right font-medium">Qty</th>
                <th className="pb-1 text-right font-medium">Rate</th>
                <th className="pb-1 text-right font-medium">Amt</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1 text-gray-800">{item.name}</td>
                  <td className="py-1 text-right text-gray-600">{item.qty}</td>
                  <td className="py-1 text-right text-gray-600">
                    ₹{item.unit_price.toFixed(2)}
                  </td>
                  <td className="py-1 text-right font-semibold text-gray-800">
                    ₹{item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span className="text-red-500">-₹{bill.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1 text-sm font-bold text-gray-900">
              <span>Grand Total</span>
              <span>₹{bill.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <p className="mt-3 text-center text-gray-400">Thank you! 🙏</p>
        </div>
      </div>
    </div>
  );
}
