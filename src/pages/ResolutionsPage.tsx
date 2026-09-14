import React, { useState } from "react";
import {
  ExternalLink,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  ScrollText,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DocumentPreviewModal } from "@/components/ui/DocumentPreviewModal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { DriveGuideModal } from "@/components/ui/DriveGuideModal";
import { getGooglePreviewUrl } from "@/lib/preview";
import type { Resolution, InternalDocumentType } from "@/types";

const PAGE_SIZE = 8;

const DOC_TYPE_OPTIONS = [
  { value: "resolution", label: "Resolution" },
  { value: "memorandum", label: "Memorandum" },
  { value: "meeting_minutes", label: "Meeting Minutes" },
  { value: "policy", label: "Policy Guideline" },
  { value: "constitution", label: "Constitution" },
];

const RESOLUTION_STATUS_OPTIONS = [
  { value: "Approved", label: "Approved / In Effect" },
  { value: "Pending", label: "Pending Signature" },
  { value: "Tabled", label: "Tabled / Under Review" },
];

const DOCUMENT_TABS = [
  { id: "all", label: "All Documents" },
  { id: "resolution", label: "Resolutions" },
  { id: "memorandum", label: "Memorandums" },
  { id: "meeting_minutes", label: "Meeting Minutes" },
  { id: "policy", label: "Policies" },
  { id: "constitution", label: "Constitution" },
] as const;

const DOCUMENT_TYPE_LABELS: Record<InternalDocumentType, string> = {
  resolution: "Resolution",
  memorandum: "Memorandum",
  meeting_minutes: "Meeting Minutes",
  policy: "Policy Guideline",
  constitution: "Constitution",
};

