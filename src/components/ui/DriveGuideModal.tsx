import React, { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, FolderOpen, Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import {
  DRIVE_REGISTRY,
  ROOT_DRIVE_URL,
  WING_DEFINITIONS,
} from "@/lib/driveRegistry";
import { SearchBar } from "@/components/ui/SearchBar";

interface DriveGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWing?: string;
}

export const DriveGuideModal: React.FC<DriveGuideModalProps> = ({
  open,
  onOpenChange,
  initialWing = "all",
}) => {
  const [search, setSearch] = useState("");
  const [activeWing, setActiveWing] = useState(initialWing);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setActiveWing(initialWing);
    }
  }, [open, initialWing]);

  const entries = useMemo(() => {
    return Object.values(DRIVE_REGISTRY);
  }, []);

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter((e) => {
      const matchesWing = activeWing === "all" || e.wingNumber === activeWing;
      if (!matchesWing) return false;
      if (!q) return true;
      return (
        e.folderName.toLowerCase().includes(q) ||
        e.wingName.toLowerCase().includes(q) ||
        e.namingConvention.toLowerCase().includes(q) ||
        e.responsibleRoles.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [entries, search, activeWing]);

  const handleCopyNaming = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Council Google Drive & Storage SOPs"
      description={
        "Standard operating procedures, naming conventions, and " +
        "responsible portfolios for Computer Society A.Y. 2026-2027."
      }
      className="max-w-3xl"
    >
      <div className="space-y-3">
        {/* Search filter & Root Drive Button */}
        <div
          className={
            "flex flex-col sm:flex-row gap-2 items-stretch " + "sm:items-center"
          }
        >
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by committee, role, or document name..."
              size="sm"
            />
          </div>

          {ROOT_DRIVE_URL && (
            <a
              href={ROOT_DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={
                "inline-flex items-center justify-center gap-1.5 px-3 " +
                "h-8 rounded-md text-xs font-semibold bg-secondary " +
                "hover:bg-secondary/80 text-foreground border " +
                "border-border transition-colors shrink-0"
              }
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Main Drive Root</span>
            </a>
          )}
        </div>

        {/* Wing Filter Pills */}
        <div
          className={
            "flex items-center gap-1.5 overflow-x-auto pb-1 " +
            "scrollbar-none text-[11px]"
          }
        >
          {WING_DEFINITIONS.map((w) => {
            const isActive = activeWing === w.wingNumber;
            return (
              <button
                key={w.wingNumber}
                type="button"
                onClick={() => setActiveWing(w.wingNumber)}
                className={
                  "px-2.5 py-1 rounded-full whitespace-nowrap " +
                  "font-medium transition-colors " +
                  (isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary text-muted-foreground " +
                      "hover:text-foreground hover:bg-secondary/80")
                }
              >
                {w.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Entries list */}
        <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
          {filteredEntries.length === 0 ? (
            <div
              className={
                "p-8 text-center text-xs text-muted-foreground " +
                "border border-dashed rounded-lg"
              }
            >
              No matching storage guide found.
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.key}
                className={
                  "p-3.5 rounded-lg border border-border/80 bg-card " +
                  "hover:border-primary/40 transition-colors space-y-2.5"
                }
              >
                {/* Header */}
                <div
                  className={
                    "flex flex-col sm:flex-row sm:items-center " +
                    "justify-between gap-2"
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                    <span
                      className={
                        "text-xs font-bold text-foreground font-mono truncate"
                      }
                    >
                      {entry.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={
                        "text-[10px] uppercase font-bold " +
                        "text-muted-foreground"
                      }
                    >
                      {entry.wingName}
                    </span>

                    {entry.driveUrl || entry.defaultDriveUrl ? (
                      <a
                        href={entry.driveUrl || entry.defaultDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          "inline-flex items-center gap-1 px-2 py-0.5 " +
                          "rounded text-[11px] font-semibold bg-primary " +
                          "text-primary-foreground hover:bg-primary/90 " +
                          "transition-colors shadow-xs"
                        }
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Drive</span>
                      </a>
                    ) : (
                      <span
                        className={
                          "inline-flex items-center gap-1 px-1.5 py-0.5 " +
                          "rounded text-[10px] font-mono " +
                          "text-muted-foreground bg-secondary/60 " +
                          "border border-border/50"
                        }
                        title="Configure driveUrl in driveRegistry.ts"
                      >
                        <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                        <span>No Link</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Responsible roles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={
                      "text-[10px] font-semibold text-muted-foreground"
                    }
                  >
                    Accountable Roles:
                  </span>
                  {entry.responsibleRoles.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="text-[9px] py-0"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>

                {/* Naming pattern & format */}
                <div
                  className={
                    "grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs " +
                    "bg-muted/30 p-2 rounded border border-border/50"
                  }
                >
                  <div>
                    <span
                      className={
                        "text-[10px] text-muted-foreground block font-medium"
                      }
                    >
                      Standard Naming Pattern
                    </span>
                    <div
                      className={
                        "flex items-center justify-between gap-2 mt-0.5"
                      }
                    >
                      <code
                        className={
                          "text-[11px] font-mono text-primary truncate"
                        }
                      >
                        {entry.namingConvention}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyNaming(entry.key, entry.namingConvention)
                        }
                        className={
                          "text-muted-foreground hover:text-foreground " +
                          "shrink-0 p-0.5"
                        }
                        title="Copy pattern"
                      >
                        {copiedKey === entry.key ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span
                      className={
                        "text-[10px] text-muted-foreground block font-medium"
                      }
                    >
                      Accepted Formats
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      {entry.acceptedFormats}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <p
                  className={
                    "text-[11px] text-muted-foreground leading-relaxed"
                  }
                >
                  <strong className="text-foreground">SOP Rule:</strong>{" "}
                  {entry.instructions}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
};
