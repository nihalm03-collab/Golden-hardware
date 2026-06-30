# Golden Hardwares — Interview Preparation

> Honest, accurate answers based on the actual codebase. Every claim references real code.

---

## Q1. Why did you choose Next.js + Supabase instead of a traditional backend (Node/Express + separate DB)?

**Answer:**  
For a single-owner shop management tool, a traditional backend would add significant overhead — I'd have to maintain a server, write REST endpoints, handle auth middleware, and manage deployments for both a frontend and a backend. Supabase gives a PostgreSQL database, a REST API, and authentication out of the box, and the `@supabase/ssr` client works directly from Next.js React components. Next.js App Router handled routing, server-side rendering, and deployment to Vercel in one framework. The combination let me ship a complete, production-grade app faster without sacrificing any real capability needed for this scale.

---

## Q2. Walk me through the database schema — what tables exist and how are they related?

**Answer:**  
There are six core tables in `supabase/schema.sql`. `products` stores the catalogue (name, SKU, MRP, selling price, low-stock threshold). `inventory_log` records every stock movement as a row with a `change_qty` (positive for restocks, negative for sales) and a foreign key back to `products`. `sales` holds each bill (bill number, total, discount). `sale_items` is the line-item detail for each sale, referencing both `sales` and `products`. `daily_ledger` stores one row per calendar date with opening cash/UPI balances, UPI-in, and other income. `expenses` records outgoing payments with a category (`purchase`, `petrol`, `chai/food`, etc.) and `payment_mode`. There is also a `shop_settings` table (referenced in `BillPrintModal.tsx`) that stores the shop name, address, phone, and GST number for receipts.

---

## Q3. How is current stock calculated? Why not just store a `stock_quantity` column on the `products` table?

**Answer:**  
Stock is the **sum of all `change_qty` values** in `inventory_log` for a given product — there is no single "current stock" column. When a product is restocked, a row is inserted with a positive `change_qty` (e.g. `+50`). When a sale happens, a row is inserted with a negative value (e.g. `-2`). The running total is derived at query time. This approach gives a full audit trail for free — you can see every stock movement, when it happened, and whether it was a sale or a manual restock. A simple integer column would be faster to read but would lose all history and would be vulnerable to race conditions with concurrent writes.

```ts
// app/stock/page.tsx
const stockMap = new Map<string, { total: number; lastUpdated: string | null }>();
for (const log of typedLogs) {
  const existing = stockMap.get(log.product_id) ?? { total: 0, lastUpdated: null };
  existing.total += log.change_qty;  // accumulates +restocks and -sales
  stockMap.set(log.product_id, existing);
}
```

---

## Q4. How does completing a sale work? Walk through the exact sequence of database writes.

**Answer:**  
In `app/sales/page.tsx`, the `completeSale` function performs three sequential Supabase inserts. First, a row is inserted into `sales` with a generated bill number (`S-0001`, `S-0002`, …) derived by counting existing sales and padding the number. Second, one row per cart item is inserted into `sale_items` (referencing the new `sale_id`, the `product_id`, quantity, unit price, and subtotal). Third, one row per cart item is inserted into `inventory_log` with a **negative** `change_qty` and `reason: "sale"`, so the stock calculation picks it up automatically. If any step fails, a toast error is shown and the function exits early — there is no database transaction wrapping all three steps, which is a known limitation (a partial failure could leave an orphan sale row with no items).

---

## Q5. How do you use TypeScript throughout the project? Does it integrate with Supabase?

**Answer:**  
All domain types are defined in `types/index.ts` — `Product`, `Sale`, `SaleItem`, `InventoryLog`, etc. — and imported wherever those shapes are used. Supabase's JS client returns `unknown`-typed data, so the codebase uses explicit type assertions (`data as Product[]`) and the `type` import (`import type { Product } from "@/types"`) to keep TypeScript happy without generating a full Supabase schema type file. Utility types are also used — for example `Omit<Product, "id" | "created_at">` creates the `ProductForm` type in the products page, so form state never accidentally includes read-only server fields. The `friendlyError` function is typed to accept `unknown` so it safely handles both `Error` objects and raw strings from Supabase.

---

## Q6. You have no Redux or Zustand. How do you manage state across the app?

**Answer:**  
At this scale, React's built-in `useState` and `useEffect` are sufficient — each page manages its own local state (products list, loading flag, modal open/closed, form values) and there is no shared global state that multiple pages need to read simultaneously. The one piece of "global" UI state — toast notifications — is handled with a custom `ToastContext` in `components/Toaster.tsx`, which wraps the whole app in `AppShell.tsx`. Pages call `useToast()` to show messages. If the app grew to need cross-page cart persistence or user preferences, a lightweight store like Zustand would be the natural next step, but adding it now would be premature complexity.

---

## Q7. How did you approach mobile responsiveness? What layout decisions did you make?

**Answer:**  
The app uses a sidebar layout on desktop and a bottom navigation bar on mobile — a common native app pattern that feels natural for shop staff using a phone. In `AppShell.tsx`, the sidebar `<aside>` has `hidden md:flex` (hidden below 768 px, visible on medium+ screens), and the bottom nav uses `flex md:hidden` (visible only on mobile). Tailwind's responsive prefixes (`md:`, `xl:`, `grid-cols-1 xl:grid-cols-2`) handle all the breakpoints without any custom CSS. The sales page, for example, stacks the "New Sale" panel and "Today's Bills" panel vertically on mobile and side-by-side on wide screens.

---

## Q8. The app has a login page and middleware — but is there real authentication and security right now?

