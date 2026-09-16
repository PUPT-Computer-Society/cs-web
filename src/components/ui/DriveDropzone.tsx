import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  Upload,
  X,
} from "lucide-react";
import { api } from "@/api/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { LiquidSphereLoader } from "@/components/ui/LiquidSphereLoader";

interface DriveUploadResponse {
  driveUrl: string;
  fileId: string;
  fileName: string;
}

interface DriveDropzoneProps {
  label?: string;
  moduleType:
    | "finance"
    | "resolution"
    | "inventory"
    | "material"
    | "gpoa"
    | "template";
  targetFolderId?: string;
  title?: string;
  docType?: string;
  docNumber?: string;
  merchant?: string;
  amount?: number;
  orNumber?: string;
  condition?: string;
  category?: string;
  value?: string | null;
  fileId?: string | null;
  onUploaded: (driveUrl: string, fileId?: string, fileName?: string) => void;
  onCleared?: () => void;
  accept?: string;
  className?: string;
}

export const detectGoogleDocType = (
  url: string,
): { label: string; color: string } => {
  if (url.includes("/document/d/")) {
    return {
      label: "Google Docs",
      color:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 " +
        "border-blue-500/20",
    };
  }
  if (url.includes("/spreadsheets/d/")) {
    return {
      label: "Google Sheets",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 " +
        "border-emerald-500/20",
    };
  }
  if (url.includes("/presentation/d/")) {
    return {
      label: "Google Slides",
      color:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 " +
        "border-amber-500/20",
    };
  }
  if (url.includes("drive.google.com")) {
    return {
      label: "Google Drive File",
      color:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 " +
        "border-purple-500/20",
    };
  }
  return {
    label: "Collaborative Doc",
    color: "bg-secondary text-secondary-foreground border-border",
  };
};

