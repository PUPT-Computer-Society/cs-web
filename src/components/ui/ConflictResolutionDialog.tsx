import React, { useState } from "react";
import { AlertTriangle, Check, Copy, RefreshCw, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName?: string;
  draftContentToCopy?: string;
  onReloadLatest: () => void | Promise<void>;
}

export const ConflictResolutionDialog: React.FC<
  ConflictResolutionDialogProps
> = ({
  open,
  onOpenChange,
  entityName = "item",
  draftContentToCopy,
  onReloadLatest,
}) => {
  const [copied, setCopied] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleCopyDraft = async () => {
    if (!draftContentToCopy) return;
    try {
      await navigator.clipboard.writeText(draftContentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[handleCopyDraft] {Clipboard}:", err);
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await onReloadLatest();
      onOpenChange(false);
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Collaborative Conflict Detected"
      description={`The ${entityName} has newer updates on the server.`}
      className="max-w-md"
    >
      <div className="space-y-4 pt-1">
        <div
          className={
            "flex items-start gap-3 p-3.5 rounded-xl border " +
            "border-amber-500/30 bg-amber-500/10 text-amber-600 " +
            "dark:text-amber-400"
          }
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold">
              May nagbago mula sa kabilang device o session.
            </p>
            <p className="text-muted-foreground">
              Upang hindi ma-overwrite ang pinakabagong bersyon sa server,
              hindi muna itinuloy ang pag-save.
            </p>
          </div>
        </div>

        {draftContentToCopy && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Your Local Draft:
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyDraft}
                className="h-7 text-xs gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Draft
                  </>
                )}
              </Button>
            </div>
            <div
              className={
                "p-2.5 rounded-lg border border-border bg-muted/40 " +
                "text-xs font-mono max-h-28 overflow-y-auto line-clamp-4"
              }
            >
              {draftContentToCopy}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto flex-1 min-h-[40px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleReload}
            disabled={isReloading}
            className="w-full sm:w-auto flex-1 min-h-[40px] gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`}
            />
            Load Latest Data
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
