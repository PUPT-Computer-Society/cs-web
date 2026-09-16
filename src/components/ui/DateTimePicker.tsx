import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DatePicker } from "./DatePicker";
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
  className,
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

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Sleek Shadcn DatePicker */}
        <DatePicker
          value={datePart}
          disabled={disabled}
          onChange={handleDateChange}
          placeholder="Select date"
        />

        {/* Sleek Shadcn TimePicker */}
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
