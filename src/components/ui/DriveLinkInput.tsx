import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  DRIVE_REGISTRY,
  DriveFolderEntry,
  ROOT_DRIVE_URL,
} from "@/lib/driveRegistry";
import { cn } from "@/lib/utils";

export interface DriveLinkInputProps {
  registryKey?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
  helperText?: string;
  onOpenSopModal?: () => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: "top" | "bottom";
  arrowLeft: number;
}

export const DriveLinkInput: React.FC<DriveLinkInputProps> = ({
  registryKey,
  value,
  onChange,
  label = "Google Drive / Docs Link",
  placeholder = "https://drive.google.com/...",
  required = false,
  id,
  className,
  helperText,
  onOpenSopModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [pos, setPos] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    placement: "bottom",
    arrowLeft: 20,
  });

  const entry: DriveFolderEntry | undefined = registryKey
    ? DRIVE_REGISTRY[registryKey]
    : undefined;

  const targetDriveUrl =
    entry?.driveUrl || entry?.defaultDriveUrl || ROOT_DRIVE_URL;

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(360, window.innerWidth - 32);
    const margin = 16;
    const buttonCenter = rect.left + rect.width / 2;

    let left = buttonCenter - 36;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    const arrowLeft = Math.max(
      16,
      Math.min(buttonCenter - left - 6, tooltipWidth - 28),
    );

    let top = rect.bottom + 8;
    let placement: "top" | "bottom" = "bottom";
    if (top + 280 > window.innerHeight && rect.top > 280) {
      top = rect.top - 8;
      placement = "top";
    }

    setPos({ top, left, placement, arrowLeft });
  };

  useEffect(() => {
    if (!tooltipOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTooltipOpen(false);
    };
    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [tooltipOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tooltipOpen) {
      setTooltipOpen(false);
    } else {
      updatePosition();
      setTooltipOpen(true);
    }
  };

  const handleCopyNaming = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!entry?.namingConvention) return;
    navigator.clipboard.writeText(entry.namingConvention);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label and Tooltip Trigger Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={id}
            className="text-[11px] font-semibold text-foreground"
          >
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>

          {entry && (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleTriggerClick}
              className={cn(
                "transition-colors focus:outline-none p-0.5 rounded",
                "cursor-pointer inline-flex items-center",
                tooltipOpen
                  ? cn(
                      "relative z-[102] ring-2 ring-primary ring-offset-2",
                      "ring-offset-background bg-primary/20 text-primary",
                    )
                  : cn(
                      "text-muted-foreground hover:text-primary",
                      "hover:bg-primary/10",
                    ),
              )}
              aria-label={`View SOP guidance for ${entry.folderName}`}
              title="Click for SOP tutorial and naming guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-primary/80" />
            </button>
          )}
        </div>

        {onOpenSopModal && (
          <button
            type="button"
            onClick={onOpenSopModal}
            className={cn(
              "text-[10px] text-primary hover:underline font-medium",
              "inline-flex items-center gap-0.5 cursor-pointer",
            )}
          >
            <Sparkles className="w-2.5 h-2.5" />
            Storage SOPs &rarr;
          </button>
        )}
      </div>

      {/* URL Input */}
      <Input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />

      {/* Subtext and Direct Google Drive Redirection */}
      {(helperText || (targetDriveUrl && entry)) && (
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center",
            "justify-between gap-1 pt-0.5",
          )}
        >
          {helperText && (
            <p className="text-[10px] text-muted-foreground leading-tight">
              {helperText}
            </p>
          )}

          {targetDriveUrl && entry && (
            <a
              href={targetDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "ml-auto inline-flex items-center gap-1 text-[10px]",
                "font-semibold text-primary hover:text-primary/80",
                "hover:underline shrink-0 transition-colors",
              )}
              title={`Open ${entry.folderName} in Google Drive in a new tab`}
            >
              <FolderOpen className="w-3 h-3 text-amber-500" />
              <span>Open {entry.folderName}</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>
          )}
        </div>
      )}

      {/* Tutorial SOP Tooltip Anchored to Trigger with DOM Overlay Dim */}
      {entry &&
        tooltipOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Full DOM Overlay Dim */}
            <div
              className={cn(
                "fixed inset-0 bg-background backdrop-blur-xs z-[100]",
                "animate-in fade-in-0 duration-150 cursor-pointer",
              )}
              onClick={() => setTooltipOpen(false)}
              aria-hidden="true"
            />

            {/* Anchored Tutorial Tooltip Card */}
            <div
              style={{
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                transform:
                  pos.placement === "top" ? "translateY(-100%)" : "none",
                maxWidth: "calc(100vw - 32px)",
              }}
              className={cn(
                "fixed z-[101] w-80 sm:w-[350px]",
                "rounded-xl border border-border bg-popover p-3.5 sm:p-4",
                "shadow-2xl text-popover-foreground text-left",
                "animate-in fade-in-0 zoom-in-95 duration-150 space-y-3",
              )}
              onClick={(e) => e.stopPropagation()}
              role="tooltip"
            >
              {/* Pointer Beak / Arrow */}
              <div
                style={{ left: `${pos.arrowLeft}px` }}
                className={cn(
                  "absolute w-2.5 h-2.5 bg-popover rotate-45",
                  "pointer-events-none",
                  pos.placement === "bottom"
                    ? "-top-1.5 border-t border-l border-border"
                    : "-bottom-1.5 border-b border-r border-border",
                )}
              />

              {/* Tutorial Header */}
              <div
                className={cn(
                  "flex items-center justify-between border-b",
                  "border-border/70 pb-2",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    "text-xs font-bold text-primary truncate",
                  )}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{entry.folderName}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 shrink-0 font-mono"
                  >
                    Wing {entry.wingNumber}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setTooltipOpen(false)}
                  className={cn(
                    "rounded-md p-1 text-muted-foreground",
                    "hover:text-foreground hover:bg-secondary",
                    "transition-colors shrink-0 cursor-pointer",
                  )}
                  aria-label="Close guide"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tutorial Body Details */}
              <div className="space-y-2 text-xs">
                <div>
                  <span
                    className={cn(
                      "text-muted-foreground font-semibold block",
                      "text-[10px] uppercase tracking-wider",
                    )}
                  >
                    Target Drive Path
                  </span>
                  <code
                    className={cn(
                      "text-[10px] text-foreground font-mono bg-muted/60",
                      "px-1.5 py-0.5 rounded block truncate mt-0.5 border",
                      "border-border/50",
                    )}
                  >
                    {entry.path}
                  </code>
                </div>

                <div>
                  <span
                    className={cn(
                      "text-muted-foreground font-semibold block",
                      "text-[10px] uppercase tracking-wider",
                    )}
                  >
                    SOP Instruction
                  </span>
                  <p
                    className={cn(
                      "text-foreground leading-relaxed text-[11px] mt-0.5",
                    )}
                  >
                    {entry.instructions}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-muted-foreground font-semibold",
                        "text-[10px] uppercase tracking-wider",
                      )}
                    >
                      Prescribed Naming
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNaming}
                      className={cn(
                        "text-[10px] text-primary hover:underline",
                        "flex items-center gap-1 font-medium cursor-pointer",
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy format</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code
                    className={cn(
                      "text-[10px] text-primary font-mono bg-primary/10",
                      "px-1.5 py-0.5 rounded block truncate mt-0.5 border",
                      "border-primary/20",
                    )}
                  >
                    {entry.namingConvention}
                  </code>
                </div>

                <div
                  className={cn(
                    "grid grid-cols-2 gap-2 pt-1 border-t",
                    "border-border/60 text-[10px]",
                  )}
                >
                  <div>
                    <span className="text-muted-foreground block">
                      Formats:
                    </span>
                    <strong
                      className={cn(
                        "text-foreground font-semibold truncate block",
                      )}
                    >
                      {entry.acceptedFormats}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Owner:</span>
                    <strong
                      className={cn(
                        "text-foreground font-semibold truncate block",
                      )}
                    >
                      {entry.responsibleRoles[0] || "Council"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className={cn(
                  "flex items-center justify-between gap-2 pt-2 border-t",
                  "border-border/60",
                )}
              >
                <a
                  href={targetDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1",
                    "rounded-md bg-primary text-primary-foreground",
                    "text-[11px] font-semibold hover:bg-primary/90",
                    "transition-colors shadow-xs",
                  )}
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>Open Folder</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>

                {onOpenSopModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setTooltipOpen(false);
                      onOpenSopModal();
                    }}
                    className={cn(
                      "text-[11px] text-primary hover:underline",
                      "inline-flex items-center gap-1",
                      "font-medium cursor-pointer",
                    )}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>All SOPs &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};
