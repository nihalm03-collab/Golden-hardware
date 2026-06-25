-- ============================================================
-- 001_enable_rls.sql
--
-- Enable Row Level Security on all application tables and
-- create policies that allow only authenticated users to
-- perform any operation (SELECT / INSERT / UPDATE / DELETE).
--
-- Run this once in the Supabase SQL Editor for your project.
-- ============================================================

-- Enable RLS
alter table products        enable row level security;
alter table inventory_log   enable row level security;
alter table sales            enable row level security;
alter table sale_items       enable row level security;
alter table daily_ledger     enable row level security;
alter table expenses         enable row level security;

-- Policies: any authenticated session can do everything.
-- "using (true)"      → allows reading all rows
-- "with check (true)" → allows writing all rows
-- Change "for all" to specific verbs (select/insert/update/delete)
-- if you later need finer-grained control.

create policy "authenticated_all_products"
  on products for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_inventory_log"
  on inventory_log for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_sales"
  on sales for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_sale_items"
  on sale_items for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_daily_ledger"
  on daily_ledger for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_expenses"
  on expenses for all
  to authenticated
  using (true)
  with check (true);
