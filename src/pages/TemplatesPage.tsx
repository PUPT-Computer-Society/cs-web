import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Filter,
  Folder,
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
import { DriveDropzone } from "@/components/ui/DriveDropzone";
import { Select } from "@/components/ui/Select";
import { WING_DEFINITIONS } from "@/lib/driveRegistry";
import type { DocumentTemplate } from "@/types";

const DOCS_URL_REGEX = new RegExp(
  "(https:\\/\\/(?:docs|drive)\\.google\\.com\\/" +
    "(?:document|spreadsheets|presentation)\\/d\\/[a-zA-Z0-9_-]+)",
);

const getMakeCopyUrl = (url: string): string => {
  if (!url) return url;
  const match = url.match(DOCS_URL_REGEX);
  if (match) {
    return `${match[1]}/copy`;
  }
  return url;
};

export const TemplatesPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { user, isPresident, hasPermission } = useAuth();
  const canManage = hasPermission("manage_materials") || isPresident;

  const [activeWing, setActiveWing] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // TanStack Query
  const { data: templates = [], isLoading } = useQuery<DocumentTemplate[]>({
    queryKey: queryKeys.templates(activeWing, searchQuery),
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeWing !== "all") params.append("wing", activeWing);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      const qs = params.toString();
      const path = qs ? `/templates?${qs}` : "/templates";
      return api.get<DocumentTemplate[]>(path);
    },
  });

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<DocumentTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<DocumentTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] =
    useState<DocumentTemplate | null>(null);

  // Create Form State
  const [title, setTitle] = useState("");
  const [wingNumber, setWingNumber] = useState("01");
  const [folderName, setFolderName] = useState("00_Document_Templates");
  const [category, setCategory] = useState("Records");
  const [responsibleRoles, setResponsibleRoles] = useState(
    "All Council Officers",
  );
  const [namingConvention, setNamingConvention] = useState("");
  const [acceptedFormats, setAcceptedFormats] = useState(
    "Google Docs, PDF",
  );
  const [instructions, setInstructions] = useState("");
  const [templateUrl, setTemplateUrl] = useState("");
  const [fileType, setFileType] = useState("Google Docs");
  const [fileId, setFileId] = useState<string | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editWingNumber, setEditWingNumber] = useState("01");
  const [editFolderName, setEditFolderName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editResponsibleRoles, setEditResponsibleRoles] = useState("");
  const [editNamingConvention, setEditNamingConvention] = useState("");
  const [editAcceptedFormats, setEditAcceptedFormats] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editTemplateUrl, setEditTemplateUrl] = useState("");
  const [editFileType, setEditFileType] = useState("");
  const [editFileId, setEditFileId] = useState<string | null>(null);

  const resetCreateForm = () => {
    setTitle("");
    setWingNumber("01");
    setFolderName("00_Document_Templates");
    setCategory("Records");
    setResponsibleRoles("All Council Officers");
    setNamingConvention("");
    setAcceptedFormats("Google Docs, PDF");
    setInstructions("");
    setTemplateUrl("");
    setFileType("Google Docs");
    setFileId(null);
  };

  const openEditModal = (tpl: DocumentTemplate) => {
    setEditingTemplate(tpl);
    setEditTitle(tpl.title);
    setEditWingNumber(tpl.wingNumber);
    setEditFolderName(tpl.folderName);
    setEditCategory(tpl.category);
    setEditResponsibleRoles(tpl.responsibleRoles);
    setEditNamingConvention(tpl.namingConvention);
    setEditAcceptedFormats(tpl.acceptedFormats);
    setEditInstructions(tpl.instructions || "");
    setEditTemplateUrl(tpl.templateUrl);
    setEditFileType(tpl.fileType);
    setEditFileId(tpl.fileId || null);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<DocumentTemplate>("/templates", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setCreateOpen(false);
      resetCreateForm();
      toastSuccess("Template registered successfully in Council Directory.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to register template");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put<DocumentTemplate>(`/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setEditingTemplate(null);
      toastSuccess("Template updated successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setDeletingTemplate(null);
      toastSuccess("Template removed from Council Directory.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete template");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !templateUrl.trim() || !namingConvention.trim()) {
      toastError("Title, Template URL, and Naming Convention are required.");
      return;
    }
    const wingDef = WING_DEFINITIONS.find((w) => w.wingNumber === wingNumber);
    const wingName = wingDef ? wingDef.name : `WING_${wingNumber}`;

    createMutation.mutate({
      title: title.trim(),
      wingNumber,
      wingName,
      folderName: folderName.trim() || "00_Document_Templates",
      category: category.trim() || "General",
      responsibleRoles: responsibleRoles.trim(),
      namingConvention: namingConvention.trim(),
      acceptedFormats: acceptedFormats.trim(),
      instructions: instructions.trim() || null,
      templateUrl: templateUrl.trim(),
      fileType: fileType.trim() || "Google Docs",
      fileId: fileId || null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    if (
      !editTitle.trim() ||
      !editTemplateUrl.trim() ||
      !editNamingConvention.trim()
    ) {
      toastError("Title, Template URL, and Naming Convention are required.");
      return;
    }
    const wingDef = WING_DEFINITIONS.find(
      (w) => w.wingNumber === editWingNumber,
    );
    const wingName = wingDef ? wingDef.name : `WING_${editWingNumber}`;

    updateMutation.mutate({
      id: editingTemplate.id,
      data: {
        title: editTitle.trim(),
        wingNumber: editWingNumber,
        wingName,
        folderName: editFolderName.trim() || "00_Document_Templates",
        category: editCategory.trim() || "General",
        responsibleRoles: editResponsibleRoles.trim(),
        namingConvention: editNamingConvention.trim(),
        acceptedFormats: editAcceptedFormats.trim(),
        instructions: editInstructions.trim() || null,
        templateUrl: editTemplateUrl.trim(),
        fileType: editFileType.trim() || "Google Docs",
        fileId: editFileId || null,
      },
    });
  };

  const handleCopyNamingRule = (tpl: DocumentTemplate) => {
    navigator.clipboard.writeText(tpl.namingConvention);
    setCopiedId(tpl.id);
    toastSuccess(`Copied naming rule: ${tpl.namingConvention}`);
    setTimeout(() => {
      setCopiedId((current) => (current === tpl.id ? null : current));
    }, 2000);
  };

  const filteredCount = templates.length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header
        title="Document Templates & SOPs"
        subtitle="Official council standard operating document templates"
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner Section */}
        <div
          className={
            "relative overflow-hidden rounded-2xl border border-border/80 " +
            "bg-linear-to-r from-primary/10 via-primary/5 to-secondary/30 " +
            "p-5 sm:p-6"
          }
        >
          <div
            className={
              "flex flex-col md:flex-row md:items-center " +
              "justify-between gap-4"
            }
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background/80 font-mono">
                  9-Wing Drive Architecture
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Official PUPT CS Standards
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Executive Document Templates & SOP Hub
              </h2>
              <p
                className={
                  "text-xs sm:text-sm text-muted-foreground leading-relaxed"
                }
              >
                Clone approved templates directly to Google Drive and follow
                council naming conventions to maintain compliant archives.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-2xl font-black text-primary">
                  {templates.length}
                </p>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Active Templates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="space-y-3">
          <div
            className={
              "flex flex-col sm:flex-row gap-3 items-center " +
              "justify-between"
            }
          >
            <div className="relative w-full sm:w-80">
              <Search
                className={
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 " +
                  "text-muted-foreground"
                }
              />
              <Input
                placeholder="Search templates or naming rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div
              className={
                "flex items-center gap-3 w-full sm:w-auto " +
                "justify-between sm:justify-end"
              }
            >
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {filteredCount}
                </span>{" "}
                templates
              </p>
              {canManage && (
                <Button
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-1.5 shadow-xs text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Template</span>
                </Button>
              )}
            </div>
          </div>

          {/* Wing Filter Pills */}
          <div
            className={
              "flex items-center gap-1.5 overflow-x-auto pb-1 " +
              "scrollbar-none"
            }
          >
            {WING_DEFINITIONS.map((wing) => {
              const active = activeWing === wing.wingNumber;
              return (
                <button
                  key={wing.wingNumber}
                  type="button"
                  onClick={() => setActiveWing(wing.wingNumber)}
                  className={
                    "whitespace-nowrap px-3 py-1.5 rounded-xl " +
                    "text-xs font-semibold transition-all shrink-0 " +
                    "cursor-pointer " +
                    (active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary/60 text-muted-foreground " +
                        "hover:text-foreground hover:bg-secondary")
                  }
                >
                  {wing.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div
            className={
              "p-12 text-center rounded-2xl border border-dashed " +
              "border-border/80 bg-secondary/10 space-y-3"
            }
          >
            <FileCode className="w-10 h-10 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              No document templates found
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {searchQuery || activeWing !== "all"
                ? "Try adjusting your wing filter or search keywords."
                : "No council templates registered yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => {
              const makeCopyUrl = getMakeCopyUrl(tpl.templateUrl);
              const isCopied = copiedId === tpl.id;

              return (
                <Card
                  key={tpl.id}
                  className={
                    "flex flex-col justify-between border-border/80 " +
                    "hover:border-primary/40 transition-all duration-150 " +
                    "shadow-2xs group"
                  }
                >
                  <CardContent
                    className={
                      "p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col " +
                      "justify-between"
                    }
                  >
                    {/* Top Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] uppercase font-bold"
                        >
                          Wing {tpl.wingNumber} • {tpl.category}
                        </Badge>
                        <span
                          className={
                            "text-[10px] text-muted-foreground " +
                            "font-semibold truncate"
                          }
                        >
                          {tpl.fileType}
                        </span>
                      </div>

                      <h3
                        className={
                          "text-sm font-bold text-foreground " +
                          "group-hover:text-primary transition-colors " +
                          "leading-snug"
                        }
                      >
                        {tpl.title}
                      </h3>

                      <div
                        className={
                          "text-[11px] text-muted-foreground flex " +
                          "items-center gap-1.5 truncate"
                        }
                      >
                        <Folder
                          className="w-3.5 h-3.5 shrink-0 text-amber-500"
                        />
                        <span className="truncate">{tpl.folderName}</span>
                      </div>

                      {/* Responsible Roles */}
                      <div className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Roles:
                        </span>{" "}
                        {tpl.responsibleRoles}
                      </div>

                      {/* Naming Rule Box */}
                      <div
                        className={
                          "p-2.5 rounded-xl bg-secondary/40 " +
                          "border border-border/60 space-y-1.5"
                        }
                      >
                        <div
                          className={
                            "flex items-center justify-between text-[10px] " +
                            "font-bold uppercase tracking-wider " +
                            "text-muted-foreground"
                          }
                        >
                          <span>Required Naming Format</span>
                          <button
                            type="button"
                            onClick={() => handleCopyNamingRule(tpl)}
                            className={
                              "inline-flex items-center gap-1 text-primary " +
                              "hover:underline cursor-pointer"
                            }
                            title="Copy naming pattern to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p
                          className={
                            "font-mono text-[11px] text-foreground " +
                            "font-semibold break-all selection:bg-primary/20"
                          }
                        >
                          {tpl.namingConvention}
                        </p>
                      </div>

                      {/* Instructions */}
                      {tpl.instructions && (
                        <p
                          className={
                            "text-[11px] text-muted-foreground " +
                            "line-clamp-2 italic"
                          }
                        >
                          "{tpl.instructions}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div
                      className={
                        "pt-2 border-t border-border/60 flex " +
                        "items-center justify-between gap-2"
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        <a
                          href={makeCopyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            "inline-flex items-center gap-1 px-3 py-1.5 " +
                            "rounded-xl bg-primary text-primary-foreground " +
                            "text-xs font-semibold hover:bg-primary/90 " +
                            "shadow-xs transition-colors"
                          }
                          title="Generate a blank editable copy in your Drive"
                        >
                          <span>Make a Copy</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(tpl)}
                          className={
                            "inline-flex items-center gap-1 px-2.5 py-1.5 " +
                            "rounded-xl bg-secondary hover:bg-secondary/80 " +
                            "text-xs font-semibold text-foreground " +
                            "transition-colors"
                          }
                          title="Preview template inside portal"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>
                      </div>

                      {/* Manage Actions */}
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(tpl)}
                            className={
                              "p-1.5 rounded-lg text-muted-foreground " +
                              "hover:text-foreground hover:bg-secondary " +
                              "transition-colors"
                            }
                            title="Edit template details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTemplate(tpl)}
                            className={
                              "p-1.5 rounded-lg text-muted-foreground " +
                              "hover:text-destructive " +
                              "hover:bg-destructive/10 transition-colors"
                            }
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Register Template Modal */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Register Document Template"
        description={
          "Add an official SOP document template to Council Directory."
        }
        className="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Template Title *
            </label>
            <Input
              required
              placeholder="e.g. Official Resolution Template 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Council Wing *
              </label>
              <Select
                value={wingNumber}
                onValueChange={(val) => setWingNumber(val)}
                options={WING_DEFINITIONS.filter(
                  (w) => w.wingNumber !== "all",
                ).map((w) => ({
                  value: w.wingNumber,
                  label: `${w.wingNumber} - ${w.shortLabel}`,
                }))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Category *
              </label>
              <Input
                required
                placeholder="e.g. Governance, Records, Finance"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Target Folder Name *
              </label>
              <Input
                required
                placeholder="00_Document_Templates"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Responsible Roles *
              </label>
              <Input
                required
                placeholder="e.g. All Council Officers"
                value={responsibleRoles}
                onChange={(e) => setResponsibleRoles(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Required Naming Rule *
            </label>
            <Input
              required
              placeholder="e.g. RES-2026-XXX_[Short_Title].pdf"
              value={namingConvention}
              onChange={(e) => setNamingConvention(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <DriveDropzone
              label="Master Template Source (Drive File or URL) *"
              moduleType="template"
              title={title || "Document Template"}
              value={templateUrl}
              onUploaded={(url, fid, fn) => {
                setTemplateUrl(url);
                if (fid) setFileId(fid);
                if (fn) setTitle((curr) => curr || fn);
              }}
              onCleared={() => {
                setTemplateUrl("");
                setFileId(null);
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Officer Instructions / SOP Notes
            </label>
            <Input
              placeholder="Click 'Make a Copy' and fill out placeholders."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="text-xs"
            />
          </div>

          <div
            className={
              "flex items-center justify-end gap-2 pt-3 " +
              "border-t border-border/60"
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Registering..." : "Save Template"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog
        open={Boolean(editingTemplate)}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        title="Edit Document Template"
        description="Update template metadata or naming rule."
        className="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Template Title *
            </label>
            <Input
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Council Wing *
              </label>
              <Select
                value={editWingNumber}
                onValueChange={(val) => setEditWingNumber(val)}
                options={WING_DEFINITIONS.filter(
                  (w) => w.wingNumber !== "all",
                ).map((w) => ({
                  value: w.wingNumber,
                  label: `${w.wingNumber} - ${w.shortLabel}`,
                }))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Category *
              </label>
              <Input
                required
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Target Folder Name *
              </label>
              <Input
                required
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Responsible Roles *
              </label>
              <Input
                required
                value={editResponsibleRoles}
                onChange={(e) => setEditResponsibleRoles(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Required Naming Rule *
            </label>
            <Input
              required
              value={editNamingConvention}
              onChange={(e) => setEditNamingConvention(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <DriveDropzone
              label="Template URL / Drive Master File *"
              moduleType="template"
              title={editTitle || "Document Template"}
              value={editTemplateUrl}
              onUploaded={(url, fid) => {
                setEditTemplateUrl(url);
                if (fid) setEditFileId(fid);
              }}
              onCleared={() => {
                setEditTemplateUrl("");
                setEditFileId(null);
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Officer Instructions
            </label>
            <Input
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              className="text-xs"
            />
          </div>

          <div
            className={
              "flex items-center justify-end gap-2 pt-3 " +
              "border-t border-border/60"
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingTemplate(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingTemplate)}
        title="Delete Document Template"
        description={
          `Are you sure you want to remove "${deletingTemplate?.title}" ` +
          "from the Council Directory? This action cannot be undone."
        }
        confirmText="Delete Template"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingTemplate) deleteMutation.mutate(deletingTemplate.id);
        }}
        onClose={() => setDeletingTemplate(null)}
      />

      {/* Document In-Portal Preview */}
      {previewTemplate && (
        <DocumentPreviewModal
          open={Boolean(previewTemplate)}
          title={previewTemplate.title}
          url={previewTemplate.templateUrl}
          fileMeta={{
            fileName: previewTemplate.title,
            fileType: previewTemplate.fileType,
            category: previewTemplate.category,
            customFields: [
              { label: "Wing", value: previewTemplate.wingNumber },
              {
                label: "Naming Rule",
                value: previewTemplate.namingConvention,
              },
            ],
          }}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
};
export default TemplatesPage;
