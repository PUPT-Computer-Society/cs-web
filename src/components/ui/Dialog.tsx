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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm",
          isClosing
            ? "animate-out fade-out-0 duration-150"
            : "animate-in fade-in-0 duration-200",
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground",
          isClosing
            ? "animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-4 duration-150 ease-in"
            : "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200 ease-out",
          className,
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-border mb-4 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1 -mr-1">{children}</div>
      </div>
    </div>
  );
};
