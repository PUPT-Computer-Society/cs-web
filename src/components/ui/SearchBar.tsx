import React, { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "default";
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
  size = "default",
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search
        className={cn(
          "absolute left-2.5 text-muted-foreground pointer-events-none",
          size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-md border border-white/[0.08] bg-secondary/30",
          "pl-8 pr-14 text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-1 focus:ring-primary/40",
          "text-[13px] tracking-[-0.01em] transition-colors duration-100",
          size === "sm" ? "h-8" : "h-9",
          inputClassName,
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className={cn(
            "absolute right-1.5 sm:right-2 text-muted-foreground " +
              "hover:text-foreground p-1 sm:p-0.5 rounded-xs " +
              "hover:bg-secondary transition-colors duration-100 " +
              "cursor-pointer",
          )}
        >
          <X className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </button>
      ) : (
        <kbd
          className={
            "hidden sm:inline-flex items-center gap-0.5 absolute right-2 " +
            "px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 " +
            "rounded border border-white/[0.08] bg-muted/40 select-none " +
            "pointer-events-none"
          }
        >
          ⌘K
        </kbd>
      )}
    </div>
  );
};
