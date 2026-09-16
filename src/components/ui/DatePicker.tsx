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
  placeholder = "Pick a date",
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
    const popoverHeight = 350;
    const popoverWidth = 300;

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

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

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
      {/* Shadcn-styled Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "flex h-9 w-full items-center justify-start rounded-md border",
          "border-input bg-card px-3 py-1 text-xs text-foreground",
          "shadow-2xs transition-colors hover:bg-accent/30",
          "hover:border-primary/50 focus-visible:outline-hidden",
          "focus-visible:ring-1 focus-visible:ring-ring text-left",
          "cursor-pointer",
          isOpen && "border-primary ring-1 ring-ring",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <CalendarIcon
          className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground"
        />
        <span
          className={cn(
            "truncate font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {displayDate || placeholder}
        </span>
      </button>

      {/* Floating Popover via Portal */}
      {isOpen &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: "300px",
              zIndex: 9999,
              transform: pos.placement === "top" ? "translateY(-100%)" : "none",
            }}
            className={cn(
              "rounded-lg border border-border bg-popover p-3 shadow-md",
              "text-popover-foreground animate-in fade-in-0 zoom-in-95",
              "duration-100 select-none",
            )}
          >
            {/* Header: Centered Month & Year with Ghost Chevrons */}
            <div
              className={
                "relative flex items-center justify-center pt-1 pb-2"
              }
            >
              <button
                type="button"
                onClick={handlePrevMonth}
                className={cn(
                  "absolute left-1 h-7 w-7 bg-transparent p-0",
                  "inline-flex items-center justify-center rounded-md",
                  "text-muted-foreground hover:text-foreground hover:bg-accent",
                  "border border-input/60 transition-colors cursor-pointer",
                )}
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-sm font-medium text-foreground">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className={cn(
                  "absolute right-1 h-7 w-7 bg-transparent p-0",
                  "inline-flex items-center justify-center rounded-md",
                  "text-muted-foreground hover:text-foreground hover:bg-accent",
                  "border border-input/60 transition-colors cursor-pointer",
                )}
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekdays Row: Shadcn 0.8rem text-muted-foreground */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS.map((wd) => (
                <span
                  key={wd}
                  className={
                    "text-muted-foreground w-9 text-[0.8rem] font-normal " +
                    "text-center py-1 select-none"
                  }
                >
                  {wd}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid: Shadcn 36px x 36px buttons */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item) => (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => handleSelectDate(item.dateStr)}
                  className={cn(
                    "h-9 w-9 p-0 font-normal text-sm rounded-md",
                    "inline-flex items-center justify-center transition-colors",
                    "cursor-pointer",
                    item.isSelected
                      ? "bg-primary text-primary-foreground font-medium " +
                          "shadow-xs hover:bg-primary focus:bg-primary"
                      : item.isToday
                        ? "bg-accent text-accent-foreground font-semibold"
                        : item.isCurrentMonth
                          ? "text-foreground hover:bg-accent " +
                            "hover:text-accent-foreground"
                          : "text-muted-foreground/30 hover:bg-accent/40 " +
                            "hover:text-muted-foreground",
                  )}
                >
                  {item.dayNumber}
                </button>
              ))}
            </div>

            {/* Subtle Footer: Today & Clear */}
            <div
              className={
                "pt-2 mt-2 border-t border-border flex items-center " +
                "justify-between"
              }
            >
              <button
                type="button"
                onClick={() => handleSelectDate(todayStr)}
                className={cn(
                  "text-xs font-medium text-muted-foreground " +
                    "hover:text-foreground px-2 py-1 rounded hover:bg-accent " +
                    "transition-colors cursor-pointer",
                )}
              >
                Today
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "text-xs font-medium text-muted-foreground " +
                      "hover:text-destructive px-2 py-1 rounded " +
                      "hover:bg-accent transition-colors cursor-pointer " +
                      "flex items-center gap-1",
                  )}
                  title="Clear date"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
