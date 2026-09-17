import React from "react";
import { X } from "lucide-react";
import { usePresence } from "@/lib/usePresence";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}) => {
  const { isRendered, isClosing } = usePresence(open, 150);

  if (!isRendered) return null;

  return (
    <div
      className={
        "fixed inset-0 z-50 flex items-end sm:items-center " +
        "justify-center p-0 sm:p-4"
      }
    >
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm touch-none select-none",
          isClosing
            ? "animate-out fade-out-0 duration-150"
            : "animate-in fade-in-0 duration-200",
        )}
        onClick={() => onOpenChange(false)}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg flex flex-col",
          "max-h-[92vh] sm:max-h-[90vh]",
          "rounded-t-3xl sm:rounded-2xl border border-border bg-card",
          "p-4 sm:p-6 shadow-2xl text-card-foreground",
          "pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6",
          isClosing
            ? "animate-out fade-out-0 zoom-out-95 " +
                "slide-out-to-bottom-4 duration-150 ease-in"
            : "animate-in fade-in-0 zoom-in-95 " +
                "slide-in-from-bottom-4 duration-200 ease-out",
          className,
        )}
      >
        {/* Mobile top handle pill */}
        <div
          className={
            "w-12 h-1 bg-muted-foreground/30 rounded-full " +
            "mx-auto mb-3 sm:hidden shrink-0"
          }
        />

        <div
          className={
            "flex items-start justify-between pb-3 sm:pb-4 " +
            "border-b border-border mb-3 sm:mb-4 shrink-0"
          }
        >
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-sm text-foreground truncate">
              {title}
            </h3>
            {description && (
              <p
                className={"text-xs text-muted-foreground mt-0.5 line-clamp-2"}
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={
              "rounded-lg p-1.5 min-w-[36px] min-h-[36px] " +
              "flex items-center justify-center text-muted-foreground " +
              "hover:text-foreground hover:bg-secondary " +
              "transition-colors shrink-0 cursor-pointer"
            }
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1 -mr-1">{children}</div>
      </div>
    </div>
  );
};
