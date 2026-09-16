import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string; // "YYYY-MM-DD"
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseDate(val?: string): { y: number; m: number; d: number } | null {
  if (!val || !val.includes("-")) return null;
  const parts = val.split("-").map((s) => parseInt(s, 10));
  if (parts.length < 3 || parts.some(isNaN)) return null;
  return { y: parts[0], m: parts[1], d: parts[2] };
}

function formatDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function formatDisplayDate(val?: string): string {
  const p = parseDate(val);
  if (!p) return "";
  const dateObj = new Date(p.y, p.m - 1, p.d);
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value = "",
  onChange,
  disabled = false,
  className,
  placeholder = "Select date",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseDate(value), [value]);
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(
    () => formatDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate()),
    [now],
  );

  const [viewYear, setViewYear] = useState<number>(
    parsed ? parsed.y : now.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState<number>(
    parsed ? parsed.m : now.getMonth() + 1,
  );

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.y);
      setViewMonth(parsed.m);
    }
  }, [parsed]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const popoverHeight = 330;
    const popoverWidth = 280;

    const spaceBelow = vh - rect.bottom;
    const preferUp = spaceBelow < popoverHeight && rect.top > spaceBelow;
    const placement = preferUp ? "top" : "bottom";

    let left = rect.left;
    if (left + popoverWidth > vw - 12) {
      left = Math.max(12, vw - popoverWidth - 12);
    }

    const top = preferUp ? rect.top - 6 : rect.bottom + 6;
    setPos({ top, left, placement });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handlePresetSelect = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const formatted = formatDateStr(
      target.getFullYear(),
      target.getMonth() + 1,
      target.getDate(),
    );
    onChange?.(formatted);
    setIsOpen(false);
  };

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 1 ? 12 : viewMonth - 1;
      const prevY = viewMonth === 1 ? viewYear - 1 : viewYear;
      const dStr = formatDateStr(prevY, prevM, d);
      days.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === value,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dStr = formatDateStr(viewYear, viewMonth, d);
      days.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === value,
      });
    }

    // Leading days from next month to complete the grid (35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 12 ? 1 : viewMonth + 1;
      const nextY = viewMonth === 12 ? viewYear + 1 : viewYear;
      const dStr = formatDateStr(nextY, nextM, d);
      days.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === value,
      });
    }

    return days;
  }, [viewYear, viewMonth, todayStr, value]);

  const displayDate = useMemo(() => formatDisplayDate(value), [value]);

  return (
    <div className={cn("relative inline-block w-full", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between w-full h-9 rounded-md border",
          "border-input bg-card px-2.5 text-xs text-foreground shadow-2xs",
          "hover:border-primary/50 hover:bg-accent/20 transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-1",
          "focus-visible:ring-ring text-left cursor-pointer",
          isOpen && "border-primary ring-1 ring-ring",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
          <span
            className={cn(
              "truncate font-medium",
              !value && "text-muted-foreground",
            )}
          >
            {displayDate || placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground/70 shrink-0",
            "transition-transform",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Floating Popover via Portal */}
      {isOpen &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: "280px",
              zIndex: 9999,
              transform: pos.placement === "top" ? "translateY(-100%)" : "none",
            }}
            className={cn(
              "rounded-xl border border-border bg-card p-3 shadow-2xl",
              "text-card-foreground animate-in fade-in-0 zoom-in-95",
              "duration-150",
            )}
          >
            {/* Header: Month & Year Navigator */}
            <div className="flex items-center justify-between pb-2 mb-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={cn(
                  "p-1 rounded-md text-muted-foreground hover:text-foreground",
                  "hover:bg-accent transition-colors cursor-pointer",
                )}
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold text-foreground">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className={cn(
                  "p-1 rounded-md text-muted-foreground hover:text-foreground",
                  "hover:bg-accent transition-colors cursor-pointer",
                )}
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS.map((wd) => (
                <span
                  key={wd}
                  className={
                    "text-[10px] font-semibold text-muted-foreground/70 " +
                    "uppercase py-0.5"
                  }
                >
                  {wd}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item) => (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => handleSelectDate(item.dateStr)}
                  className={cn(
                    "h-7 w-7 mx-auto flex items-center justify-center",
                    "rounded-md text-xs transition-all cursor-pointer",
                    item.isSelected
                      ? "bg-primary text-primary-foreground font-bold " +
                        "shadow-2xs scale-105"
                      : item.isToday
                        ? "border border-primary text-primary font-bold " +
                          "hover:bg-primary/10"
                        : item.isCurrentMonth
                          ? "text-foreground hover:bg-accent " +
                            "hover:text-accent-foreground font-medium"
                          : "text-muted-foreground/30 hover:bg-accent/40 " +
                            "hover:text-muted-foreground",
                  )}
                >
                  {item.dayNumber}
                </button>
              ))}
            </div>

            {/* Quick Action Presets */}
            <div
              className={
                "pt-2 mt-2 border-t border-border/60 flex items-center " +
                "justify-between gap-1 flex-wrap"
              }
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePresetSelect(0)}
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded border",
                    "border-border bg-secondary/50 hover:bg-primary",
                    "hover:text-primary-foreground hover:border-primary",
                    "transition-colors cursor-pointer",
                  )}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(1)}
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded border",
                    "border-border bg-secondary/50 hover:bg-primary",
                    "hover:text-primary-foreground hover:border-primary",
                    "transition-colors cursor-pointer",
                  )}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(7)}
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded border",
                    "border-border bg-secondary/50 hover:bg-primary",
                    "hover:text-primary-foreground hover:border-primary",
                    "transition-colors cursor-pointer",
                  )}
                >
                  +7 Days
                </button>
              </div>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "text-[10px] text-muted-foreground hover:text-destructive",
                    "p-0.5 transition-colors cursor-pointer",
                  )}
                  title="Clear date"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
