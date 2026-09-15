import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
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
  moduleType: "finance" | "resolution" | "inventory" | "material" | "gpoa";
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
  accept = ".pdf,.jpg,.jpeg,.png,.docx",
  className,
}) => {
  const { error: toastError, success: toastSuccess } = useToast();
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
            message="UPLOADING TO DRIVE"
            subMessage={currentUploadingName || "STREAMING TO SOP FOLDER"}
          />
        </div>
      </div>
    );
  }

  if (value) {
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
              <span className="font-semibold text-foreground truncate block">
                {uploadedFileName || "Uploaded to Google Drive"}
              </span>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-[11px] text-primary hover:underline",
                  "inline-flex items-center gap-1 truncate",
                )}
              >
                <span>View in Drive</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <label
              className={cn(
                "cursor-pointer px-2 py-1 rounded-lg text-[11px]",
                "font-semibold bg-background border border-border/80",
                "hover:bg-accent text-foreground transition-colors",
              )}
            >
              <span>Replace</span>
              <input
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleInputChange}
                disabled={isUploading}
              />
            </label>
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
      {label && (
        <label className="text-xs font-semibold text-foreground">
          {label}
        </label>
      )}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 flex flex-col items-center",
          "justify-center gap-1.5 cursor-pointer transition-colors text-center",
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
            Automatic Council SOP naming applied on upload
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
    </div>
  );
};
