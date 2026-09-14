import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Copy,
  ExternalLink,
  FileCode,
  FileText,
  Info,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  User,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { getGooglePreviewUrl } from "@/lib/preview";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { title } from "process";

export interface DocumentCustomField {
  label: string;
  value: string | React.ReactNode;
}

export interface DocumentFileMeta {
  fileName?: string;
  title?: string;
  fileType?: string;
  category?: string;
  status?: string;
  dateUploaded?: string;
  description?: string;
  authorOrUploader?: string;
  customFields?: DocumentCustomField[];
}

export interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  subtitle?: string;
  fileMeta?: DocumentFileMeta;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  onClose,
  title,
  url,
  subtitle,
  fileMeta,
}) => {
  const toast = useToast();
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const previewUrl = getGooglePreviewUrl(url);

  useEffect(() => {
    if (open) {
      setIsLoadingIframe(true);
      // Timeout fallback in case browser blocks iframe due to restricted permissions
      const timer = setTimeout(() => {
        setIsLoadingIframe(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [open, url]);

  const handleCopyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Document link copied to clipboard!");
  };

  // Derive display values
  const displayTitle = fileMeta?.title || title || "Document Preview";
  const displayFileName =
    fileMeta?.fileName ||
    (url ? url.split("/").pop()?.split("?")[0] : undefined) ||
    displayTitle;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setIsLoadingIframe(true);
          onClose();
        }
      }}
      title={displayTitle}
      description={
        subtitle ||
        "In-portal document inspection with file metadata and Google Drive integration."
      }
      className="max-w-6xl w-[96vw] max-h-[92vh] p-4 sm:p-6"
    >
      <div className="flex flex-col space-y-3 pt-1">
        {/* Top Control Bar with Sidebar Toggle & Direct Links */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-border/70 text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar((prev) => !prev)}
              className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title={
                showSidebar ? "Hide details sidebar" : "Show details sidebar"
              }
            >
              {showSidebar ? (
                <>
                  <PanelLeftClose className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hide Info</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Show Info</span>
                </>
              )}
            </Button>

            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
              <span className="font-mono truncate max-w-[200px] sm:max-w-xs">
                {displayFileName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
              title="Copy shareable link"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Copy Link</span>
            </Button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs"
            >
              <span>Open in Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Split View: Left Document Information Sidebar + Right Preview Frame */}
        <div className="flex flex-col md:flex-row items-stretch gap-3 w-full min-h-[60vh] max-h-[68vh]">
          {/* LEFT: File Information Sidebar */}
          {showSidebar && (
            <aside className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col rounded-xl border border-border/80 bg-card/90 shadow-inner overflow-y-auto p-4 space-y-4 text-xs animate-in fade-in-0 duration-150">
              {/* Header Title & Badges */}
              <div className="space-y-2 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  {fileMeta?.status && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {fileMeta.status}
                    </Badge>
                  )}
                  {fileMeta?.category && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{fileMeta.category}</span>
                    </Badge>
                  )}
                  {fileMeta?.fileType && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-muted-foreground"
                    >
                      {fileMeta.fileType}
                    </Badge>
                  )}
                </div>

                <h4 className="font-bold text-sm text-foreground leading-snug break-words">
                  {displayTitle}
                </h4>
              </div>

              {/* Structured Metadata Grid (Miller's Law) */}
              <div className="space-y-2.5 pb-3 border-b border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  File Properties
                </p>

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <FileCode className="w-3.5 h-3.5 text-primary" />
                      <span>File Name</span>
                    </span>
                    <span className="font-mono font-medium text-foreground text-right break-all text-[11px]">
                      {displayFileName}
                    </span>
                  </div>

                  {fileMeta?.dateUploaded && (
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Date Recorded</span>
                      </span>
                      <span className="font-medium text-foreground text-right">
                        {fileMeta.dateUploaded}
                      </span>
                    </div>
                  )}

                  {fileMeta?.authorOrUploader && (
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>Officer / Author</span>
                      </span>
                      <span className="font-medium text-foreground text-right">
                        {fileMeta.authorOrUploader}
                      </span>
                    </div>
                  )}

                  {/* Custom Domain Fields */}
                  {fileMeta?.customFields?.map((field, fIdx) => (
                    <div
                      key={`custom-${fIdx}`}
                      className="flex items-start justify-between gap-2 text-xs"
                    >
                      <span className="text-muted-foreground shrink-0">
                        {field.label}
                      </span>
                      <span className="font-medium text-foreground text-right">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Markdown Description Section */}
              <div className="space-y-1.5 flex-1 min-h-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Layers className="w-3 h-3 text-primary" />
                  <span>Description & Details</span>
                </p>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 max-h-56 overflow-y-auto">
                  <MarkdownRenderer
                    content={fileMeta?.description}
                    className="text-xs text-foreground/90"
                  />
                </div>
              </div>
            </aside>
          )}

          {/* RIGHT: Main Document Preview Frame */}
          <main className="flex-1 min-w-0 flex flex-col rounded-xl border border-border/80 bg-secondary/15 overflow-hidden relative shadow-inner">
            {/* Permission Help Alert Banner */}
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Requires <strong>"Anyone with the link"</strong> on Google
                  Drive. If blank, open directly.
                </span>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline shrink-0 flex items-center gap-1 ml-2"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {/* Iframe or Fallback */}
            <div className="relative w-full flex-1 min-h-[350px]">
              {previewUrl ? (
                <>
                  {isLoadingIframe && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/85 backdrop-blur-xs z-10 text-muted-foreground text-xs">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading Google document preview...</span>
                    </div>
                  )}
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0 absolute inset-0"
                    title={displayTitle}
                    onLoad={() => setIsLoadingIframe(false)}
                    allow="autoplay"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Embedded preview unavailable for this URL format.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      This resource is hosted externally or uses an unrecognized
                      Drive link scheme.
                    </p>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    <span>Open Link Directly</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 text-xs text-muted-foreground border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>
              Google Drive:{" "}
              <em>Share → General Access → Anyone with the link</em>.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
              className="h-8 px-4 text-xs cursor-pointer"
            >
              Close Preview
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
