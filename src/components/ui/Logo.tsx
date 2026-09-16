import React from "react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/constants/app";

export interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  src?: string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  style,
  src = "/logo.png",
  alt = `${APP_CONFIG.name} Logo`,
}) => (
  <img
    src={src}
    alt={alt}
    className={cn(
      "shrink-0 object-contain rounded-full select-none",
      className,
    )}
    style={style}
  />
);