export const ResolutionsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { user, isPresident, hasPermission } = useAuth();
  const canResolve = hasPermission("resolve_affairs");

  const [activeTab, setActiveTab] = useState<"all" | InternalDocumentType>(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack Query
  const endpoint =
    activeTab === "all"
      ? "/resolutions"
      : `/resolutions?document_type=${activeTab}`;
  const { data: resolutions = [], isLoading } = useQuery<Resolution[]>({
    queryKey: queryKeys.resolutions(activeTab),
    queryFn: () => api.get<Resolution[]>(endpoint),
  });

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [previewResolution, setPreviewResolution] = useState<Resolution | null>(
    null,
  );
  const [editingResolution, setEditingResolution] = useState<Resolution | null>(
    null,
  );
  const [deletingResolution, setDeletingResolution] =
    useState<Resolution | null>(null);
  const [driveGuideOpen, setDriveGuideOpen] = useState(false);

  // Create Form
  const [resolutionNo, setResolutionNo] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] =
    useState<InternalDocumentType | "">("");
  const [body, setBody] = useState("");
  const [driveDocUrl, setDriveDocUrl] = useState("");
  const [status, setStatus] = useState("");

  // Edit Form
  const [editNo, setEditNo] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDocType, setEditDocType] =
    useState<InternalDocumentType>("resolution");
  const [editBody, setEditBody] = useState("");
  const [editDriveUrl, setEditDriveUrl] = useState("");
  const [editStatus, setEditStatus] = useState("Approved");

  const canEdit = (res: Resolution) =>
    Boolean(
      user && (user.id === res.authoredById || canResolve || isPresident),
    );

  // Mutations
  const createResolutionMutation = useMutation({
    mutationFn: (newRes: Record<string, unknown>) =>
      api.post("/resolutions", newRes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
      setCreateOpen(false);
      setResolutionNo("");
      setTitle("");
      setBody("");
      setDriveDocUrl("");
      setDocumentType("");
      setStatus("");
      toastSuccess("Document filed successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to file document");
    },
  });

  const updateResolutionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/resolutions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
      setEditingResolution(null);
      toastSuccess("Document updated successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update document");
    },
  });

  const deleteResolutionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resolutions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
      setDeletingResolution(null);
      toastSuccess("Document deleted successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete document");
    },
  });

  const handleCreateResolution = (e: React.FormEvent) => {
    e.preventDefault();
    createResolutionMutation.mutate({
      resolutionNo,
      title,
      body,
      status: status || "Approved",
      documentType: documentType || "resolution",
      driveDocUrl: driveDocUrl || null,
    });
  };

  const openEditDialog = (res: Resolution) => {
    setEditingResolution(res);
    setEditNo(res.resolutionNo);
    setEditTitle(res.title);
    setEditDocType(res.documentType || "resolution");
    setEditBody(res.body);
    setEditDriveUrl(res.driveDocUrl || "");
    setEditStatus(res.status);
  };

  const handleUpdateResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResolution) return;
    updateResolutionMutation.mutate({
      id: editingResolution.id,
      data: {
        resolutionNo: editNo,
        title: editTitle,
        body: editBody,
        status: editStatus,
        documentType: editDocType,
        driveDocUrl: editDriveUrl || null,
      },
    });
  };

  const handleDeleteResolution = () => {
    if (!deletingResolution) return;
    deleteResolutionMutation.mutate(deletingResolution.id);
  };

  const handleTabChange = (tab: "all" | InternalDocumentType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedResolutions = resolutions.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <>
      <Header
        title="Internal Affairs & Documentations"
        subtitle="Official resolutions, policy memorandums, and constitutional records"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Document Type Tab Switcher & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg border border-border bg-secondary/40">
              {DOCUMENT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Switcher (Google Drive style Grid / List) */}
            <div className="flex items-center gap-0.5 p-1 rounded-lg border border-border bg-secondary/40">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Google Drive Tiled Cards (Preview Mode)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Detailed List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {(canResolve || isPresident) && (
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="text-[11px] font-semibold shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              File Document
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : resolutions.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card">
            <p className="text-xs text-muted-foreground">
              No documents recorded under this category yet.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Google Drive Tiled Cards with Live Preview */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedResolutions.map((res) => {
              const isOwner = user?.id === res.authoredById;
              const userCanEdit = canEdit(res);
              const previewUrl = getGooglePreviewUrl(res.driveDocUrl);

              return (
                <Card
                  key={res.id}
                  className="group flex flex-col justify-between overflow-hidden border border-border/80 hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card"
                >
                  {/* Google Drive Preview Thumbnail Area */}
                  <div className="relative w-full h-44 bg-secondary/30 border-b border-border overflow-hidden select-none">
                    {previewUrl ? (
                      <>
                        <iframe
                          src={previewUrl}
                          className="w-full h-full border-0 pointer-events-none select-none scale-[1.02] transform-gpu origin-top-left"
                          title={res.title}
                          loading="lazy"
                        />
                        {/* Interactive Click-to-Expand Overlay */}
                        <div
                          onClick={() => setPreviewResolution(res)}
                          className="absolute inset-0 bg-background/0 hover:bg-background/40 transition-all flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 backdrop-blur-2xs"
                        >
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background/95 border border-border shadow-xs text-xs font-semibold text-foreground hover:text-primary transition-colors">
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            Expand Preview
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Document Ledger Watermark Thumbnail for non-Google Docs records */
                      <div className="w-full h-full p-3.5 flex flex-col justify-between bg-card/60 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-foreground/80 bg-secondary px-1.5 py-0.5 rounded">
                            {res.resolutionNo}
                          </span>
                          <ScrollText className="w-4 h-4 text-muted-foreground/60" />
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-4 leading-relaxed font-serif italic select-none">
                          "{res.body}"
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 border-t border-border/40 pt-1">
                          <span>Council Record</span>
                          <span className="font-semibold text-primary/80">
                            Internal
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata and Actions */}
                  <CardContent className="p-4 flex flex-col justify-between flex-1 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[11px] font-bold text-foreground">
                            {res.resolutionNo}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-semibold"
                          >
                            {DOCUMENT_TYPE_LABELS[res.documentType] ||
                              res.documentType}
                          </Badge>
                          {isOwner && (
                            <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              Author
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-semibold"
                        >
                          {res.status}
                        </Badge>
                      </div>

                      <h4
                        className="text-xs font-bold text-foreground line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => {
                          if (res.driveDocUrl) setPreviewResolution(res);
                        }}
                        title={res.title}
                      >
                        {res.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {res.body}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(res.passedDate).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1">
                        {userCanEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditDialog(res)}
                              className="p-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-xs transition-colors"
                              title="Edit Document"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingResolution(res)}
                              className="p-1 rounded-md border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {res.driveDocUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewResolution(res)}
                              className="p-1 rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={res.driveDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Open in Google Docs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Detailed List View */
          <div className="space-y-3">
            {paginatedResolutions.map((res) => {
              const isOwner = user?.id === res.authoredById;
              const userCanEdit = canEdit(res);

              return (
                <Card key={res.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {res.resolutionNo}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-semibold"
                        >
                          {DOCUMENT_TYPE_LABELS[res.documentType] ||
                            res.documentType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-semibold"
                        >
                          {res.status}
                        </Badge>
                        {isOwner && (
                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            Author
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Passed: {new Date(res.passedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {res.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                      {res.body}
                    </p>

                    <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Official Record
                      </span>
                      <div className="flex items-center gap-1.5">
                        {userCanEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditDialog(res)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-[11px] font-semibold transition-colors"
                              title="Edit Document"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingResolution(res)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[11px] font-semibold transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {res.driveDocUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewResolution(res)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors"
                              title="Preview document in portal"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                            <a
                              href={res.driveDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Open original in Google Docs"
                            >
                              <span>Docs</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {resolutions.length > 0 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalItems={resolutions.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* File Document Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="File Internal Document"
        description="Formal legislative and policy records are stored with full audit traceability."
      >
        <form onSubmit={handleCreateResolution} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Document Number / Ref
              </label>
              <Input
                type="text"
                value={resolutionNo}
                onChange={(e) => setResolutionNo(e.target.value)}
                required
                placeholder="e.g. RES-2026-001 / MEMO-001"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Document Type
              </label>
              <Select
                value={documentType}
                onValueChange={(val) =>
                  setDocumentType(val as InternalDocumentType)
                }
                options={DOC_TYPE_OPTIONS}
                placeholder="Select Document Type..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Status
              </label>
              <Select
                value={status}
                onValueChange={setStatus}
                options={RESOLUTION_STATUS_OPTIONS}
                placeholder="Select Status..."
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Google Docs URL (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setDriveGuideOpen(true)}
                  className="text-[10px] text-primary hover:underline"
                >
                  Storage SOP &rarr;
                </button>
              </div>
              <Input
                type="url"
                value={driveDocUrl}
                onChange={(e) => setDriveDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Make sure General Access is set to{" "}
                <strong>"Anyone with the link"</strong> on Drive for live
                preview.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Title
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Resolution Adopting the 2026 Internal Guidelines"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Clauses / Executive Summary
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-1.5 rounded-md text-xs border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="WHEREAS, the organization..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Document
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog
        open={!!editingResolution}
        onOpenChange={(open) => {
          if (!open) setEditingResolution(null);
        }}
        title="Edit Internal Document"
        description="Update record contents, status, or linked Google Docs file."
      >
        <form onSubmit={handleUpdateResolution} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Document Number / Ref
              </label>
              <Input
                type="text"
                value={editNo}
                onChange={(e) => setEditNo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Document Type
              </label>
              <Select
                value={editDocType}
                onValueChange={(val) =>
                  setEditDocType(val as InternalDocumentType)
                }
                options={DOC_TYPE_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Status
              </label>
              <Select
                value={editStatus}
                onValueChange={setEditStatus}
                options={RESOLUTION_STATUS_OPTIONS}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Google Docs URL (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setDriveGuideOpen(true)}
                  className="text-[10px] text-primary hover:underline"
                >
                  Storage SOP &rarr;
                </button>
              </div>
              <Input
                type="url"
                value={editDriveUrl}
                onChange={(e) => setEditDriveUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Make sure General Access is set to{" "}
                <strong>"Anyone with the link"</strong> on Drive for live
                preview.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Title
            </label>
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Clauses / Executive Summary
            </label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-1.5 rounded-md text-xs border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingResolution(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Update Document
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingResolution}
        title="Delete Internal Document"
        description={`Are you sure you want to delete "${deletingResolution?.title}" (${deletingResolution?.resolutionNo})? This action cannot be undone.`}
        confirmText="Delete Document"
        variant="danger"
        isLoading={deleteResolutionMutation.isPending}
        onConfirm={handleDeleteResolution}
        onClose={() => setDeletingResolution(null)}
      />

      {/* Portal Document Preview */}
      {previewResolution && (
        <DocumentPreviewModal
          open={!!previewResolution}
          onClose={() => setPreviewResolution(null)}
          title={`${DOCUMENT_TYPE_LABELS[previewResolution.documentType] || "Document"} ${previewResolution.resolutionNo}: ${previewResolution.title}`}
          subtitle={`STATUS: ${previewResolution.status} • Formal Council Record`}
          url={previewResolution.driveDocUrl || ""}
        />
      )}

      <DriveGuideModal
        open={driveGuideOpen}
        onOpenChange={setDriveGuideOpen}
      />
    </>
  );
};
