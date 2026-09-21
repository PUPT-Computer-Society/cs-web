import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, InputProps } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends InputProps {}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex items-center w-full">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-11", className)}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword((prev) => !prev)}
        className={
          "absolute right-0 inset-y-0 w-11 h-full flex items-center " +
          "justify-center text-muted-foreground hover:text-foreground " +
          "focus:outline-none transition-colors"
        }
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 shrink-0" />
        ) : (
          <Eye className="w-4 h-4 shrink-0" />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
