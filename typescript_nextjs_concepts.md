# TypeScript, React & Next.js — Concepts Cheat Sheet

> **Audience:** You know basic JavaScript. You're new to TypeScript, React, and Next.js.  
> Every example below is taken directly from this Golden Hardwares project.

---

## 1. TypeScript Types and Interfaces

**What it is:** TypeScript lets you describe the *shape* of your data so the editor catches mistakes before you run the code.

```ts
// types/index.ts

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;   // can be a string OR null
  unit: string | null;
  mrp: number | null;
  selling_price: number | null;
  brand: string | null;
  low_stock_at: number;
  created_at: string;
};

export type Sale = {
  id: string;
  bill_number: string;
  total_amount: number | null;
  discount: number;
  created_at: string;
};
```

**What this does:** Defines the exact fields a `Product` and a `Sale` must have. If you try to access `product.price` (which doesn't exist), TypeScript shows a red underline immediately.

---

## 2. `useState` and `useEffect` Hooks

**What it is:** `useState` stores a value that, when changed, re-renders the component. `useEffect` runs side-effects (like fetching data) after the component renders.

```tsx
// app/products/page.tsx

const [products, setProducts] = useState<Product[]>([]);  // start with empty array
const [loading, setLoading] = useState(true);             // start in loading state
const [query, setQuery] = useState("");                   // search box value

// Re-run loadProducts whenever debouncedQuery or page changes
useEffect(() => {
  loadProducts(debouncedQuery, page);
}, [debouncedQuery, page, loadProducts]);

// Debounce: wait 300 ms after the user stops typing before searching
useEffect(() => {
  const t = setTimeout(() => {
    setDebouncedQuery(query);
    setPage(0);
  }, 300);
  return () => clearTimeout(t);  // cleanup cancels the timer if the user types again
}, [query]);
```

**What this does:** The first `useEffect` fetches products from the database whenever the search term or page number changes. The second waits 300 ms after the user stops typing so we don't fire a request on every single keystroke.

---

## 3. Async / Await with Supabase Calls

**What it is:** `async/await` is the modern way to write code that waits for a slow operation (like a database call) without freezing the page.

```tsx
// app/products/page.tsx

const loadProducts = useCallback(async (q: string, pg: number) => {
  setLoading(true);
  setError(null);

  const from = pg * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  // Build the query
  let qb = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (q.trim()) {
    qb = qb.or(`name.ilike.%${q.trim()}%,sku.ilike.%${q.trim()}%`);
  }

  // await pauses here until Supabase responds
  const { data, error: fetchError, count } = await qb;

  if (fetchError) setError(fetchError.message);
  else {
    setProducts(data ?? []);
    setTotalCount(count ?? 0);
  }

  setLoading(false);
}, []);
```

**What this does:** Sends a paginated, searchable query to the `products` table and stores the results in state; if something goes wrong the error message is saved so the UI can show it.

---

## 4. Array Methods — `map`, `filter`, `reduce`

**What it is:** Built-in JavaScript methods that transform arrays without writing manual `for` loops.

```tsx
// app/stock/page.tsx  — summing all inventory_log entries per product

// map: turn the products array into a list of just their IDs
const productIds = products.map((p) => p.id);

// filter: keep only rows that have the "low-stock" status
const lowStock = rows.filter((r) => r.status === "low-stock").length;

// reduce: add up every change_qty to get the current stock total
const stockMap = new Map<string, { total: number; lastUpdated: string | null }>();

for (const log of typedLogs) {
  const existing = stockMap.get(log.product_id) ?? { total: 0, lastUpdated: null };
  existing.total += log.change_qty;   // accumulate positive (restock) and negative (sale) changes
  stockMap.set(log.product_id, existing);
}
```

```tsx
// app/ledger/page.tsx — reduce used directly

const totalExpenses = useMemo(
  () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
  [expenses],
);
```

**What this does:** `map` extracts IDs needed for a follow-up query; `filter` counts how many products are low on stock; `reduce` walks through every expense row and sums the amounts into one number.

---

## 5. Next.js App Router — File-Based Routing and `'use client'`

**What it is:** In Next.js 13+, every folder inside `app/` automatically becomes a URL route, and every file named `page.tsx` is the UI for that route. By default, pages run on the server; adding `'use client'` at the top opts them into the browser (needed for hooks and interactivity).

```
app/
  page.tsx          →  /          (dashboard)
  products/
    page.tsx        →  /products
    loading.tsx     →  shown automatically while page.tsx is loading
  stock/
    page.tsx        →  /stock
  ledger/
    page.tsx        →  /ledger
```

```tsx
// app/products/page.tsx — must be a Client Component because it uses useState/useEffect
"use client";

import { useState, useEffect } from "react";

export default function ProductsPage() {
  // hooks only work in Client Components
  const [products, setProducts] = useState<Product[]>([]);
  // ...
}
```

**What this does:** Placing `"use client"` at the very top of the file tells Next.js to send this component's JavaScript to the browser so React hooks and event listeners can work.

---

## 6. Optional Chaining (`?.`) and Nullish Coalescing (`??`)

**What it is:** `?.` safely reads a property that might not exist (instead of crashing). `??` provides a fallback value when something is `null` or `undefined`.

```tsx
// app/ledger/page.tsx

// ledger might be null if no record exists for today yet
const closingCash = (ledger?.opening_cash ?? 0) + salesTotal - cashExpenses;
const closingUpi  = (ledger?.opening_upi  ?? 0) + (ledger?.upi_in ?? 0) - upiExpenses;

// Prefill the form with today's values, or sensible defaults if ledger is null
setLedgerForm({
  opening_cash:  loadedLedger?.opening_cash  ?? 0,
  opening_upi:   loadedLedger?.opening_upi   ?? 0,
  upi_in:        loadedLedger?.upi_in        ?? 0,
  other_income:  loadedLedger?.other_income  ?? 0,
  notes:         loadedLedger?.notes         ?? "",
});
```

**What this does:** If `ledger` is `null` (no record for today), `ledger?.opening_cash` returns `undefined` instead of throwing an error, and `?? 0` turns that `undefined` into `0`, so the maths still works.

---

## 7. Destructuring (Objects and Arrays)

**What it is:** A shorthand to unpack values out of an object or array into named variables in one line.

```tsx
// Object destructuring — Supabase always returns { data, error }
const { data, error: fetchError, count } = await qb;
//                ^^^^^^^^^^^^^ rename "error" to "fetchError" to avoid name clashes

// app/stock/page.tsx — destructuring a Supabase response
const { data: products, error: pErr, count } = await pQuery;
const { data: logs,     error: lErr }        = await supabase
  .from("inventory_log")
  .select("product_id, change_qty, created_at")
  .in("product_id", productIds);

// app/ledger/page.tsx — array destructuring with Promise.all
const [ledgerRes, expenseRes, salesRes] = await Promise.all([
  supabase.from("daily_ledger").select("*").eq("date", selectedDate).maybeSingle(),
  supabase.from("expenses").select("*").eq("date", selectedDate),
  supabase.from("sales").select("total_amount").gte("created_at", startIso),
]);
```

**What this does:** Instead of writing `result.data` and `result.error` everywhere, destructuring pulls those properties into short local variable names in one step, making the code much easier to read.

---

## 8. Conditional Rendering in JSX

**What it is:** JSX lets you show different UI based on state — the same way an `if` statement works, but written inline inside the return.

```tsx
// app/products/page.tsx — three states: loading, empty, data

{loading ? (
  // Show spinner while fetching
  <div className="py-16 text-center text-sm text-gray-400">
    <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
    Loading products...
  </div>
) : products.length === 0 ? (
  // Show empty state when no products exist
  <div className="py-16 text-center">
    <PackageOpen className="mx-auto mb-3 h-10 w-10 text-purple-200" />
    <p className="text-sm text-gray-400">No products yet</p>
  </div>
) : (
  // Render the table when data is ready
  <table className="min-w-full">
    {/* ... */}
  </table>
)}

{/* Short-circuit: only render the error banner if there IS an error */}
{error && (
  <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
    <AlertCircle size={16} />
    {error}
  </div>
)}
```

**What this does:** The ternary chain renders a spinner, an empty-state illustration, or the full table depending on which state the component is in — users always see meaningful feedback.

---

## 9. Environment Variables in Next.js

**What it is:** Environment variables keep secrets (like API keys) out of your source code. In Next.js, only variables prefixed with `NEXT_PUBLIC_` are sent to the browser; all others stay server-side only.

```bash
# .env.local  (never commit this file to git)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

```ts
// app/lib/supabase.ts — reading the variables at runtime

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
```

**What this does:** Reads the Supabase URL and public API key from `.env.local`; if either is missing (e.g. someone clones the repo without creating their own `.env.local`), an early error is thrown with a helpful message instead of a cryptic crash later.

---

## 10. Tailwind CSS Utility Classes

**What it is:** Tailwind CSS gives you small, single-purpose class names that you compose directly in JSX instead of writing separate CSS files.

```tsx
// app/products/page.tsx — "Add Product" button
<button
  onClick={openAdd}
  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500
             px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
>
  <Plus size={16} />
  Add Product
</button>

// app/stock/page.tsx — status badge, colour changes based on value
const STATUS_STYLES: Record<StockRow["status"], string> = {
  "in-stock":     "bg-emerald-50 text-emerald-600",
  "low-stock":    "bg-amber-50  text-amber-600",
  "out-of-stock": "bg-red-50    text-red-500",
};

// used in JSX like:
<span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}>
  {STATUS_LABELS[row.status]}
</span>

// app/stock/loading.tsx — skeleton / pulse animation
<div className="h-4 w-36 animate-pulse rounded-lg bg-gray-100" />
```

**What this does:** The button gets a left-to-right amber-to-orange gradient, rounded corners, white text, and an opacity fade on hover — all without leaving the JSX file. The badge swaps between green, amber, and red classes depending on stock status, and the skeleton uses Tailwind's built-in `animate-pulse` to create a loading shimmer.

---

*Generated from the Golden Hardwares codebase — 2026-07-01*
