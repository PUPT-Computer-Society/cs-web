import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Folder,
  FolderInput,
  FolderOpen,
  GripVertical,
  LayoutGrid,
  List,
  Loader2,
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
import { DriveDropzone } from "@/components/ui/DriveDropzone";
import { getGooglePreviewUrl } from "@/lib/preview";
import { cn } from "@/lib/utils";
import type { Material, MaterialCategory } from "@/types";

const PAGE_SIZE = 8;
const MATERIAL_CATEGORY_OPTIONS = [
  { value: "academic", label: "Academic Material" },
  { value: "creative", label: "Creative Material" },
  { value: "sports", label: "Sports Material" },
  { value: "external_affairs", label: "External Affairs Material" },
];

const MATERIAL_CATEGORY_TO_REGISTRY_KEY: Record<MaterialCategory, string> = {
  academic: "courseReviewers",
  creative: "pubmatsSourceFiles",
  sports: "sportsTournaments",
  external_affairs: "externalPartnerships",
};

const MATERIAL_SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest Uploads" },
  { value: "created_at:asc", label: "Oldest Uploads" },
  { value: "title:asc", label: "Title (A to Z)" },
  { value: "title:desc", label: "Title (Z to A)" },
];

export const MaterialsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { user, isPresident, hasPermission } = useAuth();
  const canManage = hasPermission("manage_materials");

  const [activeTab, setActiveTab] = useState<"all" | MaterialCategory>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<
    "all" | "folders" | "files"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at:desc");

  const [sortField, sortOrder] = sortBy.split(":");

  // TanStack Query with backend-level sorting
  const endpoint =
    activeTab === "all"
      ? `/materials?sort_by=${sortField}&order=${sortOrder}`
      : `/materials?category=${activeTab}&sort_by=${sortField}&order=${sortOrder}`;

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: queryKeys.materials(activeTab, sortField, sortOrder),
    queryFn: () => api.get<Material[]>(endpoint),
  });

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [folderCategory, setFolderCategory] =
    useState<MaterialCategory>("academic");
  const [folderDescription, setFolderDescription] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(
    null,
  );

  // Folder Navigation and Drag-and-Drop States
  const [selectedFolder, setSelectedFolder] = useState<Material | null>(null);
  const [draggingMaterialId, setDraggingMaterialId] = useState<string | null>(
    null,
  );
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isDragOverRootZone, setIsDragOverRootZone] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [materialToMove, setMaterialToMove] = useState<Material | null>(null);
  const [targetFolderSelect, setTargetFolderSelect] = useState<string>("root");

  // Create Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaterialCategory | "">("");
  const [createFolderId, setCreateFolderId] = useState<string>("root");
  const [driveUrl, setDriveUrl] = useState("");
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileType, setFileType] = useState("");

  // Edit Form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] =
    useState<MaterialCategory>("academic");
  const [editFolderId, setEditFolderId] = useState<string>("root");
  const [editDriveUrl, setEditDriveUrl] = useState("");
  const [editFileId, setEditFileId] = useState<string | null>(null);
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
      setFileId(null);
      setCategory("");
      setFileType("");
      setCreateFolderId("root");
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

  const createFolderMutation = useMutation({
    mutationFn: (newFolder: {
      title: string;
      category: MaterialCategory;
      description?: string;
    }) => api.post("/materials/folders", newFolder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setCreateFolderOpen(false);
      setFolderTitle("");
      setFolderDescription("");
      toastSuccess("Folder created successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to create folder");
    },
  });

  const moveMaterialMutation = useMutation({
    mutationFn: ({
      materialId,
      targetFolderId,
    }: {
      materialId: string;
      targetFolderId: string | null;
    }) =>
      api.patch(`/materials/${materialId}/move`, {
        folderId: targetFolderId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      if (variables.targetFolderId) {
        const dest = materials.find((m) => m.id === variables.targetFolderId);
        toastSuccess(`Moved material into "${dest?.title || "folder"}".`);
      } else {
        toastSuccess("Moved material to root vault.");
      }
      setDraggingMaterialId(null);
      setDragOverFolderId(null);
      setIsDragOverRootZone(false);
      setMoveDialogOpen(false);
      setMaterialToMove(null);
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to move material");
      setDraggingMaterialId(null);
      setDragOverFolderId(null);
      setIsDragOverRootZone(false);
    },
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderTitle.trim()) return;
    createFolderMutation.mutate({
      title: folderTitle.trim(),
      category: folderCategory,
      description: folderDescription.trim() || undefined,
    });
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    createMaterialMutation.mutate({
      title,
      description,
      category: category || "academic",
      driveUrl,
      fileId: fileId || null,
      fileType: fileType || "Google Drive Document",
      folderId: createFolderId === "root" ? null : createFolderId,
    });
  };

  const openEditDialog = (mat: Material) => {
    setEditingMaterial(mat);
    setEditTitle(mat.title);
    setEditDescription(mat.description || "");
    setEditCategory(mat.category);
    setEditDriveUrl(mat.driveUrl);
    setEditFileId(mat.fileId || null);
    setEditFileType(mat.fileType || "Google Drive Document");
    setEditFolderId(mat.folderId || "root");
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
        fileId: editFileId || null,
        fileType: editFileType,
        folderId: editFolderId === "root" ? null : editFolderId,
      },
    });
  };

  const handleDeleteMaterial = () => {
    if (!deletingMaterial) return;
    deleteMaterialMutation.mutate(deletingMaterial.id);
  };

  const handleTabChange = (tab: "all" | MaterialCategory) => {
    setActiveTab(tab);
    setSelectedFolder(null);
    setCurrentPage(1);
  };

  const isFolder = (mat: Material) =>
    mat.driveUrl.includes("/folders/") ||
    mat.fileType.toLowerCase().includes("folder");

  const folderMaterials = useMemo(
    () => materials.filter(isFolder),
    [materials],
  );

  const fileMaterials = useMemo(
    () => materials.filter((m) => !isFolder(m)),
    [materials],
  );

  const rootFilesCount = useMemo(
    () => fileMaterials.filter((m) => !m.folderId).length,
    [fileMaterials],
  );

  const displayFiles = useMemo(() => {
    if (selectedFolder) {
      return fileMaterials.filter((m) => m.folderId === selectedFolder.id);
    }
    if (resourceTypeFilter === "folders") return [];
    return fileMaterials.filter((m) => !m.folderId);
  }, [resourceTypeFilter, fileMaterials, selectedFolder]);

  const showFoldersShelf =
    !selectedFolder &&
    resourceTypeFilter !== "files" &&
    folderMaterials.length > 0;

  const totalFiles = displayFiles.length;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedFiles = displayFiles.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <>
      <Header
        title="Materials Vault"
        subtitle={
          "Consolidated repositories for Academic, Creative, Sports, " +
          "and External Affairs assets"
        }
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
                  { id: "external_affairs", label: "External Affairs" },
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

            {/* Resource Type Filter (All / Folders / Files) */}
            <div
              className={
                "flex items-center gap-0.5 p-1 rounded-lg border " +
                "border-border bg-secondary/40"
              }
            >
              <button
                type="button"
                onClick={() => {
                  setResourceTypeFilter("all");
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  resourceTypeFilter === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All ({selectedFolder ? displayFiles.length : materials.length})
              </button>
              {!selectedFolder && (
                <button
                  type="button"
                  onClick={() => {
                    setResourceTypeFilter("folders");
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    "flex items-center gap-1.5",
                    resourceTypeFilter === "folders"
                      ? "bg-background text-amber-500 shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Folders ({folderMaterials.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setResourceTypeFilter("files");
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  "flex items-center gap-1.5",
                  resourceTypeFilter === "files"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {selectedFolder
                    ? `Files (${displayFiles.length})`
                    : `Root Files (${rootFilesCount})`}
                </span>
              </button>
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

            {/* Sort Dropdown */}
            <div className="w-44 shrink-0">
              <Select
                value={sortBy}
                onValueChange={(val) => {
                  setSortBy(val);
                  setCurrentPage(1);
                }}
                options={MATERIAL_SORT_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          {(canManage || isPresident) && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFolderCategory(
                    activeTab === "all" ? "academic" : activeTab,
                  );
                  setCreateFolderOpen(true);
                }}
                className="text-[11px] font-semibold"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1 text-amber-500" />
                New Folder
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setCreateFolderId(
                    selectedFolder ? selectedFolder.id : "root",
                  );
                  setCategory(
                    selectedFolder
                      ? selectedFolder.category
                      : activeTab === "all"
                        ? "academic"
                        : activeTab,
                  );
                  setCreateOpen(true);
                }}
                className="text-[11px] font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Material
              </Button>
            </div>
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
          <div
            className={
              "p-12 text-center rounded-xl border border-dashed " +
              "border-border bg-card"
            }
          >
            <p className="text-xs text-muted-foreground">
              No materials cataloged under this category.
            </p>
          </div>
        ) : resourceTypeFilter === "folders" && folderMaterials.length === 0 ? (
          <div
            className={
              "p-12 text-center rounded-xl border border-dashed " +
              "border-border bg-card"
            }
          >
            <Folder className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No folders cataloged under this category.
            </p>
          </div>
        ) : resourceTypeFilter === "files" && fileMaterials.length === 0 ? (
          <div
            className={
              "p-12 text-center rounded-xl border border-dashed " +
              "border-border bg-card"
            }
          >
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No individual document files cataloged under this category.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Breadcrumb Navigation when inside a Folder */}
            {selectedFolder && (
              <div
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center",
                  "justify-between gap-3 p-4 rounded-xl border",
                  "border-amber-500/30 bg-amber-500/5",
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFolder(null);
                      setCurrentPage(1);
                    }}
                    className="text-xs font-semibold gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to All Folders
                  </Button>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-xs text-muted-foreground",
                    )}
                  >
                    <span>Vault</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span
                      className={cn(
                        "font-semibold text-foreground flex items-center",
                        "gap-1.5",
                      )}
                    >
                      <Folder
                        className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20"
                      />
                      {selectedFolder.title}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {displayFiles.length}{" "}
                      {displayFiles.length === 1 ? "file" : "files"}
                    </Badge>
                  </div>
                </div>

                {/* Drop Zone to Detach/Move Back to Root Vault */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setIsDragOverRootZone(true);
                  }}
                  onDragLeave={() => setIsDragOverRootZone(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverRootZone(false);
                    const data = e.dataTransfer.getData("application/json");
                    let droppedId: string | null = null;
                    try {
                      const parsed = JSON.parse(data);
                      droppedId = parsed.id;
                    } catch {
                      droppedId = e.dataTransfer.getData("text/plain");
                    }
                    if (droppedId) {
                      moveMaterialMutation.mutate({
                        materialId: droppedId,
                        targetFolderId: null,
                      });
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-medium",
                    "transition-all flex items-center gap-1.5 select-none",
                    isDragOverRootZone
                      ? "border-primary bg-primary/10 text-primary scale-105"
                      : "border-dashed border-border text-muted-foreground" +
                        " bg-background/50 hover:bg-background",
                  )}
                  title="Drop a file here to detach from this folder"
                >
                  <FolderInput className="w-3.5 h-3.5 text-primary" />
                  <span>Drop here to move back to Root</span>
                </div>
              </div>
            )}

            {/* 1. Folders Shelf */}
            {showFoldersShelf && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <h3
                      className={
                        "text-xs font-bold uppercase tracking-wider " +
                        "text-muted-foreground"
                      }
                    >
                      Folders ({folderMaterials.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Drag files onto a folder to organize
                  </span>
                </div>

                <div
                  className={
                    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 " +
                    "lg:grid-cols-4 gap-3"
                  }
                >
                  {folderMaterials.map((mat) => {
                    const userCanEdit = canEdit(mat);
                    const isOver = dragOverFolderId === mat.id;
                    const childCount = materials.filter(
                      (m) => m.folderId === mat.id,
                    ).length;

                    return (
                      <Card
                        key={mat.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverFolderId !== mat.id) {
                            setDragOverFolderId(mat.id);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (
                            !e.currentTarget.contains(e.relatedTarget as Node)
                          ) {
                            setDragOverFolderId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverFolderId(null);
                          const data = e.dataTransfer.getData(
                            "application/json",
                          );
                          let droppedId: string | null = null;
                          try {
                            const parsed = JSON.parse(data);
                            droppedId = parsed.id;
                          } catch {
                            droppedId = e.dataTransfer.getData("text/plain");
                          }
                          if (droppedId && droppedId !== mat.id) {
                            moveMaterialMutation.mutate({
                              materialId: droppedId,
                              targetFolderId: mat.id,
                            });
                          }
                        }}
                        className={cn(
                          "group border transition-all select-none",
                          isOver
                            ? "border-amber-500 border-dashed bg-amber-500/15" +
                              " ring-2 ring-amber-500/30 scale-[1.03] shadow-md"
                            : "border-border/80 hover:border-amber-500/50" +
                              " hover:shadow-xs bg-card/70 hover:bg-card",
                        )}
                      >
                        <CardContent
                          className={
                            "p-3 flex items-center justify-between gap-2.5"
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFolder(mat);
                              setCurrentPage(1);
                            }}
                            className={
                              "flex items-center gap-2.5 min-w-0 " +
                              "flex-1 group/link text-left cursor-pointer"
                            }
                            title={`Open ${mat.title}`}
                          >
                            <div
                              className={cn(
                                "w-9 h-9 rounded-lg bg-amber-500/10 border",
                                "border-amber-500/20 flex items-center",
                                "justify-center text-amber-500 shrink-0",
                                "group-hover/link:scale-105 transition-transform",
                              )}
                            >
                              <Folder className="w-4 h-4 fill-amber-500/20" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4
                                className={cn(
                                  "text-xs font-semibold text-foreground",
                                  "truncate group-hover/link:text-amber-500",
                                  "group-hover/link:underline transition-colors",
                                )}
                              >
                                {mat.title}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 uppercase"
                                >
                                  {mat.category.replace(/_/g, " ")}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {childCount}{" "}
                                  {childCount === 1 ? "file" : "files"}
                                </span>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {userCanEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditDialog(mat)}
                                  className={cn(
                                    "p-1.5 rounded-md hover:bg-secondary",
                                    "text-muted-foreground",
                                    "hover:text-foreground transition-colors",
                                  )}
                                  title="Edit Folder"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingMaterial(mat)}
                                  className={cn(
                                    "p-1.5 rounded-md",
                                    "hover:bg-destructive/10",
                                    "text-muted-foreground",
                                    "hover:text-destructive transition-colors",
                                  )}
                                  title="Delete Folder"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setPreviewMaterial(mat)}
                              className={cn(
                                "p-1.5 rounded-md hover:bg-secondary",
                                "text-muted-foreground hover:text-amber-500",
                                "transition-colors",
                              )}
                              title="Preview in Google Drive"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Files Section */}
            {resourceTypeFilter !== "folders" && (
              <div className="space-y-3">
                {selectedFolder ? (
                  <div
                    className={
                      "flex items-center gap-2 pt-2 border-t " +
                      "border-border/60"
                    }
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    <h3
                      className={
                        "text-xs font-bold uppercase tracking-wider " +
                        "text-muted-foreground"
                      }
                    >
                      Files in {selectedFolder.title} ({displayFiles.length})
                    </h3>
                  </div>
                ) : displayFiles.length > 0 ? (
                  <div
                    className={
                      "flex items-center justify-between gap-2 pt-2 " +
                      "border-t border-border/60"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3
                        className={
                          "text-xs font-bold uppercase tracking-wider " +
                          "text-muted-foreground"
                        }
                      >
                        Root Files & Documents ({displayFiles.length})
                      </h3>
                    </div>
                    <span
                      className={
                        "text-[11px] text-muted-foreground hidden " +
                        "sm:inline"
                      }
                    >
                      Drag files into folders above to organize
                    </span>
                  </div>
                ) : null}

                {displayFiles.length === 0 ? (
                  selectedFolder ? (
                    <div
                      className={
                        "p-8 text-center rounded-xl border border-dashed " +
                        "border-border bg-card"
                      }
                    >
                      <Folder
                        className="w-8 h-8 text-amber-500/50 mx-auto mb-2"
                      />
                      <p className="text-xs font-semibold text-foreground">
                        This folder is empty.
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Upload a new file or drag a root file into this folder.
                      </p>
                    </div>
                  ) : folderMaterials.length === 0 ? (
                    <div
                      className={
                        "p-8 text-center rounded-xl border border-dashed " +
                        "border-border bg-card"
                      }
                    >
                      <p className="text-xs text-muted-foreground">
                        No materials or folders registered in this vault.
                      </p>
                    </div>
                  ) : null
                ) : viewMode === "grid" ? (
                  /* Google Drive Tiled Cards with Live Preview */
                  <div
                    className={
                      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 " +
                      "xl:grid-cols-4 gap-4"
                    }
                  >
                    {paginatedFiles.map((mat) => {
                      const isOwner = user?.id === mat.uploadedById;
                      const userCanEdit = canEdit(mat);
                      const isFolderResource = isFolder(mat);
                      const previewUrl = !isFolderResource
                        ? getGooglePreviewUrl(mat.driveUrl)
                        : null;
                      const parentFolder = mat.folderId
                        ? materials.find((m) => m.id === mat.folderId)
                        : null;

                      return (
                        <Card
                          key={mat.id}
                          draggable={canEdit(mat)}
                          onDragStart={(e) => {
                            setDraggingMaterialId(mat.id);
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                id: mat.id,
                                title: mat.title,
                              }),
                            );
                            e.dataTransfer.setData("text/plain", mat.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDraggingMaterialId(null);
                            setDragOverFolderId(null);
                            setIsDragOverRootZone(false);
                          }}
                          className={cn(
                            "group flex flex-col justify-between",
                            "overflow-hidden border border-border/80",
                            "hover:border-primary/40 hover:shadow-md",
                            "transition-all duration-200 bg-card",
                            draggingMaterialId === mat.id &&
                              "opacity-40 ring-2 ring-primary/40 scale-95",
                            canEdit(mat) &&
                              "cursor-grab active:cursor-grabbing",
                          )}
                        >
                          {/* Google Drive Preview Thumbnail Area */}
                          <div
                            className={cn(
                              "relative w-full h-40 bg-secondary/15",
                              "border-b border-border overflow-hidden",
                              "group/thumb select-none flex items-center",
                              "justify-center",
                            )}
                          >
                            {previewUrl ? (
                              <>
                                <iframe
                                  src={previewUrl}
                                  className={cn(
                                    "w-full h-full border-0",
                                    "pointer-events-none scale-[1.02]",
                                    "transform-gpu",
                                  )}
                                  title={mat.title}
                                  loading="lazy"
                                />
                                {/* Interactive Click-to-Expand Overlay */}
                                <div
                                  onClick={() => setPreviewMaterial(mat)}
                                  className={cn(
                                    "absolute inset-0 bg-background/10",
                                    "hover:bg-background/60 transition-all",
                                    "flex items-center justify-center",
                                    "cursor-pointer opacity-0",
                                    "group-hover/thumb:opacity-100",
                                    "backdrop-blur-xs",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5",
                                      "px-3 py-1.5 rounded-md",
                                      "bg-background/95 border border-border",
                                      "shadow-xs text-xs font-semibold",
                                      "text-foreground hover:text-primary",
                                      "transition-colors",
                                    )}
                                  >
                                    <Eye className="w-3.5 h-3.5 text-primary" />
                                    Expand Preview
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div
                                onClick={() => setPreviewMaterial(mat)}
                                className={cn(
                                  "w-full h-full flex flex-col items-center",
                                  "justify-center gap-2 p-4 text-center",
                                  "cursor-pointer bg-secondary/15",
                                  "hover:bg-secondary/25 transition-colors",
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-11 h-11 rounded-xl bg-primary/10 border",
                                    "border-primary/20 flex items-center",
                                    "justify-center text-primary",
                                    "group-hover/thumb:scale-110",
                                    "transition-transform",
                                  )}
                                >
                                  {isFolderResource ? (
                                    <Folder className="w-5 h-5 text-amber-500" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-[11px] text-muted-foreground",
                                    "font-medium line-clamp-1 max-w-[85%]",
                                  )}
                                >
                                  {mat.fileType ||
                                    (isFolderResource ? "Folder" : "File")}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 text-[11px]",
                                    "text-primary font-semibold",
                                  )}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  {isFolderResource
                                    ? "Open Folder"
                                    : "Preview Material"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Metadata and Actions */}
                          <CardContent
                            className={
                              "p-4 flex flex-col justify-between flex-1 gap-3"
                            }
                          >
                            <div className="space-y-1.5">
                              <div
                                className={
                                  "flex flex-wrap items-center " +
                                  "justify-between gap-1"
                                }
                              >
                                <div
                                  className={
                                    "flex items-center gap-1.5 flex-wrap"
                                  }
                                >
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] uppercase font-semibold"
                                  >
                                    {mat.category.replace(/_/g, " ")}
                                  </Badge>
                                  {parentFolder && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFolder(parentFolder);
                                        setCurrentPage(1);
                                      }}
                                      className={cn(
                                        "inline-flex items-center gap-1",
                                        "text-[9px] font-semibold text-amber-500",
                                        "bg-amber-500/10 px-1.5 py-0.5 rounded",
                                        "border border-amber-500/20",
                                        "hover:bg-amber-500/20 transition-colors",
                                      )}
                                      title={`In: ${parentFolder.title}`}
                                    >
                                      <Folder
                                        className="w-2.5 h-2.5 fill-amber-500/20"
                                      />
                                      <span className="truncate max-w-[80px]">
                                        {parentFolder.title}
                                      </span>
                                    </button>
                                  )}
                                  {isOwner && (
                                    <span
                                      className={cn(
                                        "text-[9px] font-medium text-primary",
                                        "bg-primary/10 px-1.5 py-0.5 rounded",
                                        "border border-primary/20",
                                      )}
                                    >
                                      Uploader
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span
                                    className={cn(
                                      "text-[10px] text-muted-foreground",
                                      "font-medium line-clamp-1 max-w-[95px]",
                                    )}
                                  >
                                    {mat.fileType}
                                  </span>
                                  {canEdit(mat) && (
                                    <span title="Drag onto a folder">
                                      <GripVertical
                                        className={cn(
                                          "w-3.5 h-3.5 text-muted-foreground/40",
                                          "group-hover:text-muted-foreground",
                                        )}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h4
                                className={cn(
                                  "text-xs font-bold text-foreground",
                                  "line-clamp-1 hover:text-primary",
                                  "transition-colors cursor-pointer",
                                )}
                                onClick={() => setPreviewMaterial(mat)}
                                title={mat.title}
                              >
                                {mat.title}
                              </h4>
                              <p
                                className={cn(
                                  "text-[11px] text-muted-foreground",
                                  "line-clamp-2 leading-relaxed",
                                )}
                              >
                                {mat.description || "No description provided."}
                              </p>
                            </div>

                            <div
                              className={cn(
                                "pt-2 border-t border-border/80 flex",
                                "items-center justify-between gap-1",
                              )}
                            >
                              <span
                                className="text-[10px] text-muted-foreground"
                              >
                                {new Date(mat.createdAt).toLocaleDateString()}
                              </span>

                              <div className="flex items-center gap-1">
                                {userCanEdit && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMaterialToMove(mat);
                                        setTargetFolderSelect(
                                          mat.folderId || "root",
                                        );
                                        setMoveDialogOpen(true);
                                      }}
                                      className={cn(
                                        "p-1 rounded-md border border-border",
                                        "bg-background hover:bg-secondary",
                                        "text-foreground text-xs transition-colors",
                                      )}
                                      title="Move to Folder"
                                    >
                                      <FolderInput
                                        className="w-3.5 h-3.5 text-amber-500"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditDialog(mat)}
                                      className={cn(
                                        "p-1 rounded-md border border-border",
                                        "bg-background hover:bg-secondary",
                                        "text-foreground text-xs transition-colors",
                                      )}
                                      title="Edit Material"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingMaterial(mat)}
                                      className={cn(
                                        "p-1 rounded-md border",
                                        "border-destructive/30 bg-destructive/10",
                                        "hover:bg-destructive/20",
                                        "text-destructive text-xs",
                                        "transition-colors",
                                      )}
                                      title="Delete Material"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setPreviewMaterial(mat)}
                                  className={cn(
                                    "p-1 rounded-md border border-primary/30",
                                    "bg-primary/10 hover:bg-primary/20",
                                    "text-primary text-xs transition-colors",
                                  )}
                                  title="Preview Material"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={mat.driveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "p-1 rounded-md border border-border",
                                    "bg-background text-muted-foreground",
                                    "hover:text-foreground hover:bg-secondary",
                                    "transition-colors",
                                  )}
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
                    {paginatedFiles.map((mat) => {
                      const isOwner = user?.id === mat.uploadedById;
                      const userCanEdit = canEdit(mat);
                      const isFolderResource = isFolder(mat);
                      const parentFolder = mat.folderId
                        ? materials.find((m) => m.id === mat.folderId)
                        : null;

                      return (
                        <Card
                          key={mat.id}
                          draggable={canEdit(mat)}
                          onDragStart={(e) => {
                            setDraggingMaterialId(mat.id);
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({
                                id: mat.id,
                                title: mat.title,
                              }),
                            );
                            e.dataTransfer.setData("text/plain", mat.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDraggingMaterialId(null);
                            setDragOverFolderId(null);
                            setIsDragOverRootZone(false);
                          }}
                          className={cn(
                            "hover:border-primary/30 transition-all select-none",
                            draggingMaterialId === mat.id &&
                              "opacity-40 ring-2 ring-primary/40",
                            canEdit(mat) &&
                              "cursor-grab active:cursor-grabbing",
                          )}
                        >
                          <CardContent
                            className={
                              "p-4 flex flex-col sm:flex-row " +
                              "justify-between items-start sm:items-center gap-4"
                            }
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-lg bg-primary/10 border",
                                  "border-primary/20 flex items-center",
                                  "justify-center text-primary shrink-0 mt-0.5",
                                )}
                              >
                                {isFolderResource ? (
                                  <Folder className="w-5 h-5 text-amber-500" />
                                ) : (
                                  <FileText className="w-5 h-5" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-foreground">
                                    {mat.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] uppercase font-semibold"
                                  >
                                    {mat.category.replace(/_/g, " ")}
                                  </Badge>
                                  {parentFolder && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFolder(parentFolder);
                                        setCurrentPage(1);
                                      }}
                                      className={cn(
                                        "inline-flex items-center gap-1",
                                        "text-[9px] font-semibold text-amber-500",
                                        "bg-amber-500/10 px-1.5 py-0.5 rounded",
                                        "border border-amber-500/20",
                                        "hover:bg-amber-500/20 transition-colors",
                                      )}
                                      title={`Inside: ${parentFolder.title}`}
                                    >
                                      <Folder
                                        className="w-2.5 h-2.5 fill-amber-500/20"
                                      />
                                      <span className="truncate max-w-[90px]">
                                        {parentFolder.title}
                                      </span>
                                    </button>
                                  )}
                                  {isOwner && (
                                    <span
                                      className={cn(
                                        "text-[10px] font-medium text-primary",
                                        "bg-primary/10 px-1.5 py-0.5 rounded",
                                        "border border-primary/20",
                                      )}
                                    >
                                      Uploader
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {mat.description ||
                                    "No description provided."}
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
                                    onClick={() => {
                                      setMaterialToMove(mat);
                                      setTargetFolderSelect(
                                        mat.folderId || "root",
                                      );
                                      setMoveDialogOpen(true);
                                    }}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2.5 py-1",
                                      "rounded-md border border-border bg-background",
                                      "hover:bg-secondary text-foreground text-[11px]",
                                      "font-semibold transition-colors",
                                    )}
                                    title="Move to Folder"
                                  >
                                    <FolderInput className="w-3 h-3 text-amber-500" />
                                    <span>Move</span>
                                  </button>
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
              </div>
            )}
          </div>
        )}

        {resourceTypeFilter !== "folders" && totalFiles > PAGE_SIZE && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalItems={totalFiles}
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

          <div>
            <label
              className="block text-[11px] font-semibold text-foreground mb-1"
            >
              Parent Folder
            </label>
            <Select
              value={createFolderId}
              onValueChange={setCreateFolderId}
              options={[
                { value: "root", label: "No Folder (Root Vault)" },
                ...folderMaterials.map((f) => ({
                  value: f.id,
                  label: `📁 ${f.title}`,
                })),
              ]}
              placeholder="Select parent folder..."
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
                placeholder="e.g. PDF / Slides / Spreadsheet / Kit"
              />
            </div>
          </div>

          <DriveDropzone
            label="Attach File / Document"
            moduleType="material"
            title={title}
            category={category || "academic"}
            value={driveUrl}
            fileId={fileId}
            onUploaded={(url, fid, fileName) => {
              setDriveUrl(url);
              if (fid) setFileId(fid);
              if (url.includes("/folders/")) {
                setFileType("Folder");
              } else if (fileName && !fileType) {
                const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
                setFileType(`${ext} Document`);
              }
            }}
            onCleared={() => {
              setDriveUrl("");
              setFileId(null);
            }}
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

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        title="Create New Folder"
        description={
          "Create a new folder to organize materials and files " +
          "under this council wing."
        }
      >
        <form onSubmit={handleCreateFolder} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Folder Name
            </label>
            <Input
              type="text"
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              placeholder="e.g. CS 1101 - Lecture Slides 2026"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Council Wing / Category
            </label>
            <Select
              value={folderCategory}
              onValueChange={(val) =>
                setFolderCategory(val as MaterialCategory)
              }
              options={MATERIAL_CATEGORY_OPTIONS}
            />
          </div>

          <MarkdownTextarea
            label="Description (Optional)"
            value={folderDescription}
            onChange={setFolderDescription}
            placeholder="Folder contents, syllabus, or instructions..."
            minHeight="min-h-[70px]"
            maxHeight="max-h-[160px]"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Create Folder
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

          {editingMaterial && !isFolder(editingMaterial) && (
            <div>
              <label
                className="block text-[11px] font-semibold text-foreground mb-1"
              >
                Parent Folder
              </label>
              <Select
                value={editFolderId}
                onValueChange={setEditFolderId}
                options={[
                  { value: "root", label: "No Folder (Root Vault)" },
                  ...folderMaterials
                    .filter((f) => f.id !== editingMaterial.id)
                    .map((f) => ({
                      value: f.id,
                      label: `📁 ${f.title}`,
                    })),
                ]}
                placeholder="Select parent folder..."
              />
            </div>
          )}

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

          <DriveDropzone
            label="Attach File / Document"
            moduleType="material"
            title={editTitle}
            category={editCategory}
            value={editDriveUrl}
            fileId={editFileId}
            onUploaded={(url, fid, fileName) => {
              setEditDriveUrl(url);
              if (fid) setEditFileId(fid);
              if (url.includes("/folders/")) {
                setEditFileType("Folder");
              } else if (fileName && !editFileType) {
                const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
                setEditFileType(`${ext} Document`);
              }
            }}
            onCleared={() => {
              setEditDriveUrl("");
              setEditFileId(null);
            }}
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

      {/* Move Material to Folder Dialog (Tactile Parity & Accessibility) */}
      <Dialog
        open={moveDialogOpen}
        onOpenChange={(isOpen) => {
          setMoveDialogOpen(isOpen);
          if (!isOpen) setMaterialToMove(null);
        }}
        title="Move Material to Folder"
        description={
          `Select target folder for "${materialToMove?.title || "material"}".`
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!materialToMove) return;
            moveMaterialMutation.mutate({
              materialId: materialToMove.id,
              targetFolderId:
                targetFolderSelect === "root" ? null : targetFolderSelect,
            });
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Destination Folder
            </label>
            <Select
              value={targetFolderSelect}
              onValueChange={setTargetFolderSelect}
              options={[
                { value: "root", label: "Root Vault (No Folder)" },
                ...folderMaterials
                  .filter((f) => f.id !== materialToMove?.id)
                  .map((f) => ({
                    value: f.id,
                    label: `📁 ${f.title} (${f.category.replace(/_/g, " ")})`,
                  })),
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMoveDialogOpen(false);
                setMaterialToMove(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={moveMaterialMutation.isPending}
            >
              {moveMaterialMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Confirm Move
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Portal Document Preview with Left Information Sidebar */}
      <DocumentPreviewModal
        open={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || ""}
        subtitle={
          previewMaterial
            ? `${previewMaterial.category.replace(/_/g, " ").toUpperCase()} • ${
                isFolder(previewMaterial) ? "FOLDER" : previewMaterial.fileType
              }`
            : undefined
        }
        url={previewMaterial?.driveUrl || ""}
        fileMeta={
          previewMaterial
            ? {
                title: previewMaterial.title,
                fileName: previewMaterial.title,
                fileType: isFolder(previewMaterial)
                  ? "Folder"
                  : previewMaterial.fileType,
                category: previewMaterial.category
                  .replace(/_/g, " ")
                  .toUpperCase(),
                status: isFolder(previewMaterial)
                  ? "Active Collection Folder"
                  : "Active Repository File",
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
