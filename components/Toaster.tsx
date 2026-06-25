"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

/* ── Context ─────────────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Provider + Renderer ────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
      const timer = setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  // cleanup on unmount
  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(clearTimeout); };
  }, []);

  const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />,
    error: <AlertCircle size={16} className="shrink-0 text-red-500" />,
    info: <Info size={16} className="shrink-0 text-blue-500" />,
  };

  const BG: Record<ToastType, string> = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    error: "border-red-100 bg-red-50 text-red-700",
    info: "border-blue-100 bg-blue-50 text-blue-700",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — fixed top-right */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2 md:right-6 md:top-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex w-80 max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${BG[t.type]} animate-in slide-in-from-right-5 fade-in duration-200`}
          >
            {ICONS[t.type]}
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