export const DriveDropzone: React.FC<DriveDropzoneProps> = ({
  label,
  moduleType,
  targetFolderId,
  title,
  docType,
  docNumber,
  merchant,
  amount,
  orNumber,
  condition,
  category,
  value,
  fileId,
  onUploaded,
  onCleared,
  accept = ".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.xls,.csv,.pptx,.txt",
  className,
}) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [mode, setMode] = useState<"file" | "collaborative">("file");
  const [collabUrl, setCollabUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(25);
  const [currentUploadingName, setCurrentUploadingName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setCurrentUploadingName(file.name);
    setUploadProgress(20);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 350);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("module_type", moduleType);
      if (title) formData.append("title", title);
      if (docType) formData.append("doc_type", docType);
      if (docNumber) formData.append("doc_number", docNumber);
      if (merchant) formData.append("merchant", merchant);
      if (amount !== undefined) formData.append("amount", String(amount));
      if (orNumber) formData.append("or_number", orNumber);
      if (condition) formData.append("condition", condition);
      if (category) formData.append("category", category);
      if (targetFolderId) formData.append("target_folder_id", targetFolderId);

      const res = await api.postForm<DriveUploadResponse>(
        "/drive/upload",
        formData,
      );
      setUploadProgress(100);
      setUploadedFileName(res.fileName || file.name);
      onUploaded(res.driveUrl, res.fileId, res.fileName);
      toastSuccess(`File uploaded to Google Drive as ${res.fileName}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload to Drive";
      toastError(msg);
    } finally {
      clearInterval(progressTimer);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentUploadingName("");
      }, 400);
    }
  };

  const handleCollaborativeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = collabUrl.trim();
    if (!trimmed) {
      toastError("Please enter a valid Google Docs, Sheets, or Drive link.");
      return;
    }

    setIsUploading(true);
    const detected = detectGoogleDocType(trimmed);
    setCurrentUploadingName(detected.label);
    setUploadProgress(25);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 300);

    try {
      const payload = {
        sourceUrl: trimmed,
        moduleType,
        title: title || "",
        docType: docType || "resolution",
        docNumber: docNumber || "",
        merchant: merchant || "",
        amount: amount !== undefined ? amount : 0,
        orNumber: orNumber || "",
        condition: condition || "Good",
        category: category || "General",
        targetFolderId: targetFolderId || undefined,
      };

      const res = await api.post<DriveUploadResponse>(
        "/drive/collaborative",
        payload,
      );
      setUploadProgress(100);
      setUploadedFileName(res.fileName || detected.label);
      onUploaded(res.driveUrl, res.fileId, res.fileName);
      setCollabUrl("");
      toastSuccess(`Copied to Council Drive as ${res.fileName}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to copy collaborative file";
      toastError(msg);
    } finally {
      clearInterval(progressTimer);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentUploadingName("");
      }, 400);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (isUploading) {
    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label className="text-xs font-semibold text-foreground">
            {label}
          </label>
        )}
        <div
          className={cn(
            "border-2 border-primary/40 rounded-xl p-5 flex flex-col",
            "items-center justify-center bg-primary/5 text-center shadow-inner",
          )}
        >
          <LiquidSphereLoader
            progress={uploadProgress}
            message="PROCESSING DRIVE ASSET"
            subMessage={currentUploadingName || "STREAMING TO SOP FOLDER"}
          />
        </div>
      </div>
    );
  }

  if (value) {
    const detected = detectGoogleDocType(value);
    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label className="text-xs font-semibold text-foreground">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center justify-between p-2.5 rounded-xl",
            "border border-border/80 bg-secondary/30 text-xs gap-2",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="truncate min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground truncate block">
                  {uploadedFileName || "Council Drive Document"}
                </span>
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full border " +
                      "font-semibold",
                    detected.color,
                  )}
                >
                  {detected.label}
                </span>
              </div>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-[11px] text-primary hover:underline",
                  "inline-flex items-center gap-1 truncate mt-0.5",
                )}
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setUploadedFileName(null);
                if (onCleared) onCleared();
              }}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-semibold",
                "bg-background border border-border/80 hover:bg-accent",
                "text-foreground transition-colors",
              )}
            >
              Replace
            </button>
            {onCleared && (
              <button
                type="button"
                onClick={() => {
                  setUploadedFileName(null);
                  onCleared();
                }}
                className={cn(
                  "p-1 rounded-lg text-muted-foreground",
                  "hover:text-destructive hover:bg-destructive/10",
                )}
                title="Remove file reference"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label className="text-xs font-semibold text-foreground truncate">
            {label}
          </label>
        )}
        <div
          className={
            "flex items-center gap-1 bg-secondary/50 p-0.5 rounded-lg shrink-0"
          }
        >
          <button
            type="button"
            onClick={() => setMode("file")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] " +
                "font-medium transition-colors",
              mode === "file"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("collaborative")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] " +
                "font-medium transition-colors",
              mode === "collaborative"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Google Doc / Sheet
          </button>
        </div>
      </div>

      {mode === "file" ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 flex flex-col " +
              "items-center justify-center gap-1.5 cursor-pointer " +
              "transition-colors text-center",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border/80 hover:border-primary/50 bg-secondary/15",
            isUploading && "pointer-events-none opacity-70",
          )}
        >
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              Drop file or click to upload to Drive
            </p>
            <p className="text-[10px] text-muted-foreground">
              PDF, Word, Excel, CSV, PPTX, or image • Council SOP naming
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleInputChange}
            disabled={isUploading}
          />
        </label>
      ) : (
        <div
          className={cn(
            "border border-border/80 bg-card rounded-xl p-3 space-y-2",
            "shadow-2xs overflow-hidden",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className={
                "flex items-center gap-1.5 text-xs font-semibold " +
                "text-foreground min-w-0"
              }
            >
              <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Paste Google Collaborative URL</span>
            </div>
            {collabUrl && (
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full border " +
                    "font-semibold shrink-0",
                  detectGoogleDocType(collabUrl).color,
                )}
              >
                {detectGoogleDocType(collabUrl).label}
              </span>
            )}
          </div>
          <div
            className={
              "flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5"
            }
          >
            <input
              type="url"
              value={collabUrl}
              onChange={(e) => setCollabUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCollaborativeSubmit();
                }
              }}
              placeholder="https://docs.google.com/document/d/... or sheets"
              className={cn(
                "flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-border " +
                  "bg-background text-xs text-foreground " +
                  "placeholder:text-muted-foreground/60 focus:outline-hidden " +
                  "focus:ring-1 focus:ring-primary font-mono",
              )}
            />
            <button
              type="button"
              onClick={() => handleCollaborativeSubmit()}
              disabled={!collabUrl.trim() || isUploading}
              className={cn(
                "h-8 px-3 rounded-lg bg-primary text-primary-foreground",
                "text-xs font-semibold hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:pointer-events-none " +
                  "shadow-xs shrink-0 whitespace-nowrap",
              )}
            >
              Copy to Drive
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Clones into official Council folder with automated SOP name.
          </p>
        </div>
      )}
    </div>
  );
};
