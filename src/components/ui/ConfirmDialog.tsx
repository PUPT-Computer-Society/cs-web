import React from "react";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePresence } from "@/lib/usePresence";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const { isRendered, isClosing } = usePresence(open, 150);

  if (!isRendered) return null;

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return (
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
        );
      case "warning":
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 text-white shadow-xs";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-xs";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm",
          isClosing
            ? "animate-out fade-out-0 duration-150"
            : "animate-in fade-in-0 duration-200",
        )}
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground",
          isClosing
            ? "animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-4 duration-150 ease-in"
            : "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200 ease-out",
        )}
      >
        <div className="flex items-start justify-between pb-3">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h3 className="font-bold text-sm text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Action confirmation required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 text-xs text-muted-foreground leading-relaxed">
          {description}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={getConfirmButtonClass()}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
