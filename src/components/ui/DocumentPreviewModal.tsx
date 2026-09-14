import React, { useEffect, useState } from "react";
import { AlertCircle, ExternalLink, FileText, Info } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { getGooglePreviewUrl } from "@/lib/preview";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  subtitle?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  onClose,
  title,
  url,
  subtitle,
}) => {
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);
  const previewUrl = getGooglePreviewUrl(url);

  useEffect(() => {
    if (open) {
      setIsLoadingIframe(true);
      // Timeout fallback in case browser blocks iframe due to 401/Restricted permissions
      const timer = setTimeout(() => {
        setIsLoadingIframe(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [open, url]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setIsLoadingIframe(true);
          onClose();
        }
      }}
      title={title || "Document Preview"}
      description={
        subtitle ||
        "In-portal inspection for Google Docs, Spreadsheets, Slides, and Drive files."
      }
      className="max-w-4xl w-[95vw]"
    >
      <div className="space-y-3 pt-2">
        {/* Permission Help Alert Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Requires <strong>"Anyone with the link"</strong> on Google Drive.
              If blank or <strong>401 Unauthorized</strong>, open directly.
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {previewUrl ? (
          <div className="relative w-full h-[65vh] rounded-lg border border-border/80 bg-secondary/15 overflow-hidden shadow-inner">
            {isLoadingIframe && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/80 backdrop-blur-xs z-10 text-muted-foreground text-xs">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading Google document preview...</span>
              </div>
            )}
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={title}
              onLoad={() => setIsLoadingIframe(false)}
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        ) : (
          <div className="p-8 rounded-lg border border-dashed border-border bg-card/60 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Embedded preview unavailable for this URL format.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This resource may be hosted outside Google Drive or is using an
                unrecognized link scheme.
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <span>Open Link Directly</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Footer controls & sharing guide */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>
              Google Drive: <em>Share → General Access → Anyone with the link</em>.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-foreground text-xs font-medium transition-colors"
            >
              <span>Open Original</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
