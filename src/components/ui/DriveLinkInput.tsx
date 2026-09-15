import React, { useState, useEffect } from "react";
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

  const entry: DriveFolderEntry | undefined = registryKey
    ? DRIVE_REGISTRY[registryKey]
    : undefined;

  const targetDriveUrl =
    entry?.driveUrl || entry?.defaultDriveUrl || ROOT_DRIVE_URL;

  // Dismiss focus modal when user hits Escape
  useEffect(() => {
    if (!tooltipOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTooltipOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tooltipOpen]);

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
              type="button"
              onClick={() => setTooltipOpen(true)}
              className={cn(
                "text-muted-foreground hover:text-primary",
                "transition-colors focus:outline-none p-0.5 rounded",
                "hover:bg-primary/10 cursor-pointer inline-flex",
                "items-center",
              )}
              aria-label={`View SOP guidance for ${entry.folderName}`}
              title="Click to view SOP folder and naming guide"
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
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center",
          "justify-between gap-1 pt-0.5",
        )}
      >
        <p className="text-[10px] text-muted-foreground leading-tight">
          {helperText || (
            <>
              Set General Access to{" "}
              <strong className="text-foreground">
                "Anyone with the link"
              </strong>{" "}
              on Drive for live preview.
            </>
          )}
        </p>

        {targetDriveUrl && entry && (
          <a
            href={targetDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold",
              "text-primary hover:text-primary/80 hover:underline",
              "shrink-0 transition-colors",
            )}
            title={`Open ${entry.folderName} in Google Drive in a new tab`}
          >
            <FolderOpen className="w-3 h-3 text-amber-500" />
            <span>Open {entry.folderName}</span>
            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
          </a>
        )}
      </div>

      {/* Full-DOM Overlay Dim and Focused Spotlight SOP Card via Portal */}
      {entry && tooltipOpen && typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[100] flex items-center",
              "justify-center p-4",
            )}
            role="dialog"
            aria-modal="true"
            aria-label={`Storage SOP Guidance: ${entry.folderName}`}
          >
            {/* Overlay Dim on the whole DOM */}
            <div
              className={cn(
                "fixed inset-0 bg-black/65 backdrop-blur-xs",
                "animate-in fade-in-0 duration-150",
              )}
              onClick={() => setTooltipOpen(false)}
              aria-hidden="true"
            />

            {/* Focused SOP Guidance Card sitting strictly on top */}
            <div
              className={cn(
                "relative z-10 w-full max-w-sm sm:max-w-md",
                "rounded-xl border border-border bg-card p-4 sm:p-5",
                "shadow-2xl text-card-foreground text-left",
                "animate-in fade-in-0 zoom-in-95 duration-150 space-y-3.5",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={cn(
                  "flex items-center justify-between border-b",
                  "border-border/70 pb-2.5",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    "text-xs sm:text-sm font-bold text-primary truncate",
                  )}
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span className="truncate">{entry.folderName}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 shrink-0"
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
                  aria-label="Close SOP Guidance"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Properties */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <span
                    className={cn(
                      "text-muted-foreground font-semibold block",
                      "text-[11px]",
                    )}
                  >
                    Target Drive Path:
                  </span>
                  <code
                    className={cn(
                      "text-[11px] text-foreground font-mono bg-muted/60",
                      "px-2 py-1 rounded block truncate mt-0.5 border",
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
                      "text-[11px]",
                    )}
                  >
                    SOP Instruction:
                  </span>
                  <p className="text-foreground leading-relaxed text-xs mt-0.5">
                    {entry.instructions}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-muted-foreground font-semibold text-[11px]",
                      )}
                    >
                      Prescribed Naming Convention:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNaming}
                      className={cn(
                        "text-[11px] text-primary hover:underline",
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
                      "text-[11px] text-primary font-mono bg-primary/10",
                      "px-2 py-1 rounded block truncate mt-1 border",
                      "border-primary/20",
                    )}
                  >
                    {entry.namingConvention}
                  </code>
                </div>

                <div
                  className={cn(
                    "grid grid-cols-2 gap-2 pt-1 border-t",
                    "border-border/60 text-[11px]",
                  )}
                >
                  <div>
                    <span className="text-muted-foreground block text-[10px]">
                      Accepted Formats:
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
                    <span className="text-muted-foreground block text-[10px]">
                      Responsible Role:
                    </span>
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
                    "inline-flex items-center gap-1.5 px-3 py-1.5",
                    "rounded-md bg-primary text-primary-foreground",
                    "text-xs font-semibold hover:bg-primary/90",
                    "transition-colors shadow-xs",
                  )}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Target Folder</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>

                {onOpenSopModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setTooltipOpen(false);
                      onOpenSopModal();
                    }}
                    className={cn(
                      "text-xs text-primary hover:underline",
                      "inline-flex items-center gap-1",
                      "font-medium cursor-pointer",
                    )}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>View All SOPs &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
