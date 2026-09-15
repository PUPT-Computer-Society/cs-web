import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTour } from "@/context/TourContext";
import { cn } from "@/lib/utils";

const SPOTLIGHT_PADDING = 8;
const POPOVER_WIDTH = 340;
const POPOVER_HEIGHT_ESTIMATE = 200;

export const OnboardingSpotlight: React.FC = () => {
  const {
    isTourOpen,
    currentStepIndex,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
  } = useTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePositions = useCallback(() => {
    if (!isTourOpen || !currentStep) return;

    const el = document.querySelector(currentStep.target);
    if (!el) {
      // Fallback: center in screen if target not found or hidden
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setTargetRect(null);
      setPopoverPos({
        top: Math.max(16, cy - POPOVER_HEIGHT_ESTIMATE / 2),
        left: Math.max(16, cx - POPOVER_WIDTH / 2),
      });
      return;
    }

    // Scroll into view smoothly
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    // Compute popover placement (prefer below, then above, then center)
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top = 0;

    if (spaceBelow >= POPOVER_HEIGHT_ESTIMATE + 20) {
      top = rect.bottom + SPOTLIGHT_PADDING + 12;
    } else if (spaceAbove >= POPOVER_HEIGHT_ESTIMATE + 20) {
      top = rect.top - SPOTLIGHT_PADDING - POPOVER_HEIGHT_ESTIMATE - 12;
    } else {
      top = Math.max(16, window.innerHeight / 2 - POPOVER_HEIGHT_ESTIMATE / 2);
    }

    // Center horizontally relative to target, clamped to screen bounds
    const idealLeft = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
    const clampedLeft = Math.max(
      16,
      Math.min(window.innerWidth - POPOVER_WIDTH - 16, idealLeft),
    );

    setPopoverPos({ top, left: clampedLeft });
  }, [isTourOpen, currentStep]);

  useEffect(() => {
    if (!isTourOpen) return;

    updatePositions();
    const handleUpdate = () => {
      requestAnimationFrame(updatePositions);
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isTourOpen, currentStepIndex, updatePositions]);

  // Keyboard navigation suite (Jakob's Law & Accessibility)
  useEffect(() => {
    if (!isTourOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourOpen, nextStep, prevStep, skipTour]);

  if (!isTourOpen) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div
      aria-label="Interactive Product Tour"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 select-none pointer-events-none"
    >
      {/* Target Spotlight Cutout Ring & Infinite Box Shadow */}
      {targetRect ? (
        <div
          style={{
            top: targetRect.top - SPOTLIGHT_PADDING,
            left: targetRect.left - SPOTLIGHT_PADDING,
            width: targetRect.width + SPOTLIGHT_PADDING * 2,
            height: targetRect.height + SPOTLIGHT_PADDING * 2,
            transition:
              "top 300ms cubic-bezier(0.4, 0, 0.2, 1), " +
              "left 300ms cubic-bezier(0.4, 0, 0.2, 1), " +
              "width 300ms cubic-bezier(0.4, 0, 0.2, 1), " +
              "height 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className={
            "fixed rounded-2xl border-2 border-primary " +
            "shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] " +
            "ring-4 ring-primary/25 pointer-events-none"
          }
        />
      ) : (
        // Fallback backdrop if target is offscreen
        <div className="fixed inset-0 bg-black/75 pointer-events-none" />
      )}

      {/* Floating Tour Popover Card */}
      <div
        ref={popoverRef}
        style={{
          top: popoverPos.top,
          left: popoverPos.left,
          width: POPOVER_WIDTH,
          transition:
            "top 300ms cubic-bezier(0.4, 0, 0.2, 1), " +
            "left 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className={
          "fixed pointer-events-auto rounded-2xl border border-border/80 " +
          "bg-card/95 backdrop-blur-xl shadow-2xl p-5 space-y-3.5 z-50 " +
          "animate-in fade-in-0 zoom-in-95 duration-200"
        }
      >
        {/* Header: Step Pill & Dismiss */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span
              className={
                "text-[10px] font-mono font-bold uppercase tracking-wider " +
                "text-amber-600 dark:text-amber-400"
              }
            >
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={skipTour}
            className={
              "text-muted-foreground hover:text-foreground p-1 " +
              "rounded-md transition-colors"
            }
            title="Skip Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground leading-snug">
            {currentStep.title}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Footer: Progress Dots & Action Buttons */}
        <div
          className={
            "flex items-center justify-between pt-2 border-t " +
            "border-border/60"
          }
        >
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  idx === currentStepIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="h-7 px-2 text-xs font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={nextStep}
              className={
                "h-7 px-3 text-xs font-bold gap-1 bg-primary " +
                "text-primary-foreground"
              }
            >
              <span>{isLastStep ? "Finish" : "Next"}</span>
              {isLastStep ? (
                <Check className="w-3 h-3" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
