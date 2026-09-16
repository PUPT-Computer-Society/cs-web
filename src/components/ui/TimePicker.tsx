import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string; // "HH:mm" in 24-hour format
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  size?: "sm" | "default";
}

const PRESETS = [
  { label: "8:00 AM", time: "08:00" },
  { label: "9:00 AM", time: "09:00" },
  { label: "10:00 AM", time: "10:00" },
  { label: "1:00 PM", time: "13:00" },
  { label: "2:00 PM", time: "14:00" },
  { label: "5:00 PM", time: "17:00" },
];

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parse24H(val?: string) {
  if (!val || !val.includes(":")) {
    return { hour12: 12, minute: 0, period: "AM" as const };
  }
  const [hStr, mStr] = val.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const validH = isNaN(h) ? 12 : Math.min(23, Math.max(0, h));
  const validM = isNaN(m) ? 0 : Math.min(59, Math.max(0, m));
  const period: "AM" | "PM" = validH >= 12 ? "PM" : "AM";
  const hour12 = validH % 12 === 0 ? 12 : validH % 12;
  return { hour12, minute: validM, period };
}

function to24H(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${pad2(h)}:${pad2(minute)}`;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value = "",
  onChange,
  disabled = false,
  className,
  placeholder = "Select time",
  size = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parse24H(value), [value]);
  const [selectedH, setSelectedH] = useState(parsed.hour12);
  const [selectedM, setSelectedM] = useState(parsed.minute);
  const [selectedP, setSelectedP] = useState<"AM" | "PM">(parsed.period);

  useEffect(() => {
    setSelectedH(parsed.hour12);
    setSelectedM(parsed.minute);
    setSelectedP(parsed.period);
  }, [parsed]);

  const emitChange = useCallback(
    (h: number, m: number, p: "AM" | "PM") => {
      setSelectedH(h);
      setSelectedM(m);
      setSelectedP(p);
      onChange?.(to24H(h, m, p));
    },
    [onChange],
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const popoverHeight = 310;
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

  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = selectedH === 12 ? 1 : selectedH + 1;
      emitChange(next, selectedM, selectedP);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = selectedH === 1 ? 12 : selectedH - 1;
      emitChange(next, selectedM, selectedP);
    }
  };

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = (selectedM + 5) % 60;
      emitChange(selectedH, next, selectedP);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (selectedM - 5 + 60) % 60;
      emitChange(selectedH, next, selectedP);
    }
  };

  const displayTime = useMemo(() => {
    if (!value) return "";
    return `${parsed.hour12}:${pad2(parsed.minute)} ${parsed.period}`;
  }, [value, parsed]);

  const setNow = () => {
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const p: "AM" | "PM" = currentH >= 12 ? "PM" : "AM";
    const h12 = currentH % 12 === 0 ? 12 : currentH % 12;
    emitChange(h12, currentM, p);
  };

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "flex items-center justify-between w-full rounded-md border",
          "border-input bg-card text-foreground px-3 py-1.5 text-xs shadow-sm",
          "hover:bg-secondary/40 focus:outline-none focus:ring-1",
          "focus:ring-ring transition-colors",
          size === "sm" ? "h-8" : "h-9",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span
            className={cn(
              "font-mono text-xs",
              !displayTime && "text-muted-foreground font-sans",
            )}
          >
            {displayTime || placeholder}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded",
            selectedP === "PM"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-primary/10 text-primary",
            !value && "opacity-0",
          )}
        >
          {selectedP}
        </span>
      </button>

      {isOpen &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: pos.placement === "top" ? undefined : pos.top,
              bottom:
                pos.placement === "top"
                  ? window.innerHeight - pos.top
                  : undefined,
              left: pos.left,
              width: 280,
              zIndex: 9999,
            }}
            className={cn(
              "p-3 rounded-xl border border-border bg-card shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 duration-100 text-foreground",
            )}
          >
            {/* Header: Presets & Now */}
            <div className="flex items-center justify-between gap-1 mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Time Presets
              </span>
              <button
                type="button"
                onClick={setNow}
                className={cn(
                  "text-[10px] font-semibold text-primary hover:underline",
                  "cursor-pointer px-1.5 py-0.5 rounded hover:bg-primary/10",
                )}
              >
                Set to Now
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => {
                    const p = parse24H(preset.time);
                    emitChange(p.hour12, p.minute, p.period);
                  }}
                  className={cn(
                    "text-[11px] font-mono py-1 rounded-md border",
                    "border-border/60 hover:bg-primary " +
                      "hover:text-primary-foreground",
                    "transition-colors text-center",
                    value === preset.time &&
                      "bg-primary text-primary-foreground font-semibold",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Segmented Digital Input */}
            <div
              className={cn(
                "flex items-center justify-center gap-1.5 p-2 rounded-lg",
                "bg-secondary/40 border border-border/50 mb-3",
              )}
            >
              {/* Hour Box */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    const next = selectedH === 12 ? 1 : selectedH + 1;
                    emitChange(next, selectedM, selectedP);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={hourInputRef}
                  type="text"
                  maxLength={2}
                  value={pad2(selectedH)}
                  onKeyDown={handleHourKeyDown}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 1 && num <= 12) {
                      emitChange(num, selectedM, selectedP);
                      if (val.length === 2) {
                        minuteInputRef.current?.focus();
                        minuteInputRef.current?.select();
                      }
                    }
                  }}
                  className={cn(
                    "w-11 h-9 text-center font-mono font-bold text-sm",
                    "bg-card border border-border rounded-md shadow-inner",
                    "focus:outline-none focus:ring-1 focus:ring-primary",
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    const next = selectedH === 1 ? 12 : selectedH - 1;
                    emitChange(next, selectedM, selectedP);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <span
                className={
                  "font-mono font-bold text-base text-muted-foreground"
                }
              >
                :
              </span>

              {/* Minute Box */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    const next = (selectedM + 5) % 60;
                    emitChange(selectedH, next, selectedP);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={minuteInputRef}
                  type="text"
                  maxLength={2}
                  value={pad2(selectedM)}
                  onKeyDown={handleMinuteKeyDown}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 0 && num <= 59) {
                      emitChange(selectedH, num, selectedP);
                    }
                  }}
                  className={cn(
                    "w-11 h-9 text-center font-mono font-bold text-sm",
                    "bg-card border border-border rounded-md shadow-inner",
                    "focus:outline-none focus:ring-1 focus:ring-primary",
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    const next = (selectedM - 5 + 60) % 60;
                    emitChange(selectedH, next, selectedP);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AM / PM Pill Switch */}
              <div className="flex flex-col gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => emitChange(selectedH, selectedM, "AM")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-bold rounded",
                    "transition-colors",
                    selectedP === "AM"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground " +
                          "hover:text-foreground",
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => emitChange(selectedH, selectedM, "PM")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-bold rounded",
                    "transition-colors",
                    selectedP === "PM"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-card border border-border text-muted-foreground " +
                          "hover:text-foreground",
                  )}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Rapid Selection Columns */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div
                  className={
                    "text-[10px] font-semibold text-muted-foreground mb-1"
                  }
                >
                  Hour
                </div>
                <div
                  className={
                    "grid grid-cols-3 gap-1 max-h-24 overflow-y-auto pr-1"
                  }
                >
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => emitChange(h, selectedM, selectedP)}
                      className={cn(
                        "h-7 rounded text-[11px] font-mono border",
                        "border-border/40 hover:bg-secondary transition-colors",
                        selectedH === h &&
                          "bg-primary/20 text-primary border-primary font-bold",
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div
                  className={
                    "text-[10px] font-semibold text-muted-foreground mb-1"
                  }
                >
                  Minute
                </div>
                <div
                  className={
                    "grid grid-cols-3 gap-1 max-h-24 overflow-y-auto pr-1"
                  }
                >
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => emitChange(selectedH, m, selectedP)}
                      className={cn(
                        "h-7 rounded text-[11px] font-mono border",
                        "border-border/40 hover:bg-secondary transition-colors",
                        selectedM === m &&
                          "bg-primary/20 text-primary border-primary font-bold",
                      )}
                    >
                      :{pad2(m)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Done Button */}
            <div className="mt-3 pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "transition-colors shadow-sm",
                )}
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
