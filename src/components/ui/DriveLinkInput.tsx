import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  HelpCircle,
  Sparkles,
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
            <div
              className="relative inline-flex items-center"
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
            >
              <button
                type="button"
                onClick={() => setTooltipOpen((prev) => !prev)}
                className={cn(
                  "text-muted-foreground hover:text-primary",
                  "transition-colors focus:outline-none",
                )}
                aria-label="View Storage SOP Guidance"
              >
                <HelpCircle className="w-3.5 h-3.5 text-primary/80" />
              </button>

              {/* Interactive Tooltip Card */}
              {tooltipOpen && (
                <div
                  role="tooltip"
                  className={cn(
                    "absolute left-0 bottom-full mb-2 z-50 w-72 sm:w-80",
                    "rounded-md border border-border bg-popover p-3 shadow-xl",
                    "text-popover-foreground text-left",
                    "animate-in fade-in-50 zoom-in-95",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between border-b",
                      "border-border/60 pb-1.5 mb-2",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        "text-[11px] font-bold text-primary",
                      )}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span className="truncate">{entry.folderName}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      Wing {entry.wingNumber}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-[10px]">
                    <div>
                      <span className="text-muted-foreground font-medium block">
                        Target Folder Path:
                      </span>
                      <code
                        className={cn(
                          "text-[10px] text-foreground font-mono bg-muted/60",
                          "px-1 py-0.5 rounded block truncate",
                        )}
                      >
                        {entry.path}
                      </code>
                    </div>

                    <div>
                      <span className="text-muted-foreground font-medium block">
                        SOP Instruction:
                      </span>
                      <p className="text-foreground leading-tight">
                        {entry.instructions}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">
                          Prescribed Naming:
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyNaming}
                          className={cn(
                            "text-[9px] text-primary hover:underline",
                            "flex items-center gap-0.5",
                          )}
                        >
                          {copied ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <code
                        className={cn(
                          "text-[10px] text-primary font-mono bg-primary/10",
                          "px-1 py-0.5 rounded block truncate mt-0.5",
                        )}
                      >
                        {entry.namingConvention}
                      </code>
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-between pt-1 border-t",
                        "border-border/50 text-[9px]",
                      )}
                    >
                      <span className="text-muted-foreground">
                        Formats: <strong>{entry.acceptedFormats}</strong>
                      </span>
                      <span
                        className="text-muted-foreground truncate max-w-[120px]"
                      >
                        Owner: {entry.responsibleRoles[0] || "Council"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {onOpenSopModal && (
          <button
            type="button"
            onClick={onOpenSopModal}
            className={cn(
              "text-[10px] text-primary hover:underline font-medium",
              "inline-flex items-center gap-0.5",
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
    </div>
  );
};
