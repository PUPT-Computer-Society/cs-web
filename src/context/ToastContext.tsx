import React, { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  isDismissing?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDismissing: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 150);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        dismissToast(id);
      }, 3500);
    },
    [dismissToast],
  );

  const success = useCallback(
    (msg: string) => showToast(msg, "success"),
    [showToast],
  );
  const error = useCallback(
    (msg: string) => showToast(msg, "error"),
    [showToast],
  );
  const info = useCallback(
    (msg: string) => showToast(msg, "info"),
    [showToast],
  );
  const warning = useCallback(
    (msg: string) => showToast(msg, "warning"),
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Pop-up Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-xl backdrop-blur-md ${
              t.isDismissing
                ? "animate-out fade-out-0 slide-out-to-right-4 duration-150 ease-in"
                : "animate-in fade-in-0 slide-in-from-bottom-5 duration-200 ease-out"
            } ${
              t.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                : t.type === "error"
                  ? "bg-rose-50 dark:bg-rose-950/80 border-rose-500/30 text-rose-900 dark:text-rose-200"
                  : t.type === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/80 border-amber-500/30 text-amber-900 dark:text-amber-200"
                    : "bg-card border-border text-foreground"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
              {t.type === "warning" && (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
              {t.type === "info" && (
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <p className="text-xs font-medium leading-tight flex-1">
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
