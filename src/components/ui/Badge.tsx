import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "outline"
    | "success"
    | "warning"
    | "destructive";
  shape?: "rounded" | "pill";
  size?: "sm" | "default";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  shape = "rounded",
  size = "default",
  ...props
}) => {
  const variants = {
    default:
      "border-transparent bg-primary text-primary-foreground " +
      "hover:bg-primary/90",
    primary:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    secondary: "border-border bg-secondary text-secondary-foreground",
    accent:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 " +
      "dark:text-amber-400",
    outline: "border border-border text-foreground",
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 " +
      "dark:text-emerald-400",
    warning:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 " +
      "dark:text-amber-400",
    destructive:
      "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  const shapes = {
    rounded: "rounded-md",
    pill: "rounded-full",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[9px] font-semibold",
    default: "px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center border transition-colors " +
          "focus:outline-none select-none",
        variants[variant],
        shapes[shape],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
};

export const Pill: React.FC<BadgeProps> = (props) => (
  <Badge shape="pill" {...props} />
);
