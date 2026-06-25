"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // If we're already on /login, start as ready so the page renders immediately.
  // Otherwise start as false so we show a blank screen while we verify the session.
  const [ready, setReady] = useState(pathname === "/login");

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== "/login") {
        router.replace("/login");
        // Keep ready = false so we show nothing while redirecting
      } else if (session && pathname === "/login") {
        router.replace("/");
        // Keep ready = false while redirecting
      } else {
        setReady(true);
      }
    });

    // Watch for sign-out (e.g. session expiry or logout from another tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/login") {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login page renders without the AppShell chrome
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show a blank background while auth check is in flight
  if (!ready) {
    return <div className="min-h-screen bg-[#f8f7ff]" />;
  }

  return <AppShell>{children}</AppShell>;
}
