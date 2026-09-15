import React, { useState } from "react";
import {
  ExternalLink,
  Eye,
  FileText,
  Folder,
  LayoutGrid,
  List,
  Pencil,
  Plus,
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
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { DriveLinkInput } from "@/components/ui/DriveLinkInput";
import { getGooglePreviewUrl } from "@/lib/preview";
import type { Material, MaterialCategory } from "@/types";

const PAGE_SIZE = 8;
const MATERIAL_CATEGORY_OPTIONS = [
  { value: "academic", label: "Academic Material" },
  { value: "creative", label: "Creative Material" },
  { value: "sports", label: "Sports Material" },
];

const MATERIAL_CATEGORY_TO_REGISTRY_KEY: Record<MaterialCategory, string> = {
  academic: "courseReviewers",
  creative: "pubmatsSourceFiles",
  sports: "sportsTournaments",
};

export const MaterialsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { user, isPresident, hasPermission } = useAuth();
  const canManage = hasPermission("manage_materials");

  const [activeTab, setActiveTab] = useState<"all" | MaterialCategory>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack Query
  const endpoint =
    activeTab === "all" ? "/materials" : `/materials?category=${activeTab}`;
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: queryKeys.materials(activeTab),
    queryFn: () => api.get<Material[]>(endpoint),
  });

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(
    null,
  );

  // Create Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaterialCategory | "">("");
  const [driveUrl, setDriveUrl] = useState("");
  const [fileType, setFileType] = useState("");

  // Edit Form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] =
    useState<MaterialCategory>("academic");
  const [editDriveUrl, setEditDriveUrl] = useState("");
  const [editFileType, setEditFileType] = useState("Google Drive Document");

  const canEdit = (mat: Material) =>
    Boolean(user && (user.id === mat.uploadedById || canManage || isPresident));

  // Mutations
  const createMaterialMutation = useMutation({
    mutationFn: (newMat: Record<string, unknown>) =>
      api.post("/materials", newMat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setDriveUrl("");
      setCategory("");
      setFileType("");
      toastSuccess("Material uploaded successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to add material");
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/materials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setEditingMaterial(null);
      toastSuccess("Material updated successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update material");
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setDeletingMaterial(null);
      toastSuccess("Material deleted successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete material");
    },
  });

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    createMaterialMutation.mutate({
      title,
      description,
      category: category || "academic",
      driveUrl,
      fileType: fileType || "Google Drive Document",
    });
  };

  const openEditDialog = (mat: Material) => {
    setEditingMaterial(mat);
    setEditTitle(mat.title);
    setEditDescription(mat.description || "");
    setEditCategory(mat.category);
    setEditDriveUrl(mat.driveUrl);
    setEditFileType(mat.fileType || "Google Drive Document");
  };

  const handleUpdateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    updateMaterialMutation.mutate({
      id: editingMaterial.id,
      data: {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        driveUrl: editDriveUrl,
        fileType: editFileType,
      },
    });
  };

  const handleDeleteMaterial = () => {
    if (!deletingMaterial) return;
    deleteMaterialMutation.mutate(deletingMaterial.id);
  };

  const handleTabChange = (tab: "all" | MaterialCategory) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const isFolder = (mat: Material) =>
    mat.driveUrl.includes("/folders/") ||
    mat.fileType.toLowerCase().includes("folder");

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedMaterials = materials.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <>
      <Header
        title="Materials Vault"
        subtitle="Consolidated repositories for Academic, Creative, and Sports assets"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Monochromatic Tab Switcher & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/40">
              {(
                [
                  { id: "all", label: "All Vaults" },
                  { id: "academic", label: "Academic" },
                  { id: "creative", label: "Creatives" },
                  { id: "sports", label: "Sports" },
                ] as const
              ).map((tab) => (
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
                title="Compact List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {(canManage || isPresident) && (
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="text-[11px] font-semibold shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Resource Link
            </Button>
          )}
        </div>

        {/* Materials Grid / List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card">
            <p className="text-xs text-muted-foreground">
              No materials cataloged under this category.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Google Drive Tiled Cards with Live Preview */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedMaterials.map((mat) => {
              const isOwner = user?.id === mat.uploadedById;
              const userCanEdit = canEdit(mat);
              const previewUrl = getGooglePreviewUrl(mat.driveUrl);
              const isFolderResource = isFolder(mat);

              return (
                <Card
                  key={mat.id}
                  className="group flex flex-col justify-between overflow-hidden border border-border/80 hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card"
                >
                  {/* Google Drive Preview Thumbnail Area */}
                  <div className="relative w-full h-44 bg-secondary/30 border-b border-border overflow-hidden select-none">
                    {previewUrl ? (
                      <>
                        <iframe
                          src={previewUrl}
                          className="w-full h-full border-0 pointer-events-none select-none scale-[1.02] transform-gpu origin-top-left"
                          title={mat.title}
                          loading="lazy"
                        />
                        {/* Interactive Click-to-Expand Overlay */}
                        <div
                          onClick={() => setPreviewMaterial(mat)}
                          className="absolute inset-0 bg-background/0 hover:bg-background/40 transition-all flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 backdrop-blur-2xs"
                        >
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background/95 border border-border shadow-xs text-xs font-semibold text-foreground hover:text-primary transition-colors">
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            Expand Preview
                          </span>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => setPreviewMaterial(mat)}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer bg-secondary/15 hover:bg-secondary/25 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          {isFolderResource ? (
                            <Folder className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                          {mat.fileType || "Resource File"}
                        </span>
                        <span className="text-[10px] text-primary/80 font-semibold">
                          Click to inspect
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata and Actions */}
                  <CardContent className="p-4 flex flex-col justify-between flex-1 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-semibold"
                          >
                            {mat.category}
                          </Badge>
                          {isOwner && (
                            <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              Uploader
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium line-clamp-1 max-w-[110px]">
                          {mat.fileType}
                        </span>
                      </div>

                      <h4
                        className="text-xs font-bold text-foreground line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => setPreviewMaterial(mat)}
                        title={mat.title}
                      >
                        {mat.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {mat.description || "No description provided."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(mat.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1">
                        {userCanEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditDialog(mat)}
                              className="p-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-xs transition-colors"
                              title="Edit Material"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingMaterial(mat)}
                              className="p-1 rounded-md border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs transition-colors"
                              title="Delete Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => setPreviewMaterial(mat)}
                          className="p-1 rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors"
                          title="Preview Material"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={mat.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Open Original in Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Compact List View */
          <div className="space-y-3">
            {paginatedMaterials.map((mat) => {
              const isOwner = user?.id === mat.uploadedById;
              const userCanEdit = canEdit(mat);
              const isFolderResource = isFolder(mat);

              return (
                <Card
                  key={mat.id}
                  className="hover:border-primary/30 transition-all"
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                        {isFolderResource ? (
                          <Folder className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {mat.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-semibold"
                          >
                            {mat.category}
                          </Badge>
                          {isOwner && (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              Uploader
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {mat.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[10px] text-muted-foreground mr-2">
                        {new Date(mat.createdAt).toLocaleDateString()}
                      </span>

                      {userCanEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditDialog(mat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-[11px] font-semibold transition-colors"
                            title="Edit Material"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMaterial(mat)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[11px] font-semibold transition-colors"
                            title="Delete Material"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setPreviewMaterial(mat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={mat.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <span>Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {materials.length > 0 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalItems={materials.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Add Material Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Register Material Reference"
        description="Links Google Drive folders, PDFs, or design asset repositories."
      >
        <form onSubmit={handleAddMaterial} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Resource Title
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. CS102 Reviewer / Intramurals Rulebook"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as MaterialCategory)}
                options={MATERIAL_CATEGORY_OPTIONS}
                placeholder="Select Category..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Asset Type
              </label>
              <Input
                type="text"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                placeholder="e.g. Figma / PDF / Drive Folder"
              />
            </div>
          </div>

          <DriveLinkInput
            registryKey={
              (category && MATERIAL_CATEGORY_TO_REGISTRY_KEY[category]) ||
              "courseReviewers"
            }
            value={driveUrl}
            onChange={setDriveUrl}
            label="Google Drive URL"
            placeholder="https://drive.google.com/..."
            required
          />

          <MarkdownTextarea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Syllabus coverage, topics, or usage instructions..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[220px]"
          />

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
              Save Material
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog
        open={!!editingMaterial}
        onOpenChange={(open) => {
          if (!open) setEditingMaterial(null);
        }}
        title="Edit Material Reference"
        description="Update resource details, category, or linked storage repository."
      >
        <form onSubmit={handleUpdateMaterial} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Resource Title
            </label>
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Category
              </label>
              <Select
                value={editCategory}
                onValueChange={(val) =>
                  setEditCategory(val as MaterialCategory)
                }
                options={MATERIAL_CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Asset Type
              </label>
              <Input
                type="text"
                value={editFileType}
                onChange={(e) => setEditFileType(e.target.value)}
              />
            </div>
          </div>

          <DriveLinkInput
            registryKey={
              (editCategory &&
                MATERIAL_CATEGORY_TO_REGISTRY_KEY[editCategory]) ||
              "courseReviewers"
            }
            value={editDriveUrl}
            onChange={setEditDriveUrl}
            label="Google Drive URL"
            placeholder="https://drive.google.com/..."
            required
          />

          <MarkdownTextarea
            label="Description"
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Syllabus coverage, topics, or usage instructions..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[220px]"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingMaterial(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Update Material
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingMaterial}
        title="Delete Material Reference"
        description={`Are you sure you want to delete "${deletingMaterial?.title}"? This action cannot be undone.`}
        confirmText="Delete Material"
        variant="danger"
        isLoading={deleteMaterialMutation.isPending}
        onConfirm={handleDeleteMaterial}
        onClose={() => setDeletingMaterial(null)}
      />

      {/* Portal Document Preview with Left Information Sidebar */}
      <DocumentPreviewModal
        open={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || ""}
        subtitle={
          previewMaterial
            ? `${previewMaterial.category.toUpperCase()} • ${previewMaterial.fileType}`
            : undefined
        }
        url={previewMaterial?.driveUrl || ""}
        fileMeta={
          previewMaterial
            ? {
                title: previewMaterial.title,
                fileName: previewMaterial.title,
                fileType: previewMaterial.fileType,
                category: previewMaterial.category.toUpperCase(),
                status: "Active Repository File",
                dateUploaded: new Date(
                  previewMaterial.createdAt,
                ).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
                description: previewMaterial.description,
              }
            : undefined
        }
      />
    </>
  );
};
