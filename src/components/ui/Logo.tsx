import React from "react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/constants/app";

export interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label={`${APP_CONFIG.name} Logo`}
    >
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <path
        d="M10 8V24M10 16L18 8M13 13L21 24"
        className="stroke-background"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
