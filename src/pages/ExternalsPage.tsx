import React, { useMemo, useState } from "react";
import {
  Award,
  Building,
  Calendar,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Handshake,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { DriveDropzone } from "@/components/ui/DriveDropzone";
import { cn } from "@/lib/utils";
import type { ExternalDocType, ExternalDocument, GPOAEvent } from "@/types";

const PAGE_SIZE = 8;

const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Document Types" },
  { value: "moa_mou", label: "Memorandum of Agreement / Understanding" },
  { value: "certificate", label: "Certificates of Partnership" },
  { value: "logo_branding", label: "Partner Logos & Brand Assets" },
  { value: "sponsorship_deck", label: "Sponsorship Decks & Proposals" },
  { value: "other", label: "Other Formal Documents" },
];

const MODAL_DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "moa_mou", label: "MOA / MOU (Legal Agreement)" },
  { value: "certificate", label: "Certificate of Partnership" },
  { value: "logo_branding", label: "Partner Logo / Vector Asset" },
  { value: "sponsorship_deck", label: "Sponsorship Deck / Package" },
  { value: "other", label: "Other Formal Agreement" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active / In Effect" },
  { value: "pending_signing", label: "Pending Signing / Execution" },
  { value: "expired", label: "Expired / Concluded" },
];

const MODAL_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active", label: "Active / In Effect" },
  { value: "pending_signing", label: "Pending Signing / Execution" },
  { value: "expired", label: "Expired / Concluded" },
];

const getDocTypeIcon = (type: string) => {
  switch (type) {
    case "moa_mou":
      return Handshake;
    case "certificate":
      return Award;
    case "logo_branding":
      return ImageIcon;
    case "sponsorship_deck":
      return FileCheck2;
    default:
      return FileText;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="success"
          className="text-[10px] uppercase font-semibold"
        >
          Active
        </Badge>
      );
    case "pending_signing":
      return (
        <Badge
          variant="warning"
          className="text-[10px] uppercase font-semibold"
        >
          Pending Signing
        </Badge>
      );
    case "expired":
      return (
        <Badge
          variant="secondary"
          className="text-[10px] uppercase font-semibold"
        >
          Expired
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="text-[10px] uppercase font-semibold"
        >
          {status}
        </Badge>
      );
  }
};

