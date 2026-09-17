import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

const DEFAULT_TOAST_DURATION = 3500;
const ACTION_TOAST_DURATION = 6000;
const DISMISS_ANIMATION_MS = 150;

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: ToastAction;
  isDismissing?: boolean;
}

type ToastActionOrOptions =
  | ToastAction
  | (Omit<ToastOptions, "type"> & { label?: never });

interface ToastContextValue {
  showToast: (message: string, options?: ToastType | ToastOptions) => void;
  success: (message: string, options?: ToastActionOrOptions) => void;
  error: (message: string, options?: ToastActionOrOptions) => void;
  info: (message: string, options?: ToastActionOrOptions) => void;
  warning: (message: string, options?: ToastActionOrOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef<number>(toast.duration);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingTimeRef.current);
  }, [toast.id, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    pauseTimer();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimer();
  };

  const handleTouchStart = () => {
    setIsPaused(true);
    pauseTimer();
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    startTimer();
  };

  const handleActionClick = async () => {
    pauseTimer();
    onDismiss(toast.id);
    try {
      await toast.action?.onClick();
    } catch {
      // Error handled by caller
    }
  };

  const handleCloseClick = () => {
    pauseTimer();
    onDismiss(toast.id);
  };

  return (
    <div
      role="status"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={
        "pointer-events-auto relative overflow-hidden flex items-center " +
        "gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md select-none " +
        (toast.isDismissing
          ? "animate-out fade-out-0 slide-out-to-right-4 duration-150 ease-in "
          : "animate-in fade-in-0 slide-in-from-bottom-5 duration-200 ease-out ") +
        (toast.type === "success"
          ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500/30 " +
            "text-emerald-900 dark:text-emerald-200 "
          : toast.type === "error"
            ? "bg-rose-50 dark:bg-rose-950/80 border-rose-500/30 " +
              "text-rose-900 dark:text-rose-200 "
            : toast.type === "warning"
              ? "bg-amber-50 dark:bg-amber-950/80 border-amber-500/30 " +
                "text-amber-900 dark:text-amber-200 "
              : "bg-card border-border text-foreground ")
      }
    >
      <div className="shrink-0">
        {toast.type === "success" && (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        )}
        {toast.type === "error" && (
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        )}
        {toast.type === "warning" && (
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
        {toast.type === "info" && (
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      <p className="text-xs font-medium leading-tight flex-1">
        {toast.message}
      </p>

      {toast.action && (
        <button
          type="button"
          onClick={handleActionClick}
          className={
            "shrink-0 min-h-[44px] px-2 flex items-center justify-center " +
            "text-xs font-bold uppercase tracking-wider underline " +
            "underline-offset-4 hover:no-underline rounded-lg " +
            "active:scale-95 transition-transform cursor-pointer"
          }
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={handleCloseClick}
        aria-label="Dismiss notification"
        className={
          "shrink-0 min-w-[44px] min-h-[44px] -my-2.5 -mr-2.5 flex " +
          "items-center justify-center rounded-lg opacity-70 " +
          "hover:opacity-100 active:scale-95 transition-all cursor-pointer"
        }
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progressive Countdown Timer Indicator */}
      <div
        className={
          "absolute bottom-0 left-0 right-0 h-[2.5px] overflow-hidden " +
          "rounded-b-xl bg-black/10 dark:bg-white/10"
        }
        aria-hidden="true"
      >
        <div
          className="h-full w-full bg-current opacity-40 origin-left"
          style={{
            animation: `toast-progress ${toast.duration}ms linear forwards`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      </div>
    </div>
  );
};

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
    }, DISMISS_ANIMATION_MS);
  }, []);

  const showToast = useCallback(
    (message: string, options?: ToastType | ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      let type: ToastType = "info";
      let action: ToastAction | undefined;
      let duration: number | undefined;

      if (typeof options === "string") {
        type = options;
      } else if (options) {
        if (options.type) type = options.type;
        action = options.action;
        duration = options.duration;
      }

      const finalDuration =
        duration ?? (action ? ACTION_TOAST_DURATION : DEFAULT_TOAST_DURATION);

      setToasts((prev) => [
        ...prev,
        { id, message, type, duration: finalDuration, action },
      ]);
    },
    [],
  );

  const parseActionOptions = useCallback(
    (
      type: ToastType,
      options?: ToastActionOrOptions,
    ): ToastOptions => {
      if (!options) return { type };
      if ("label" in options && "onClick" in options) {
        return { type, action: options as ToastAction };
      }
      return { type, ...(options as Omit<ToastOptions, "type">) };
    },
    [],
  );

  const success = useCallback(
    (msg: string, options?: ToastActionOrOptions) => {
      showToast(msg, parseActionOptions("success", options));
    },
    [showToast, parseActionOptions],
  );

  const error = useCallback(
    (msg: string, options?: ToastActionOrOptions) => {
      showToast(msg, parseActionOptions("error", options));
    },
    [showToast, parseActionOptions],
  );

  const info = useCallback(
    (msg: string, options?: ToastActionOrOptions) => {
      showToast(msg, parseActionOptions("info", options));
    },
    [showToast, parseActionOptions],
  );

  const warning = useCallback(
    (msg: string, options?: ToastActionOrOptions) => {
      showToast(msg, parseActionOptions("warning", options));
    },
    [showToast, parseActionOptions],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Container: Clears floating dock on <lg screens */}
      <div
        aria-live="polite"
        className={
          "fixed inset-x-3 " +
          "bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] " +
          "sm:inset-x-auto sm:right-4 sm:max-w-sm sm:w-full " +
          "lg:bottom-4 z-50 flex flex-col gap-2 pointer-events-none"
        }
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismissToast} />
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
