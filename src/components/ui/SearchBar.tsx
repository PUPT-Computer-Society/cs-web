import React from "react";
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
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search
        className={cn(
          "absolute left-2.5 text-muted-foreground pointer-events-none",
          size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-md border border-input bg-transparent",
          "pl-8 pr-8 text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
          size === "sm" ? "h-8 text-[11px]" : "h-9 text-xs",
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={cn(
            "absolute right-2 text-muted-foreground hover:text-foreground",
            "p-0.5 rounded-xs hover:bg-secondary transition-colors",
            "cursor-pointer",
          )}
        >
          <X className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </button>
      )}
    </div>
  );
};