export const ExternalsPage: React.FC = () => {
  const { user, isPresident, hasPermission } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const canManage =
    hasPermission("manage_materials") ||
    hasPermission("resolve_affairs") ||
    isPresident;

  // Filter states
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExternalDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<ExternalDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ExternalDocument | null>(null);

  // Form states - Create
  const [title, setTitle] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [docType, setDocType] = useState<ExternalDocType>("moa_mou");
  const [driveUrl, setDriveUrl] = useState("");
  const [fileId, setFileId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [docStatus, setDocStatus] = useState<string>("active");
  const [gpoaEventId, setGpoaEventId] = useState<string>("");

  // Form states - Edit
  const [editTitle, setEditTitle] = useState("");
  const [editPartnerName, setEditPartnerName] = useState("");
  const [editDocType, setEditDocType] = useState<string>("moa_mou");
  const [editDriveUrl, setEditDriveUrl] = useState("");
  const [editFileId, setEditFileId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editValidUntil, setEditValidUntil] = useState<string>("");
  const [editDocStatus, setEditDocStatus] = useState<string>("active");
  const [editGpoaEventId, setEditGpoaEventId] = useState<string>("");

  // Query external documents
  const { data: documents = [], isLoading } = useQuery<ExternalDocument[]>({
    queryKey: queryKeys.externals(docTypeFilter, statusFilter),
    queryFn: () => {
      const params = new URLSearchParams();
      if (docTypeFilter !== "all") params.append("doc_type", docTypeFilter);
      if (statusFilter !== "all") params.append("doc_status", statusFilter);
      const query = params.toString() ? `?${params.toString()}` : "";
      return api.get<ExternalDocument[]>(`/externals${query}`);
    },
  });

  // Query GPOA events for linkage
  const { data: gpoaEvents = [] } = useQuery<GPOAEvent[]>({
    queryKey: queryKeys.gpoa,
    queryFn: () => api.get<GPOAEvent[]>("/gpoa"),
  });

  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ev of gpoaEvents) {
      map.set(ev.id, ev.title);
    }
    return map;
  }, [gpoaEvents]);

  const gpoaSelectOptions = useMemo(
    () => [
      { value: "", label: "No Event Linked (Organization-Wide Asset)" },
      ...gpoaEvents.map((ev) => ({
        value: ev.id,
        label: ev.title,
      })),
    ],
    [gpoaEvents],
  );

  // Filtered documents by search
  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.partnerName.toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q),
    );
  }, [documents, searchQuery]);

  const totalPages = Math.ceil(filteredDocuments.length / PAGE_SIZE) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDocuments.slice(start, start + PAGE_SIZE);
  }, [filteredDocuments, currentPage]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post("/externals", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["externals"] });
      setCreateOpen(false);
      resetCreateForm();
      toastSuccess("External document registered successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to register document");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/externals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["externals"] });
      setEditingDoc(null);
      toastSuccess("External document updated successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update document");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/externals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["externals"] });
      setDeletingDoc(null);
      toastSuccess("External document deleted.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete document");
    },
  });

  const resetCreateForm = () => {
    setTitle("");
    setPartnerName("");
    setDocType("moa_mou");
    setDriveUrl("");
    setFileId(null);
    setDescription("");
    setValidUntil("");
    setDocStatus("active");
    setGpoaEventId("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !partnerName.trim() || !driveUrl.trim()) {
      toastError("Title, partner name, and drive document are required.");
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      partnerName: partnerName.trim(),
      docType,
      driveUrl: driveUrl.trim(),
      fileId,
      description: description.trim(),
      validUntil: validUntil || null,
      status: docStatus,
      gpoaEventId: gpoaEventId || null,
    });
  };

  const handleOpenEdit = (doc: ExternalDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditPartnerName(doc.partnerName);
    setEditDocType(doc.docType);
    setEditDriveUrl(doc.driveUrl);
    setEditFileId(doc.fileId || null);
    setEditDescription(doc.description || "");
    setEditValidUntil(doc.validUntil ? doc.validUntil.slice(0, 10) : "");
    setEditDocStatus(doc.status);
    setEditGpoaEventId(doc.gpoaEventId || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    updateMutation.mutate({
      id: editingDoc.id,
      data: {
        title: editTitle.trim(),
        partnerName: editPartnerName.trim(),
        docType: editDocType,
        driveUrl: editDriveUrl.trim(),
        fileId: editFileId,
        description: editDescription.trim(),
        validUntil: editValidUntil || null,
        status: editDocStatus,
        gpoaEventId: editGpoaEventId || null,
      },
    });
  };

  const activeCount = useMemo(
    () => documents.filter((d) => d.status === "active").length,
    [documents],
  );
  const moaCount = useMemo(
    () => documents.filter((d) => d.docType === "moa_mou").length,
    [documents],
  );
  const certCount = useMemo(
    () => documents.filter((d) => d.docType === "certificate").length,
    [documents],
  );

  return (
    <div className="space-y-6">
      <Header
        title="External Affairs Vault"
        subtitle={
          "Formal legal contracts, institutional partnerships, " +
          "Memorandum of Agreement (MOA/MOU), and verified partner logos."
        }
      >
        {canManage && (
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 min-h-[44px] sm:min-h-9"
          >
            <Plus className="w-4 h-4" />
            <span>Register Document</span>
          </Button>
        )}
      </Header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p
                className={
                  "text-xs text-muted-foreground uppercase " + "font-semibold"
                }
              >
                Active Institutional Assets
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {activeCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Handshake className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p
                className={
                  "text-xs text-muted-foreground uppercase " + "font-semibold"
                }
              >
                MOA / MOU Agreements
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {moaCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p
                className={
                  "text-xs text-muted-foreground uppercase " + "font-semibold"
                }
              >
                Certificates Issued
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {certCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div
        className={
          "flex flex-col sm:flex-row items-stretch sm:items-center " +
          "gap-3 justify-between"
        }
      >
        <div className="relative flex-1 max-w-sm">
          <Search
            className={
              "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 " +
              "text-muted-foreground"
            }
          />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, partner name, or keyword..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={docTypeFilter}
            onValueChange={(val) => {
              setDocTypeFilter(val);
              setCurrentPage(1);
            }}
            options={DOC_TYPE_OPTIONS}
            className="w-48 text-xs"
            triggerClassName="h-9"
          />
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
            className="w-40 text-xs"
            triggerClassName="h-9"
          />
        </div>
      </div>

      {/* Document Records List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Handshake className="w-10 h-10 mx-auto mb-2.5 opacity-40" />
            <p className="text-sm font-semibold text-foreground">
              No external affairs documents found
            </p>
            <p className="text-xs mt-1">
              Registered agreements, partner logos, and certificates will appear
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedDocs.map((doc) => {
            const Icon = getDocTypeIcon(doc.docType);
            const eventTitle = doc.gpoaEventId
              ? eventMap.get(doc.gpoaEventId)
              : null;

            return (
              <Card
                key={doc.id}
                className={
                  "border border-border/80 hover:border-primary/40 " +
                  "transition-colors flex flex-col justify-between"
                }
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={
                          "p-2 rounded-lg bg-primary/10 text-primary " +
                          "shrink-0 mt-0.5"
                        }
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className={
                            "inline-flex items-center gap-1 text-[11px] " +
                            "font-bold uppercase tracking-wide text-primary"
                          }
                        >
                          <Building className="w-3 h-3" />
                          {doc.partnerName}
                        </span>
                        <h3
                          className={
                            "font-semibold text-sm text-foreground " +
                            "line-clamp-1"
                          }
                        >
                          {doc.title}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  {doc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div
                    className={
                      "flex flex-wrap items-center gap-2 pt-1 text-[11px] " +
                      "text-muted-foreground"
                    }
                  >
                    {doc.validUntil && (
                      <span
                        className={
                          "inline-flex items-center gap-1 bg-secondary/60 " +
                          "px-2 py-0.5 rounded border border-border"
                        }
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Valid: {doc.validUntil.slice(0, 10)}</span>
                      </span>
                    )}
                    {eventTitle && (
                      <span
                        className={
                          "inline-flex items-center gap-1 bg-blue-500/10 " +
                          "text-blue-500 px-2 py-0.5 rounded border " +
                          "border-blue-500/20 truncate max-w-[200px]"
                        }
                      >
                        <span>Event: {eventTitle}</span>
                      </span>
                    )}
                  </div>

                  <div
                    className={
                      "flex items-center justify-between pt-2 border-t " +
                      "border-border"
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDoc(doc)}
                        className="h-8 text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </Button>
                      <a
                        href={doc.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 h-8 px-2.5",
                          "rounded-md border border-border text-xs",
                          "bg-background text-muted-foreground",
                          "hover:text-foreground hover:bg-secondary",
                          "transition-colors",
                        )}
                      >
                        <span>Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(doc)}
                          className={
                            "h-8 w-8 p-0 text-muted-foreground " +
                            "hover:text-foreground"
                          }
                          title="Edit Document Record"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingDoc(doc)}
                          className={
                            "h-8 w-8 p-0 text-rose-500 hover:text-rose-600 " +
                            "hover:bg-rose-500/10"
                          }
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredDocuments.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Register External Document Modal */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Register External Affairs Document"
        description={
          "Catalog formal institutional partnerships, MOA/MOU, " +
          "certificates, and logos in Google Drive Wing 03."
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label
              className="block text-[11px] font-semibold text-foreground mb-1"
            >
              Document Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MOA on Technical Sponsorship"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Partner / Organization Name
              </label>
              <Input
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Google Developer Group"
                required
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Document Classification
              </label>
              <Select
                value={docType}
                onValueChange={(val) => setDocType(val as ExternalDocType)}
                options={MODAL_DOC_TYPE_OPTIONS}
                triggerClassName="h-9"
              />
            </div>
          </div>

          <DriveDropzone
            label="Upload Document / Vector Asset"
            moduleType="external"
            title={title}
            category={partnerName}
            docType={docType}
            value={driveUrl}
            fileId={fileId}
            onUploaded={(url, fid) => {
              setDriveUrl(url);
              if (fid) setFileId(fid);
            }}
            onCleared={() => {
              setDriveUrl("");
              setFileId(null);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Lifecycle Status
              </label>
              <Select
                value={docStatus}
                onValueChange={setDocStatus}
                options={MODAL_STATUS_OPTIONS}
                triggerClassName="h-9"
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Expiration / Validity Date (Optional)
              </label>
              <DatePicker
                value={validUntil}
                onChange={setValidUntil}
                placeholder="Select date"
                className="h-9"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold text-foreground mb-1"
            >
              Link to GPOA Event (Optional)
            </label>
            <Select
              value={gpoaEventId}
              onValueChange={setGpoaEventId}
              options={gpoaSelectOptions}
              triggerClassName="h-9"
            />
          </div>

          <MarkdownTextarea
            label="Terms, Scope, or Notes"
            value={description}
            onChange={setDescription}
            placeholder={
              "Key partnership deliverables, signing signatories, or notes..."
            }
            minHeight="min-h-[75px]"
          />

          <div className="flex justify-end gap-2 pt-3">
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

      {/* Edit External Document Modal */}
      <Dialog
        open={Boolean(editingDoc)}
        onOpenChange={(open) => {
          if (!open) setEditingDoc(null);
        }}
        title="Edit External Document Record"
        description={
          "Update partner metadata, validity period, or linked Google " +
          "Drive assets."
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          <div>
            <label
              className="block text-[11px] font-semibold text-foreground mb-1"
            >
              Document Title
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Partner / Organization Name
              </label>
              <Input
                value={editPartnerName}
                onChange={(e) => setEditPartnerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Document Classification
              </label>
              <Select
                value={editDocType}
                onValueChange={setEditDocType}
                options={MODAL_DOC_TYPE_OPTIONS}
                triggerClassName="h-9"
              />
            </div>
          </div>

          <DriveDropzone
            label="Upload Document / Vector Asset"
            moduleType="external"
            title={editTitle}
            category={editPartnerName}
            docType={editDocType}
            value={editDriveUrl}
            fileId={editFileId}
            onUploaded={(url, fid) => {
              setEditDriveUrl(url);
              if (fid) setEditFileId(fid);
            }}
            onCleared={() => {
              setEditDriveUrl("");
              setEditFileId(null);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Lifecycle Status
              </label>
              <Select
                value={editDocStatus}
                onValueChange={setEditDocStatus}
                options={MODAL_STATUS_OPTIONS}
                triggerClassName="h-9"
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Expiration / Validity Date (Optional)
              </label>
              <DatePicker
                value={editValidUntil}
                onChange={setEditValidUntil}
                placeholder="Select date"
                className="h-9"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold text-foreground mb-1"
            >
              Link to GPOA Event (Optional)
            </label>
            <Select
              value={editGpoaEventId}
              onValueChange={setEditGpoaEventId}
              options={gpoaSelectOptions}
              triggerClassName="h-9"
            />
          </div>

          <MarkdownTextarea
            label="Terms, Scope, or Notes"
            value={editDescription}
            onChange={setEditDescription}
            placeholder={
              "Key partnership deliverables, signing signatories, or notes..."
            }
            minHeight="min-h-[75px]"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingDoc(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Update Record
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() => {
          if (deletingDoc) deleteMutation.mutate(deletingDoc.id);
        }}
        title="Delete External Document"
        description={
          `Are you sure you want to delete "${deletingDoc?.title}"? ` +
          "This will remove the vault registry record."
        }
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || ""}
        subtitle={
          previewDoc
            ? `${previewDoc.partnerName.toUpperCase()} • ` +
              `${previewDoc.docType.toUpperCase()}`
            : undefined
        }
        url={previewDoc?.driveUrl || ""}
        fileMeta={
          previewDoc
            ? {
                title: previewDoc.title,
                fileName: previewDoc.title,
                fileType: previewDoc.docType.replace(/_/g, " ").toUpperCase(),
                category: previewDoc.partnerName,
                status: previewDoc.status.toUpperCase(),
                dateUploaded: new Date(previewDoc.createdAt).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  },
                ),
                description: previewDoc.description,
              }
            : undefined
        }
      />
    </div>
  );
};

