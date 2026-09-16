import React, { useMemo, useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  value?: string; // "YYYY-MM-DDTHH:mm"
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatToDateTimeLocal(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const h = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value = "",
  onChange,
  disabled = false,
  required = false,
  className,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { datePart, timePart } = useMemo(() => {
    if (!value || !value.includes("T")) {
      return { datePart: "", timePart: "" };
    }
    const [d, t] = value.split("T");
    return { datePart: d || "", timePart: t ? t.slice(0, 5) : "" };
  }, [value]);

  const handleOpenDatePicker = () => {
    if (disabled) return;
    try {
      dateInputRef.current?.showPicker();
    } catch {
      dateInputRef.current?.focus();
    }
  };

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      onChange?.("");
      return;
    }
    const targetTime = timePart || "09:00";
    onChange?.(`${newDate}T${targetTime}`);
  };

  const handleTimeChange = (newTime: string) => {
    if (!newTime) return;
    const nowLocal = formatToDateTimeLocal(new Date()).split("T")[0];
    const targetDate = datePart || nowLocal;
    onChange?.(`${targetDate}T${newTime}`);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Date Selector */}
        <div
          onClick={handleOpenDatePicker}
          className={cn(
            "flex items-center rounded-md border border-input",
            "bg-card text-foreground px-2.5 shadow-sm transition-colors",
            "focus-within:ring-1 focus-within:ring-ring h-9 cursor-pointer",
            "hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          )}
        >
          <Calendar
            className={
              "w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0 " +
              "pointer-events-none"
            }
          />
          <input
            ref={dateInputRef}
            type="date"
            value={datePart}
            disabled={disabled}
            required={required}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDatePicker();
            }}
            onChange={(e) => handleDateChange(e.target.value)}
            className={cn(
              "w-full bg-transparent text-xs font-mono text-foreground",
              "focus:outline-none cursor-pointer",
              "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
            )}
          />
        </div>

        {/* Time Selector */}
        <TimePicker
          value={timePart}
          disabled={disabled}
          onChange={handleTimeChange}
          placeholder="Select time"
        />
      </div>
    </div>
  );
};
