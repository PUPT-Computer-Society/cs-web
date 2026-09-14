import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value: string | number;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  searchable?: boolean;
  onKeyStroke?: (keystroke: string) => void;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
  size = "default",
  searchable,
  onKeyStroke,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [keyStroke, setKeyStroke] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const isSearchable = searchable ?? options.length > 5;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const preferUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const placement = preferUp ? "top" : "bottom";

    const maxHeight = preferUp
      ? Math.max(120, Math.min(256, spaceAbove - 16))
      : Math.max(120, Math.min(256, spaceBelow - 16));

    let left = rect.left;
    const width = Math.max(rect.width, 140);
    if (left + width > vw - 12) {
      left = Math.max(12, vw - width - 12);
    }

    const top = preferUp ? rect.top - 4 : rect.bottom + 4;

    setDropdownPos({
      top,
      left,
      width,
      maxHeight,
      placement,
    });
  };

  const handleKeyStrokeChange = (val: string) => {
    setKeyStroke(val);
    setHighlightedIndex(0);
    onKeyStroke?.(val);
  };

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isTriggerClick =
        triggerRef.current && triggerRef.current.contains(target);
      const isListboxClick =
        listboxRef.current && listboxRef.current.contains(target);

      if (!isTriggerClick && !isListboxClick) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Position recalculation & viewport listeners
  useEffect(() => {
    if (!isOpen) {
      setDropdownPos(null);
      return;
    }
    updatePosition();

    const handleReposition = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen]);

  // Handle focus and state reset on open/close
  useEffect(() => {
    if (isOpen) {
      if (isSearchable) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
        return () => clearTimeout(timer);
      }
    } else {
      setKeyStroke("");
      setHighlightedIndex(-1);
      onKeyStroke?.("");
    }
  }, [isOpen, isSearchable]);

  const strValue = String(value ?? "");
  const selectedOption = options.find((opt) => String(opt.value) === strValue);

  const filteredOptions = useMemo(() => {
    const q = keyStroke.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q)),
    );
  }, [options, keyStroke]);

  const handleSelectOption = (optValue: string | number) => {
    onValueChange(String(optValue));
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      return;
    }

    // Type on desktop to instantly search & open
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      setIsOpen(true);
      handleKeyStrokeChange(e.key);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        Math.min(prev + 1, filteredOptions.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetIdx = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (filteredOptions[targetIdx]) {
        handleSelectOption(filteredOptions[targetIdx].value);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block w-full", className)}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between rounded-md border",
          "border-border bg-card px-2.5 text-foreground shadow-xs",
          "transition-[border-color,box-shadow] duration-150",
          "hover:border-primary/50 focus:outline-none focus:ring-1",
          "focus:ring-primary disabled:cursor-not-allowed",
          "disabled:opacity-50 text-left",
          size === "sm" ? "h-8 text-[11px]" : "h-9 text-xs",
          triggerClassName,
        )}
      >
        <div className="flex items-center gap-1.5 truncate pr-2">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span
            className={cn(
              "truncate font-medium",
              !selectedOption && "text-muted-foreground font-normal",
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground shrink-0 transition-transform",
            "duration-200",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>

      {isOpen &&
        dropdownPos &&
        createPortal(
          <div
            ref={listboxRef}
            role="listbox"
            style={{
              position: "fixed",
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              maxHeight: `${dropdownPos.maxHeight}px`,
              transform:
                dropdownPos.placement === "top" ? "translateY(-100%)" : "none",
              zIndex: 99999,
            }}
            className={cn(
              "overflow-y-auto rounded-md border border-border bg-card p-1",
              "text-card-foreground shadow-2xl animate-in fade-in-0",
              "zoom-in-95 duration-150 ease-out",
              contentClassName,
            )}
          >
            {/* Keystroke Search Bar inside dropdown */}
            {isSearchable && (
              <div
                className={
                  "sticky top-0 z-10 p-1 mb-1 bg-card " +
                  "border-b border-border/60"
                }
              >
                <div className="relative flex items-center">
                  <Search
                    className={
                      "w-3 h-3 absolute left-2 text-muted-foreground " +
                      "pointer-events-none"
                    }
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={keyStroke}
                    onChange={(e) => handleKeyStrokeChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Type to filter..."
                    className={
                      "w-full h-7 pl-6 pr-6 text-[11px] rounded " +
                      "border border-input bg-secondary/50 text-foreground " +
                      "placeholder:text-muted-foreground focus:outline-none " +
                      "focus:ring-1 focus:ring-primary"
                    }
                  />
                  {keyStroke && (
                    <button
                      type="button"
                      onClick={() => handleKeyStrokeChange("")}
                      aria-label="Clear filter"
                      className={
                        "absolute right-1.5 p-0.5 text-muted-foreground " +
                        "hover:text-foreground cursor-pointer rounded-xs " +
                        "hover:bg-secondary"
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {keyStroke ? (
                  <div className="space-y-1">
                    <p>No match for "{keyStroke}"</p>
                    <button
                      type="button"
                      onClick={() => handleKeyStrokeChange("")}
                      className={
                        "text-[11px] text-primary hover:underline font-mono"
                      }
                    >
                      Clear keystroke filter
                    </button>
                  </div>
                ) : (
                  "No options available"
                )}
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = String(option.value) === strValue;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectOption(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none",
                      "items-center rounded-sm py-1.5 pl-2 pr-7 text-left",
                      "outline-none transition-colors",
                      size === "sm" ? "text-[11px]" : "text-xs",
                      isHighlighted
                        ? "bg-secondary text-foreground"
                        : "hover:bg-secondary/70 hover:text-foreground",
                      isSelected
                        ? "bg-secondary/90 text-foreground font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {option.icon && (
                        <span className="shrink-0">{option.icon}</span>
                      )}
                      <div className="truncate">
                        <div className="truncate">{option.label}</div>
                        {option.description && (
                          <div
                            className={cn(
                              "text-[10px] text-muted-foreground truncate",
                            )}
                          >
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <span
                        className={
                          "absolute right-2 flex h-3.5 w-3.5 items-center " +
                          "justify-center"
                        }
                      >
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};
