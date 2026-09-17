import React, { useEffect } from "react";
import { usePresence } from "@/lib/usePresence";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  children,
  className,
}) => {
  const { isRendered, isClosing } = usePresence(open, 200);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-xs touch-none select-none",
          isClosing
            ? "animate-out fade-out-0 duration-200 ease-in"
            : "animate-in fade-in-0 duration-200 ease-out",
        )}
        onClick={() => onOpenChange(false)}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Slide-up sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[85vh] flex flex-col",
          "rounded-t-3xl border-t border-border bg-card shadow-2xl",
          "text-card-foreground pb-[max(1rem,env(safe-area-inset-bottom))]",
          isClosing
            ? "animate-out slide-out-to-bottom-full duration-200 ease-in"
            : "animate-in slide-in-from-bottom-full duration-250 ease-out",
          className,
        )}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Scrollable contents */}
        <div className="overflow-y-auto flex-1 p-4 pt-2">{children}</div>
      </div>
    </div>
  );
};
