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
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";
import { cn } from "./utils";
import { successHaptic, errorHaptic, lightHaptic } from "@/brand/motion";

type ToastVariant = "success" | "danger" | "warning" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
}

interface ToastApi {
  success(title: string, description?: string): void;
  error(title: string, description?: string): void;
  warning(title: string, description?: string): void;
  info(title: string, description?: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICON: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  danger: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLOR: Record<ToastVariant, string> = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, variant, title, description, duration: 3500 }]);
      if (variant === "success") void successHaptic();
      else if (variant === "danger") void errorHaptic();
      else void lightHaptic();
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("danger", t, d),
      warning: (t, d) => push("warning", t, d),
      info: (t, d) => push("info", t, d),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = ICON[item.variant];
  useEffect(() => {
    const t = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(t);
  }, [item.duration, onDismiss]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 shadow-elevated",
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", COLOR[item.variant])} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-fg">{item.title}</div>
        {item.description && (
          <div className="mt-0.5 text-xs text-fg-muted">{item.description}</div>
        )}
      </div>
    </motion.div>
  );
}
