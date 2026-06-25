"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Car,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Loader2,
  Plus,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type DailyLedgerRow = {
  id: string;
  date: string;
  opening_cash: number | null;
  opening_upi: number | null;
  upi_in: number | null;
  other_income: number | null;
  notes: string | null;
};

type ExpenseRow = {
  id: string;
  date: string;
  category: "purchase" | "petrol" | "travel" | "agent" | "chai/food" | "misc";
  amount: number;
  paid_to: string | null;
  note: string | null;
  payment_mode: "cash" | "upi";
  created_at: string | null;
};

type ExpenseCategory = ExpenseRow["category"];
type PaymentMode = ExpenseRow["payment_mode"];

function getTodayDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(n: number) {
  return `₹${n.toFixed(2)}`;
}

function formatReadableDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function shiftDate(dateStr: string, byDays: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + byDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function categoryMeta(category: ExpenseCategory) {
  if (category === "purchase") {
    return {
      icon: ShoppingBag,
      iconClass: "text-purple-500",
      boxClass: "bg-purple-50",
    };
  }
  if (category === "petrol") {
    return {
      icon: Car,
      iconClass: "text-orange-500",
      boxClass: "bg-orange-50",
    };
  }
  if (category === "travel") {
    return {
      icon: Car,
      iconClass: "text-blue-500",
      boxClass: "bg-blue-50",
    };
  }
  if (category === "agent") {
    return {
      icon: Users,
      iconClass: "text-indigo-500",
      boxClass: "bg-indigo-50",
    };
  }
  if (category === "chai/food") {
    return {
      icon: Coffee,
      iconClass: "text-amber-500",
      boxClass: "bg-amber-50",
    };
  }
  return {
    icon: Wallet,
    iconClass: "text-gray-500",
    boxClass: "bg-gray-50",
  };
}

export default function LedgerPage() {
  const today = useMemo(() => getTodayDateStr(), []);

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [ledger, setLedger] = useState<DailyLedgerRow | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [salesTotal, setSalesTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const [ledgerForm, setLedgerForm] = useState({
    opening_cash: 0,
    opening_upi: 0,
    upi_in: 0,
    other_income: 0,
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState<{
    category: ExpenseCategory;
    amount: number;
    paid_to: string;
    note: string;
    payment_mode: PaymentMode;
  }>({
    category: "purchase",
    amount: 0,
    paid_to: "",
    note: "",
    payment_mode: "cash",
  });

  const [submittingLedger, setSubmittingLedger] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startIso = `${selectedDate}T00:00:00`;
    const endIso = `${selectedDate}T23:59:59.999`;

    const [ledgerRes, expenseRes, salesRes] = await Promise.all([
      supabase.from("daily_ledger").select("*").eq("date", selectedDate).maybeSingle(),
      supabase
        .from("expenses")
        .select("*")
        .eq("date", selectedDate)
        .order("created_at", { ascending: false }),
      supabase
        .from("sales")
        .select("total_amount")
        .gte("created_at", startIso)
        .lte("created_at", endIso),
    ]);

    if (ledgerRes.error || expenseRes.error || salesRes.error) {
      setError(
        ledgerRes.error?.message ??
          expenseRes.error?.message ??
          salesRes.error?.message ??
          "Failed to load ledger data.",
      );
      setLoading(false);
      return;
    }

    const loadedLedger = (ledgerRes.data as DailyLedgerRow | null) ?? null;
    const loadedExpenses = (expenseRes.data ?? []) as ExpenseRow[];
    const loadedSales = (salesRes.data ?? []) as Array<{ total_amount: number | null }>;

    setLedger(loadedLedger);
    setExpenses(loadedExpenses);
    setSalesTotal(loadedSales.reduce((sum, s) => sum + (s.total_amount ?? 0), 0));

    setLedgerForm({
      opening_cash: loadedLedger?.opening_cash ?? 0,
      opening_upi: loadedLedger?.opening_upi ?? 0,
      upi_in: loadedLedger?.upi_in ?? 0,
      other_income: loadedLedger?.other_income ?? 0,
      notes: loadedLedger?.notes ?? "",
    });

    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const totalIn = salesTotal + (ledger?.upi_in ?? 0) + (ledger?.other_income ?? 0);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses],
  );

  const purchaseExpenses = useMemo(
    () => expenses.filter((e) => e.category === "purchase").reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses],
  );

  const otherExpenses = totalExpenses - purchaseExpenses;
  const grossProfit = salesTotal - purchaseExpenses;
  const netProfit = grossProfit - otherExpenses;

  const cashExpenses = useMemo(
    () => expenses.filter((e) => e.payment_mode === "cash").reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses],
  );

  const upiExpenses = useMemo(
    () => expenses.filter((e) => e.payment_mode === "upi").reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses],
  );

  const closingCash = (ledger?.opening_cash ?? 0) + salesTotal - cashExpenses;
  const closingUpi = (ledger?.opening_upi ?? 0) + (ledger?.upi_in ?? 0) - upiExpenses;

  const isToday = selectedDate === today;

  function goPrevDay() {
    setSelectedDate((prev) => shiftDate(prev, -1));
  }

  function goNextDay() {
    if (isToday) return;
    setSelectedDate((prev) => {
      const next = shiftDate(prev, 1);
      return next > today ? today : next;
    });
  }

  async function saveLedgerSetup(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingLedger(true);
    setError(null);

    const payload = {
      date: selectedDate,
      opening_cash: ledgerForm.opening_cash,
      opening_upi: ledgerForm.opening_upi,
      upi_in: ledgerForm.upi_in,
      other_income: ledgerForm.other_income,
      notes: ledgerForm.notes.trim() || null,
    };

    const { error: upsertError } = await supabase
      .from("daily_ledger")
      .upsert(payload, { onConflict: "date" });

    if (upsertError) {
      setError(upsertError.message);
      setSubmittingLedger(false);
      return;
    }

    setSubmittingLedger(false);
    setShowLedgerModal(false);
    await loadPageData();
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (expenseForm.amount <= 0) {
      setError("Expense amount must be greater than 0.");
      return;
    }

    setSubmittingExpense(true);
    setError(null);

    const { error: insertError } = await supabase.from("expenses").insert({
      date: selectedDate,
      category: expenseForm.category,
      amount: expenseForm.amount,
      paid_to: expenseForm.paid_to.trim() || null,
      note: expenseForm.note.trim() || null,
      payment_mode: expenseForm.payment_mode,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmittingExpense(false);
      return;
    }

    setSubmittingExpense(false);
    setShowExpenseModal(false);
    setExpenseForm({
      category: "purchase",
      amount: 0,
      paid_to: "",
      note: "",
      payment_mode: "cash",
    });
    await loadPageData();
  }

  async function handleDeleteExpense(expenseId: string) {
    const confirmed = window.confirm("Delete this expense entry?");
    if (!confirmed) return;

    const { error: deleteErr } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (deleteErr) {
      setError(deleteErr.message);
      return;
    }

    await loadPageData();
  }

  return (
    <section className="min-h-full bg-[#f8f7ff] p-6">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={goPrevDay}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-purple-100 bg-white transition hover:bg-purple-50"
          aria-label="Previous day"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>

        <div className="relative">
          <button
            onClick={() => dateInputRef.current?.click()}
            className="cursor-pointer rounded-lg border border-purple-100 bg-white px-3 py-1.5 text-sm font-medium text-indigo-950 transition hover:bg-purple-50"
          >
            {formatReadableDate(selectedDate)}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            max={today}
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        {!isToday && (
          <button
            onClick={() => setSelectedDate(today)}
            className="rounded-lg border border-purple-100 bg-white px-2.5 py-1.5 text-xs font-medium text-purple-600 transition hover:bg-purple-50"
          >
            Today
          </button>
        )}

        <button
          onClick={goNextDay}
          disabled={isToday}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-purple-100 bg-white transition ${
            isToday
              ? "cursor-not-allowed text-gray-300"
              : "cursor-pointer hover:bg-purple-50"
          }`}
          aria-label="Next day"
        >
          <ChevronRight size={16} className={isToday ? "text-gray-300" : "text-gray-600"} />
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-purple-100 bg-white py-16 text-center text-sm text-gray-400">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
          Loading ledger...
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Wallet size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">{formatCurrency(salesTotal)}</p>
              <p className="text-xs text-gray-400">Today&apos;s sales</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-emerald-400 to-green-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowDownCircle size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">{formatCurrency(totalIn)}</p>
              <p className="text-xs text-gray-400">Total money in</p>
              <p className="mt-0.5 text-[10px] text-gray-400">incl. UPI + other</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-rose-400 to-red-500" />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <ArrowUpCircle size={18} />
              </div>
              <p className="mb-0.5 text-2xl font-semibold text-gray-900">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-gray-400">Total spent</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5">
              <div
                className={`absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${
                  netProfit >= 0 ? "from-amber-400 to-orange-500" : "from-red-400 to-rose-500"
                }`}
              />
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                  netProfit >= 0 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                }`}
              >
                <TrendingUp size={18} />
              </div>
              <p className={`mb-0.5 text-2xl font-semibold ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatCurrency(netProfit)}
              </p>
              <p className="text-xs text-gray-400">Net profit</p>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="mb-4 rounded-2xl border border-purple-100 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">Day Setup</h2>
                  <button
                    onClick={() => setShowLedgerModal(true)}
                    className="text-xs text-purple-500 transition hover:text-purple-700"
                  >
                    Edit
                  </button>
                </div>

                {[
                  {
                    label: "Opening Cash",
                    value: ledger?.opening_cash ?? 0,
                    Icon: Banknote,
                    iconClass: "text-gray-400",
                  },
                  {
                    label: "Opening UPI",
                    value: ledger?.opening_upi ?? 0,
                    Icon: Smartphone,
                    iconClass: "text-gray-400",
                  },
                  {
                    label: "UPI Received",
                    value: ledger?.upi_in ?? 0,
                    Icon: ArrowDownCircle,
                    iconClass: "text-emerald-500",
                  },
                  {
                    label: "Other Income",
                    value: ledger?.other_income ?? 0,
                    Icon: Plus,
                    iconClass: "text-emerald-500",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50">
                      <row.Icon size={14} className={row.iconClass} />
                    </div>
                    <p className="flex-1 text-xs text-gray-500">{row.label}</p>
                    <p className="text-sm font-medium text-gray-800">{formatCurrency(row.value)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-800">Balance</h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-600">Cash closing</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(closingCash)}</p>
                    <p className="mt-1 text-[10px] text-emerald-500">
                      Opening {formatCurrency(ledger?.opening_cash ?? 0)} + Sales {formatCurrency(salesTotal)} - Cash expenses {formatCurrency(cashExpenses)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs text-blue-600">UPI closing</p>
                    <p className="mt-1 text-lg font-semibold text-blue-700">{formatCurrency(closingUpi)}</p>
                    <p className="mt-1 text-[10px] text-blue-500">
                      Opening {formatCurrency(ledger?.opening_upi ?? 0)} + UPI in {formatCurrency(ledger?.upi_in ?? 0)} - UPI expenses {formatCurrency(upiExpenses)}
                    </p>
                  </div>
                </div>

                <div className="my-4 h-px bg-gray-100" />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-700">
                    <span>Sales</span>
                    <span>{formatCurrency(salesTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Stock purchases</span>
                    <span className="text-red-500">-{formatCurrency(purchaseExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium text-emerald-600">
                    <span>Gross profit</span>
                    <span>{formatCurrency(grossProfit)}</span>
                  </div>
                  <div className="my-2 h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Other expenses</span>
                    <span className="text-red-500">-{formatCurrency(otherExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-800">Net profit</span>
                    <span className={netProfit >= 0 ? "text-emerald-600" : "text-red-500"}>{formatCurrency(netProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Expenses</h2>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-3 md:py-1.5 text-xs font-medium text-white"
                >
                  <Plus size={12} />
                  Add Expense
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="py-8 text-center">
                  <Coffee className="mx-auto mb-2 h-8 w-8 text-purple-100" />
                  <p className="text-xs text-gray-400">No expenses recorded today</p>
                </div>
              ) : (
                <ul>
                  {expenses.map((expense) => {
                    const meta = categoryMeta(expense.category);
                    const Icon = meta.icon;
                    return (
                      <li key={expense.id} className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${meta.boxClass}`}>
                          <Icon size={14} className={meta.iconClass} />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize text-gray-800">{expense.category}</p>
                          {(expense.paid_to || expense.note) && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {expense.paid_to ?? ""}
                              {expense.paid_to && expense.note ? " • " : ""}
                              {expense.note ?? ""}
                            </p>
                          )}
                        </div>

                        <div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              expense.payment_mode === "cash"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {expense.payment_mode === "cash" ? "Cash" : "UPI"}
                          </span>
                          <p className="mt-1 text-right text-sm font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="ml-2 text-gray-300 transition hover:text-red-400"
                          aria-label="Delete expense"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {showLedgerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLedgerModal(false);
          }}
        >
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl md:rounded-2xl md:max-w-lg max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:max-h-[90vh] max-md:overflow-y-auto">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 md:hidden" />
            <h3 className="mb-4 text-base font-semibold text-indigo-950">Day Setup</h3>

            <form onSubmit={saveLedgerSetup} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Opening Cash Balance (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={ledgerForm.opening_cash}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, opening_cash: Number(e.target.value) }))}
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Opening UPI Balance (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={ledgerForm.opening_upi}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, opening_upi: Number(e.target.value) }))}
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">UPI Received today (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={ledgerForm.upi_in}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, upi_in: Number(e.target.value) }))}
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Other Income (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={ledgerForm.other_income}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, other_income: Number(e.target.value) }))}
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Notes</label>
                <textarea
                  value={ledgerForm.notes}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLedger}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submittingLedger ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExpenseModal(false);
          }}
        >
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl md:rounded-2xl md:max-w-lg max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:max-h-[90vh] max-md:overflow-y-auto">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 md:hidden" />
            <h3 className="mb-4 text-base font-semibold text-indigo-950">Add Expense</h3>

            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      category: e.target.value as ExpenseCategory,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                >
                  <option value="purchase">purchase</option>
                  <option value="petrol">petrol</option>
                  <option value="travel">travel</option>
                  <option value="agent">agent</option>
                  <option value="chai/food">chai/food</option>
                  <option value="misc">misc</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={expenseForm.amount || ""}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Paid to</label>
                <input
                  type="text"
                  value={expenseForm.paid_to}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, paid_to: e.target.value }))}
                  placeholder="e.g. Ramesh supplier"
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Note</label>
                <input
                  type="text"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. Morning chai for 3"
                  className="h-11 w-full rounded-xl border border-purple-100 px-3 py-2.5 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Payment mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseForm((prev) => ({ ...prev, payment_mode: "cash" }))}
                    className={`rounded-lg px-4 py-1.5 text-sm ${
                      expenseForm.payment_mode === "cash"
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-200 text-gray-500"
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseForm((prev) => ({ ...prev, payment_mode: "upi" }))}
                    className={`rounded-lg px-4 py-1.5 text-sm ${
                      expenseForm.payment_mode === "upi"
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-200 text-gray-500"
                    }`}
                  >
                    UPI
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submittingExpense ? "Saving..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
