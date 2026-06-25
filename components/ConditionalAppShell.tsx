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
    let mounted = true;

    // onAuthStateChange fires immediately with the current session state
    // (INITIAL_SESSION event) AND on every subsequent change (SIGNED_IN,
    // SIGNED_OUT, TOKEN_REFRESHED). Using this as the single source of truth
    // avoids the race condition where getSession() resolves before the
    // Supabase client has persisted the session from a fresh login.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session && pathname === "/login") {
        router.replace("/");
      } else if (!session && pathname !== "/login") {
        router.replace("/login");
      } else {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
