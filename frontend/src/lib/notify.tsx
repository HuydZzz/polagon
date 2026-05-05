"use client";

/**
 * Lightweight toast/notification system.
 *
 * Each notification has a kind (info | success | error | loading) and an
 * optional handle returned from `notify()` that lets callers `update` or
 * `dismiss` the same toast — used by `useTx` to morph one toast through
 * "signing → pending → confirmed".
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "info" | "success" | "error" | "loading";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  href?: string; // optional CTA link (e.g. block explorer)
  hrefLabel?: string;
}

export interface ToastHandle {
  id: string;
  update: (patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: () => void;
}

interface NotifyApi {
  toasts: Toast[];
  notify: (t: Omit<Toast, "id"> & { ttl?: number | null }) => ToastHandle;
  dismiss: (id: string) => void;
}

const NotifyContext = createContext<NotifyApi | null>(null);

const DEFAULT_TTL: Record<ToastKind, number | null> = {
  info: 4000,
  success: 5000,
  error: 7000,
  loading: null, // sticky until updated/dismissed
};

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timersRef.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timersRef.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, ttl: number | null) => {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      if (ttl == null) return;
      const handle = setTimeout(() => dismiss(id), ttl);
      timersRef.current.set(id, handle);
    },
    [dismiss],
  );

  const notify = useCallback<NotifyApi["notify"]>(
    (input) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const toast: Toast = { id, kind: input.kind, title: input.title, body: input.body, href: input.href, hrefLabel: input.hrefLabel };
      setToasts((prev) => [...prev, toast]);
      const ttl = input.ttl ?? DEFAULT_TTL[input.kind];
      scheduleDismiss(id, ttl);

      return {
        id,
        update: (patch) => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          );
          if (patch.kind) {
            scheduleDismiss(id, DEFAULT_TTL[patch.kind]);
          }
        },
        dismiss: () => dismiss(id),
      };
    },
    [dismiss, scheduleDismiss],
  );

  useEffect(() => {
    const map = timersRef.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  const api = useMemo<NotifyApi>(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);

  return (
    <NotifyContext.Provider value={api}>
      {children}
      <ToastViewport />
    </NotifyContext.Provider>
  );
}

export function useNotify(): NotifyApi {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error("useNotify must be inside <NotifyProvider>");
  return ctx;
}

function ToastViewport() {
  const { toasts, dismiss } = useNotify();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(94vw,360px)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto"
          >
            <ToastCard toast={t} onClose={() => dismiss(t.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const tone = TONES[toast.kind];
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border ${tone.border} ${tone.bg} px-4 py-3 shadow-card backdrop-blur-md`}
      role="status"
    >
      <div className={`mt-0.5 ${tone.icon}`} aria-hidden>
        <Icon kind={toast.kind} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text">{toast.title}</div>
        {toast.body && (
          <div className="mt-0.5 text-xs text-text-muted">{toast.body}</div>
        )}
        {toast.href && (
          <a
            href={toast.href}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-block text-xs underline text-text hover:text-brand-200"
          >
            {toast.hrefLabel ?? "View ↗"}
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-text-dim transition hover:text-text"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

const TONES: Record<ToastKind, { border: string; bg: string; icon: string }> = {
  info: { border: "border-border", bg: "bg-bg-elev/90", icon: "text-text-muted" },
  success: { border: "border-success/30", bg: "bg-bg-elev/90", icon: "text-success" },
  error: { border: "border-danger/30", bg: "bg-bg-elev/90", icon: "text-danger" },
  loading: { border: "border-brand/30", bg: "bg-bg-elev/90", icon: "text-brand" },
};

function Icon({ kind }: { kind: ToastKind }) {
  if (kind === "loading") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" className="animate-spin">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" fill="none" />
        <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (kind === "success") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (kind === "error") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}
