"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  BookOpen,
  Hammer,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Receipt,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/stock", label: "Stock", icon: Layers, badge: 0 },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
];

function formatTodayDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const mobileNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/stock", label: "Stock", icon: Layers },
    { href: "/sales", label: "Sales", icon: Receipt },
    { href: "/ledger", label: "Ledger", icon: BookOpen },
  ];

  return (
    <div className="flex h-screen flex-row">
      <aside className="hidden w-[200px] flex-col border-r border-purple-100 bg-white md:flex">
        <div className="border-b border-purple-100 p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <Hammer size={18} className="text-white" />
          </div>
          <p className="text-sm font-medium text-indigo-950">Golden Hardwares</p>
          <p className="text-xs text-gray-400">Shop management</p>
        </div>

        <div className="px-2 py-3">
          <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-widest text-gray-300">Menu</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-0.5 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all hover:bg-purple-50 hover:text-purple-600 ${
                  isActive ? "bg-purple-50 font-medium text-purple-600" : "text-gray-500"
                }`}
              >
                <Icon size={15} className={isActive ? "text-purple-500" : "text-gray-400"} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <p className="mb-1 mt-3 px-2 text-[10px] font-medium uppercase tracking-widest text-gray-300">Reports</p>
          <Link
            href="/revenue"
            className={`mb-0.5 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all hover:bg-purple-50 hover:text-purple-600 ${
              pathname === "/revenue" ? "bg-purple-50 font-medium text-purple-600" : "text-gray-500"
            }`}
          >
            <BarChart2 size={15} className={pathname === "/revenue" ? "text-purple-500" : "text-gray-400"} />
            <span>Revenue</span>
          </Link>
        </div>

        <div className="mt-auto border-t border-purple-100 p-2">
          <button
            onClick={handleLogout}
            className="mb-0.5 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs text-gray-500 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <LogOut size={15} className="text-gray-400" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-auto bg-[#f8f7ff]">
        <header className="border-b border-purple-100 bg-white px-4 py-2.5 md:px-6 md:py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-indigo-950">Dashboard</p>
              <p className="hidden text-xs text-gray-400 sm:block">{formatTodayDate()}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/sales"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-xs font-medium text-white md:py-2"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Sale</span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-purple-100 p-2 text-gray-500 transition-all hover:bg-red-50 hover:text-red-500 md:hidden"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-purple-100 bg-white px-2 py-2 pb-safe md:hidden">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 ${
                  isActive ? "bg-purple-50 text-purple-600" : "text-gray-400"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
