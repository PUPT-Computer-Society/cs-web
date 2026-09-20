import React from "react";
import { cn } from "@/lib/utils";

export interface LiquidSphereLoaderProps {
  progress?: number;
  message?: string;
  subMessage?: string;
  isError?: boolean;
  className?: string;
}

export const LiquidSphereLoader: React.FC<LiquidSphereLoaderProps> = ({
  progress = 50,
  message = "INITIALIZING...",
  subMessage = "PUPT CS",
  isError = false,
  className,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 select-none",
        className,
      )}
      role="status"
      aria-label={`${message} - ${Math.round(clampedProgress)}% complete`}
    >
      {/* 2D Flat Sphere Container */}
      <div
        className={cn(
          "relative w-36 h-36 rounded-full border-2 overflow-hidden",
          "shadow-inner flex items-center justify-center bg-secondary/30",
          isError
            ? "border-destructive/60 border border-white/[0.08]"
            : "border-primary/50 border border-white/[0.08]",
        )}
      >
        {/* Rising Water Body */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-[height]",
            clampedProgress === 0 ? "opacity-0" : "opacity-100",
          )}
          style={{
            height: `${clampedProgress}%`,
            transitionDuration: "500ms",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Back Wave (Slow Reverse Drift) */}
          <div
            className={
              "absolute -top-4 left-0 w-[200%] h-5 overflow-visible " +
              "pointer-events-none animate-wave-drift-slow fill-current " +
              (isError
                ? "text-rose-400/50 dark:text-rose-400/35"
                : "text-blue-400/50 dark:text-blue-400/35")
            }
          >
            <svg
              viewBox="0 0 1200 60"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <path
                d={
                  "M 0 25 Q 150 -5 300 25 T 600 25 " +
                  "T 900 25 T 1200 25 V 60 H 0 Z"
                }
              />
            </svg>
          </div>

          {/* Front Wave (Forward Drift) */}
          <div
            className={
              "absolute -top-3.5 left-0 w-[200%] h-4 overflow-visible " +
              "pointer-events-none animate-wave-drift fill-current " +
              (isError
                ? "text-rose-600 dark:text-destructive"
                : "text-blue-600 dark:text-primary")
            }
          >
            <svg
              viewBox="0 0 1200 60"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <path
                d={
                  "M 0 25 Q 150 5 300 25 T 600 25 " +
                  "T 900 25 T 1200 25 V 60 H 0 Z"
                }
              />
            </svg>
          </div>

          {/* Solid Liquid Fill Below Waves */}
          <div
            className={cn(
              "w-full h-full",
              isError ? "bg-rose-700 dark:bg-destructive" : "bg-blue-700",
            )}
          />
        </div>
      </div>

      {/* Percentage & Telemetry Readout Below Sphere */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span
          className={cn(
            "font-mono text-base font-bold tracking-tight",
            isError ? "text-destructive" : "text-foreground",
          )}
        >
          {Math.round(clampedProgress)}%
        </span>
        <span
          className={cn(
            "font-mono text-xs font-semibold tracking-wider uppercase",
            isError ? "text-destructive" : "text-foreground",
          )}
        >
          {message}
        </span>
        <div
          className={
            "flex items-center gap-1.5 text-[10px] font-mono " +
            "text-muted-foreground mt-0.5"
          }
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isError ? "bg-destructive" : "bg-primary/80",
            )}
          />
          <span>{subMessage}</span>
        </div>
      </div>
    </div>
  );
};