**Answer:**  
The authentication infrastructure exists and is wired up: `middleware.ts` uses `@supabase/ssr` to check for a valid session on every request and redirects unauthenticated users to `/login`. The `AppShell` has a working logout button that calls `supabase.auth.signOut()`. However, **Row Level Security (RLS) is currently disabled** on the Supabase tables — the migration to enable it (`supabase/migrations/001_enable_rls.sql`) has been written and is ready to run, but has not been applied to the live database. This means that anyone with the anon key could query the data directly via the Supabase REST API, bypassing the Next.js login screen entirely. The immediate fix is to run that migration; for proper multi-user support you'd also need per-user data isolation (separate policies per user ID or per organisation).

---

## Q9. How is the app deployed? What's the release process?

**Answer:**  
The app is deployed on **Vercel**, connected to the GitHub repository. Every push to the main branch triggers an automatic build and deployment — no manual steps required. Environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are set in the Vercel project settings and are never committed to the repository. The `next.config.mjs` is intentionally minimal — no custom server configuration is needed because Vercel handles Next.js natively. Database schema changes are managed manually by running SQL in the Supabase dashboard SQL editor, since there is no automated migration runner wired into CI at this stage.

---

## Q10. Tell me about your error handling strategy — how does `friendlyError` work?

**Answer:**  
Supabase surfaces PostgreSQL error messages verbatim — strings like `"duplicate key value violates unique constraint \"products_sku_key\""` — which are accurate but completely unreadable to a shop owner. The `friendlyError` utility in `app/lib/errors.ts` inspects the raw message with `includes()` checks and maps known Postgres error patterns to plain English: duplicate key → "This SKU already exists", foreign key violation → "This item is linked to other records", network errors → "Check your internet". The function accepts `unknown` (not just `string`) so it handles both `Error` objects and raw strings safely. Any error that doesn't match a known pattern falls back to "Something went wrong. Please try again." rather than leaking internal details.

---

## Q11. The toast notification system — why build your own instead of using a library like react-hot-toast?

**Answer:**  
The custom `ToastProvider` in `components/Toaster.tsx` is about 80 lines and covers everything the app needs: three types (success, error, info), a 3.5-second auto-dismiss, a maximum of 5 visible toasts at once (`.slice(-4)`), and a manual dismiss button. Pulling in a library would add a dependency, a different API to learn, and styles that may conflict with Tailwind — for this limited feature set the tradeoff wasn't worth it. The implementation uses React Context so any component in the tree can call `useToast()` without prop drilling, which is exactly the same pattern libraries use internally. If toast requirements grew more complex (queuing, progress bars, persistent toasts) a library would become the better choice.

---

## Q12. How does the WhatsApp share feature on the bill work technically?

**Answer:**  
In `BillPrintModal.tsx`, a `waLines` array is built by composing the bill data — shop name, bill number, date, item list (one bullet point per item), discount, total, and a "Thank you" footer — into a WhatsApp-formatted string (bold text uses `*asterisks*`). The array is filtered to remove `null` lines (e.g. the discount line is omitted if discount is zero) and joined with newlines. Clicking the share button opens `https://wa.me/?text=${encodeURIComponent(waLines)}` in a new tab — the `wa.me` URL scheme pre-populates WhatsApp Web or the mobile app with that text ready to send to any contact. No WhatsApp API key is needed; this works through the universal deep-link scheme.

---

## Q13. Walk me through how the daily ledger calculates gross profit and net profit.

**Answer:**  
In `app/ledger/page.tsx`, the profit calculation is a chain of simple arithmetic on state values. `salesTotal` is fetched from the `sales` table filtered by the selected date. Expenses are split into two buckets using `filter`: `purchaseExpenses` (category `=== "purchase"`) and `otherExpenses` (everything else). `grossProfit = salesTotal - purchaseExpenses` — this is profit before operating costs, since purchase is the cost of goods sold. `netProfit = grossProfit - otherExpenses` deducts petrol, chai, agent commissions, and miscellaneous costs. The ledger also tracks `closingCash = opening_cash + salesTotal - cashExpenses` and `closingUpi = opening_upi + upi_in - upiExpenses` to show the physical cash-in-hand and UPI balance at end of day.

---

## Q14. If you had more time, what would you improve or add?

**Answer:**  
The most critical unfinished item is **applying the RLS migration** and enabling multi-user auth so the database is actually protected at the row level, not just behind a Next.js redirect. Beyond security, I'd add **date-range filters and CSV export to the sales history page** — right now you can only see today's bills on the sales page. **Barcode scanning** via the browser's `BarcodeDetector` API (or a library like `html5-qrcode`) would make stock-taking and product lookup much faster for shop staff. I'd also add a **proper database transaction** around the three-step sale completion (insert sale → sale_items → inventory_log) so a failed step can't leave partial records. Finally, the `bill_number` generation currently counts total rows to produce the next number, which has a race condition under concurrent sales — a Supabase sequence or a database trigger would be more robust.

---

## Q15. You used GitHub Copilot heavily during development. What exactly was your role vs the AI's role?

**Answer:**  
My role was **system design, product decisions, and architecture** — I decided the database schema (the inventory-log pattern for stock, the ledger structure, which tables were needed), the user experience (bottom nav for mobile, the sales cart workflow, what calculations the ledger should show), and every non-obvious trade-off (no Redux, custom toast, log-based stock instead of a column). Copilot's role was **code generation and acceleration** — given a clear description of what a function should do, it produced the boilerplate, the Supabase query structure, the Tailwind class combinations, and the TypeScript types. I reviewed every suggestion, rejected ones that were architecturally wrong (e.g. it initially suggested storing stock as a column), and debugged issues the generated code introduced. Think of it as having a very fast junior developer who writes code quickly but needs direction on *what* to build and *why* — the judgement and the design are still entirely the developer's responsibility.

---

*Prepared for Golden Hardwares project — 2026-07-01*
