import React, { useMemo } from "react";
import { Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  value?: string; // "YYYY-MM-DDTHH:mm"
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  referenceStartTime?: string; // If provided, shows "+1h", "+2h" presets
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
  referenceStartTime,
}) => {
  const { datePart, timePart } = useMemo(() => {
    if (!value || !value.includes("T")) {
      return { datePart: "", timePart: "" };
    }
    const [d, t] = value.split("T");
    return { datePart: d || "", timePart: t ? t.slice(0, 5) : "" };
  }, [value]);

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

  const handleAddDuration = (hoursToAdd: number) => {
    const base = referenceStartTime ? new Date(referenceStartTime) : new Date();
    if (isNaN(base.getTime())) return;
    const target = new Date(base.getTime() + hoursToAdd * 60 * 60 * 1000);
    onChange?.(formatToDateTimeLocal(target));
  };

  const handleSetEndOfDay = () => {
    const base = referenceStartTime ? new Date(referenceStartTime) : new Date();
    if (isNaN(base.getTime())) return;
    base.setHours(17, 0, 0, 0);
    onChange?.(formatToDateTimeLocal(base));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Date Selector */}
        <div className="relative">
          <div
            className={cn(
              "flex items-center rounded-md border border-input",
              "bg-card text-foreground px-2.5 shadow-sm transition-colors",
              "focus-within:ring-1 focus-within:ring-ring h-9",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <Calendar
              className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0"
            />
            <input
              type="date"
              value={datePart}
              disabled={disabled}
              required={required}
              onChange={(e) => handleDateChange(e.target.value)}
              className={cn(
                "w-full bg-transparent text-xs font-mono text-foreground",
                "focus:outline-none cursor-pointer",
              )}
            />
          </div>
        </div>

        {/* Time Selector */}
        <TimePicker
          value={timePart}
          disabled={disabled}
          onChange={handleTimeChange}
          placeholder="Select time"
        />
      </div>

      {/* Quick Duration Shortcuts (If referenceStartTime is given) */}
      {referenceStartTime && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span
            className={
              "text-[10px] text-muted-foreground flex items-center gap-0.5"
            }
          >
            <Plus className="w-2.5 h-2.5" /> Duration:
          </span>
          {[
            { label: "+1h", hrs: 1 },
            { label: "+2h", hrs: 2 },
            { label: "+3h", hrs: 3 },
            { label: "+4h", hrs: 4 },
          ].map((d) => (
            <button
              key={d.label}
              type="button"
              disabled={disabled}
              onClick={() => handleAddDuration(d.hrs)}
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded border",
                "border-border/60 bg-secondary/50 hover:bg-primary",
                "hover:text-primary-foreground hover:border-primary",
                "transition-colors",
              )}
            >
              {d.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={handleSetEndOfDay}
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded border",
              "border-border/60 bg-secondary/50 hover:bg-primary",
              "hover:text-primary-foreground hover:border-primary",
              "transition-colors",
            )}
          >
            5:00 PM
          </button>
        </div>
      )}
    </div>
  );
};
