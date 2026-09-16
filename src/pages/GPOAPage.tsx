import React, { useMemo, useState } from "react";
import {
  BarChart2,
  Calendar as CalendarIcon,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
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
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { DriveLinkInput } from "@/components/ui/DriveLinkInput";
import { DriveGuideModal } from "@/components/ui/DriveGuideModal";
import { DriveDropzone } from "@/components/ui/DriveDropzone";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import type { GPOAEvent, GPOAEventStatus } from "@/types";

const GPOA_STATUS_OPTIONS = [
  {
    value: "proposal",
    label: "Proposal",
    description: "Concept drafting & internal permit routing",
  },
  {
    value: "in_review",
    label: "In Review",
    description: "Pending executive board or faculty adviser approval",
  },
  {
    value: "approved",
    label: "Approved",
    description: "Officially confirmed and scheduled activity",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Concluded with documentation and terminal report",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Discontinued or shelved activity",
  },
];

const GPOA_SORT_OPTIONS = [
  { value: "start_time:asc", label: "Event Soonest" },
  { value: "start_time:desc", label: "Event Furthest" },
  { value: "title:asc", label: "Title (A to Z)" },
  { value: "title:desc", label: "Title (Z to A)" },
  { value: "created_at:desc", label: "Newest Created" },
];

const GPOA_STATUS_BADGES: Record<
  GPOAEventStatus,
  { label: string; className: string }
> = {
  proposal: {
    label: "Proposal",
    className:
      "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/15",
  },
  in_review: {
    label: "In Review",
    className:
      "bg-sky-500/10 text-sky-500 border-sky-500/20 dark:bg-sky-500/15",
  },
  approved: {
    label: "Approved",
    className:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/15",
  },
  completed: {
    label: "Completed",
    className:
      "bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/15",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/15",
  },
};

const formatForDateTimeLocal = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface EventDriveSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  eventTitle: string;
  driveFolderUrl: string;
  onDriveFolderChange: (v: string) => void;
  proposalDocUrl: string;
  onProposalDocChange: (v: string) => void;
  materialsUrl: string;
  onMaterialsChange: (v: string) => void;
  documentationUrl: string;
  onDocumentationChange: (v: string) => void;
  evaluationsUrl: string;
  onEvaluationsChange: (v: string) => void;
  terminalReportUrl: string;
  onTerminalReportChange: (v: string) => void;
  onOpenSopModal: () => void;
  onProvisionDrive?: () => void;
  isProvisioning?: boolean;
}

const EventDriveSection: React.FC<EventDriveSectionProps> = ({
  isOpen,
  onToggle,
  eventTitle,
  driveFolderUrl,
  onDriveFolderChange,
  proposalDocUrl,
  onProposalDocChange,
  materialsUrl,
  onMaterialsChange,
  documentationUrl,
  onDocumentationChange,
  evaluationsUrl,
  onEvaluationsChange,
  terminalReportUrl,
  onTerminalReportChange,
  onOpenSopModal,
  onProvisionDrive,
  isProvisioning,
}) => {
  const [showManualLinks, setShowManualLinks] = useState(false);
  const [activeDeliverableIdx, setActiveDeliverableIdx] = useState(0);

  const configuredCount = [
    driveFolderUrl,
    proposalDocUrl,
    materialsUrl,
    documentationUrl,
    evaluationsUrl,
    terminalReportUrl,
  ].filter(Boolean).length;

  const deliverables = [
    {
      id: "proposals",
      num: "01",
      shortLabel: "Proposals",
      fullLabel: "01 Proposals & Permits",
      docType: "01_Proposals",
      value: proposalDocUrl,
      onChange: onProposalDocChange,
    },
    {
      id: "materials",
      num: "02",
      shortLabel: "Program",
      fullLabel: "02 Program & Materials",
      docType: "02_Program_Materials",
      value: materialsUrl,
      onChange: onMaterialsChange,
    },
    {
      id: "documentation",
      num: "03",
      shortLabel: "Docs",
      fullLabel: "03 Documentation",
      docType: "03_Documentation",
      value: documentationUrl,
      onChange: onDocumentationChange,
    },
    {
      id: "evaluations",
      num: "04",
      shortLabel: "Evals",
      fullLabel: "04 Evaluations",
      docType: "04_Evaluations",
      value: evaluationsUrl,
      onChange: onEvaluationsChange,
    },
    {
      id: "terminal",
      num: "05",
      shortLabel: "Report",
      fullLabel: "05 Terminal Report",
      docType: "05_Terminal_Report",
      value: terminalReportUrl,
      onChange: onTerminalReportChange,
    },
  ];

  const currentDeliv = deliverables[activeDeliverableIdx];

  return (
    <div className="border border-border/80 rounded-lg p-3 bg-secondary/20">
      <button
        type="button"
        onClick={onToggle}
        className={
          "w-full flex items-center justify-between text-xs font-semibold " +
          "text-foreground hover:text-primary transition-colors py-0.5"
        }
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span>Google Drive Deliverables & Folders</span>
          {configuredCount > 0 && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              {configuredCount} Linked
            </Badge>
          )}
        </div>
        <ChevronDown
          className={
            "w-4 h-4 text-muted-foreground transition-transform " +
            (isOpen ? "rotate-180" : "")
          }
        />
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
          {/* Main Folder Status Banner */}
          <div
            className={
              "flex flex-col sm:flex-row items-start sm:items-center " +
              "justify-between gap-2 p-2.5 rounded-lg border " +
              (driveFolderUrl
                ? "bg-primary/5 border-primary/20 text-foreground"
                : "bg-muted/50 border-border text-muted-foreground")
            }
          >
            <div className="flex items-center gap-2 text-xs">
              <Folder className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold block text-foreground">
                  {driveFolderUrl
                    ? "Event Folder Ready"
                    : "No Drive Folder Provisioned Yet"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {driveFolderUrl
                    ? "Folder template & 5 SOP subfolders are linked."
                    : "Auto-provision to create Google Drive folder structure."}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {driveFolderUrl && (
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "inline-flex items-center gap-1 px-2.5 py-1 text-xs " +
                    "rounded font-semibold bg-secondary text-foreground " +
                    "hover:text-primary transition-colors"
                  }
                >
                  <span>Open Folder</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {onProvisionDrive && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onProvisionDrive}
                  disabled={isProvisioning}
                  className="text-xs h-7 px-2.5 gap-1"
                >
                  {isProvisioning ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-primary" />
                  )}
                  <span>
                    {driveFolderUrl ? "Re-Sync Structure" : "Auto-Provision"}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Deliverables Tab Selector & Spacious Full-Width Dropzone */}
          <div className="space-y-2">
            <div
              className={
                "grid grid-cols-5 gap-1 p-1 bg-secondary/40 rounded-lg " +
                "border border-border/60"
              }
            >
              {deliverables.map((item, idx) => {
                const isLinked = Boolean(item.value);
                const isActive = activeDeliverableIdx === idx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveDeliverableIdx(idx)}
                    className={
                      "flex flex-col items-center justify-center py-1.5 px-1 " +
                      "rounded-md text-center transition-all cursor-pointer " +
                      (isActive
                        ? "bg-card text-foreground font-semibold shadow-xs " +
                          "border border-border/80"
                        : "text-muted-foreground hover:text-foreground " +
                          "hover:bg-background/50")
                    }
                  >
                    <div className="flex items-center gap-1">
                      {isLinked ? (
                        <CheckCircle2
                          className="w-3 h-3 text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span
                          className={
                            "w-1.5 h-1.5 rounded-full shrink-0 " +
                            (isActive
                              ? "bg-primary"
                              : "bg-muted-foreground/30")
                          }
                        />
                      )}
                      <span className="text-[11px] font-mono font-medium">
                        {item.num}
                      </span>
                    </div>
                    <span
                      className={
                        "text-[10px] truncate max-w-full block leading-tight " +
                        "mt-0.5"
                      }
                    >
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Deliverable Dropzone - Full Width */}
            <DriveDropzone
              key={currentDeliv.id}
              label={currentDeliv.fullLabel}
              moduleType="gpoa"
              title={eventTitle}
              docType={currentDeliv.docType}
              value={currentDeliv.value}
              onUploaded={(url) => currentDeliv.onChange(url)}
              onCleared={() => currentDeliv.onChange("")}
            />

            {/* Direct Subfolder Link Shortcut if linked */}
            {currentDeliv.value && (
              <div
                className={
                  "flex items-center justify-between p-2 rounded-lg " +
                  "bg-background/60 border border-border/60 text-xs"
                }
              >
                <span className="text-[11px] text-muted-foreground truncate">
                  Active Asset:{" "}
                  <strong className="text-foreground font-medium">
                    {currentDeliv.shortLabel}
                  </strong>
                </span>
                <a
                  href={currentDeliv.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "inline-flex items-center gap-1 text-[11px] " +
                    "font-semibold text-primary hover:underline shrink-0"
                  }
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/80 px-0.5">
              Tip: For bulk files (like event photos), open the folder in Drive
              to drop files directly, or paste the Google Drive folder link.
            </p>

            {/* Pagination / Stepper Navigation */}
            <div
              className={
                "flex items-center justify-between text-[11px] " +
                "text-muted-foreground px-1"
              }
            >
              <span>
                {configuredCount} of 5 SOP deliverables linked
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activeDeliverableIdx === 0}
                  onClick={() =>
                    setActiveDeliverableIdx((prev) => Math.max(0, prev - 1))
                  }
                  className={
                    "px-2 py-0.5 rounded border border-border/70 " +
                    "hover:bg-secondary text-[10px] font-medium " +
                    "disabled:opacity-30 disabled:pointer-events-none"
                  }
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={activeDeliverableIdx === deliverables.length - 1}
                  onClick={() =>
                    setActiveDeliverableIdx((prev) =>
                      Math.min(deliverables.length - 1, prev + 1),
                    )
                  }
                  className={
                    "px-2 py-0.5 rounded border border-border/70 " +
                    "hover:bg-secondary text-[10px] font-medium " +
                    "disabled:opacity-30 disabled:pointer-events-none"
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Manual Link Override Collapsible */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowManualLinks(!showManualLinks)}
              className={
                "text-[11px] text-muted-foreground hover:text-primary " +
                "transition-colors underline"
              }
            >
              {showManualLinks
                ? "Hide manual URL inputs"
                : "Manual Drive URL inputs / override"}
            </button>

            {showManualLinks && (
              <div
                className={
                  "mt-2 space-y-2.5 p-2.5 bg-background/50 rounded " +
                  "border border-border/50"
                }
              >
                <DriveLinkInput
                  registryKey="eventFolderTemplate"
                  value={driveFolderUrl}
                  onChange={onDriveFolderChange}
                  label="Root Drive Folder URL"
                  placeholder="https://drive.google.com/drive/folders/..."
                  onOpenSopModal={onOpenSopModal}
                />
                <DriveLinkInput
                  registryKey="eventProposals"
                  value={proposalDocUrl}
                  onChange={onProposalDocChange}
                  label="Proposal URL"
                  placeholder="https://docs.google.com/document/d/..."
                  onOpenSopModal={onOpenSopModal}
                />
                <DriveLinkInput
                  registryKey="eventTerminalReport"
                  value={terminalReportUrl}
                  onChange={onTerminalReportChange}
                  label="Terminal Report URL"
                  placeholder="https://docs.google.com/document/d/..."
                  onOpenSopModal={onOpenSopModal}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const GPOAPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_gpoa");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("start_time:asc");
  const [driveGuideOpen, setDriveGuideOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GPOAEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<GPOAEvent | null>(null);

  const [sortField, sortOrder] = sortBy.split(":");

  // TanStack Query with backend-level sorting
  const { data: events = [], isLoading } = useQuery<GPOAEvent[]>({
    queryKey: queryKeys.gpoaFiltered({
      sort_by: sortField,
      order: sortOrder,
    }),
    queryFn: () =>
      api.get<GPOAEvent[]>(`/gpoa?sort_by=${sortField}&order=${sortOrder}`),
  });

  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<GPOAEventStatus>("proposal");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [syncToGoogle, setSyncToGoogle] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<GPOAEventStatus>("proposal");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTargetAudience, setEditTargetAudience] = useState("");
  const [editDriveFolderUrl, setEditDriveFolderUrl] = useState("");
  const [editProposalDocUrl, setEditProposalDocUrl] = useState("");
  const [editMaterialsUrl, setEditMaterialsUrl] = useState("");
  const [editDocumentationUrl, setEditDocumentationUrl] = useState("");
  const [editEvaluationsUrl, setEditEvaluationsUrl] = useState("");
  const [editTerminalReportUrl, setEditTerminalReportUrl] = useState("");
  const [showEditDriveSection, setShowEditDriveSection] = useState(false);

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setStatus("proposal");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setTargetAudience("");
    setSyncToGoogle(false);
  };

  // Provision Drive Mutation
  const provisionDriveMutation = useMutation({
    mutationFn: (eventId: string) =>
      api.post<GPOAEvent>(`/gpoa/${eventId}/provision-drive`),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gpoa });
      if (updated.driveFolderUrl) {
        setEditDriveFolderUrl(updated.driveFolderUrl);
      }
      toastSuccess("Google Drive folders provisioned successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to provision Drive folders");
    },
  });

  // Create Mutation
  const createEventMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<GPOAEvent>("/gpoa", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gpoa });
      setCreateDialogOpen(false);
      resetCreateForm();
      toastSuccess("GPOA activity created successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to create GPOA activity");
    },
  });

  // Update Mutation
  const updateEventMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => api.put<GPOAEvent>(`/gpoa/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gpoa });
      setEditDialogOpen(false);
      setEditingEvent(null);
      toastSuccess("GPOA activity updated successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update GPOA activity");
    },
  });

  // Delete Mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/gpoa/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gpoa });
      setEventToDelete(null);
      toastSuccess("GPOA activity removed.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete GPOA activity");
    },
  });

  const handleOpenEdit = (event: GPOAEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditStatus(event.status || "proposal");
    setEditStartTime(formatForDateTimeLocal(event.startTime));
    setEditEndTime(formatForDateTimeLocal(event.endTime));
    setEditLocation(event.location || "");
    setEditTargetAudience(event.targetAudience || "");
    setEditDriveFolderUrl(event.driveFolderUrl || "");
    setEditProposalDocUrl(event.proposalDocUrl || "");
    setEditMaterialsUrl(event.materialsUrl || "");
    setEditDocumentationUrl(event.documentationUrl || "");
    setEditEvaluationsUrl(event.evaluationsUrl || "");
    setEditTerminalReportUrl(event.terminalReportUrl || "");
    setShowEditDriveSection(
      Boolean(
        event.driveFolderUrl ||
          event.proposalDocUrl ||
          event.materialsUrl ||
          event.documentationUrl ||
          event.evaluationsUrl ||
          event.terminalReportUrl,
      ),
    );
    setEditDialogOpen(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate({
      title,
      description,
      status,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      location,
      targetAudience: targetAudience || "All CS Students",
      syncToGoogle,
    });
  };

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    updateEventMutation.mutate({
      id: editingEvent.id,
      payload: {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        startTime: new Date(editStartTime).toISOString(),
        endTime: new Date(editEndTime).toISOString(),
        location: editLocation,
        targetAudience: editTargetAudience || "All CS Students",
        driveFolderUrl: editDriveFolderUrl.trim() || null,
        proposalDocUrl: editProposalDocUrl.trim() || null,
        materialsUrl: editMaterialsUrl.trim() || null,
        documentationUrl: editDocumentationUrl.trim() || null,
        evaluationsUrl: editEvaluationsUrl.trim() || null,
        terminalReportUrl: editTerminalReportUrl.trim() || null,
      },
    });
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    for (const ev of events) {
      const s = ev.status || "proposal";
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return events.filter((ev) => {
      const currentStatus = ev.status || "proposal";
      const matchesStatus =
        statusFilter === "all" || currentStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.description && ev.description.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.targetAudience && ev.targetAudience.toLowerCase().includes(q))
      );
    });
  }, [events, searchQuery, statusFilter]);

  return (
    <>
      <Header
        title="General Plan of Activities (GPOA)"
        subtitle="Annual timeline, lifecycle review, and Drive integration"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Actions bar */}
        <div
          className={
            "flex flex-col sm:flex-row justify-between items-stretch " +
            "sm:items-center gap-4"
          }
        >
          <div className="flex items-center gap-2">
            <span
              className={"w-2 h-2 rounded-full bg-emerald-500 animate-pulse"}
            />
            <span className="text-xs font-semibold text-muted-foreground">
              Google Calendar 1-Click Sync Enabled
            </span>
          </div>

          <div
            className={
              "flex flex-col sm:flex-row items-stretch " +
              "sm:items-center gap-2.5"
            }
          >
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search GPOA activities..."
              className="w-full sm:w-64"
              size="sm"
            />

            <div className="w-44 shrink-0">
              <Select
                value={sortBy}
                onValueChange={setSortBy}
                options={GPOA_SORT_OPTIONS}
                size="sm"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDriveGuideOpen(true)}
              className="text-xs font-semibold shrink-0 gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
              <span>Event SOPs</span>
            </Button>

            {canManage && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  resetCreateForm();
                  setCreateDialogOpen(true);
                }}
                className="text-xs font-semibold shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Plan Activity
              </Button>
            )}
          </div>
        </div>

        {/* Status Lifecycle Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={
              "px-3 py-1.5 rounded-lg text-xs font-semibold " +
              "transition-colors shrink-0 " +
              (statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground")
            }
          >
            All Activities ({statusCounts["all"] || 0})
          </button>
          {GPOA_STATUS_OPTIONS.map((opt) => {
            const count = statusCounts[opt.value] || 0;
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={
                  "px-3 py-1.5 rounded-lg text-xs font-semibold " +
                  "transition-colors shrink-0 flex items-center gap-1.5 " +
                  (isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground")
                }
              >
                <span>{opt.label}</span>
                <span
                  className={
                    "text-[10px] px-1.5 py-0.2 rounded-full " +
                    (isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/80 text-muted-foreground")
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule Grid */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            className={
              "p-12 text-center rounded-xl border border-dashed " +
              "border-border bg-card"
            }
          >
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No GPOA activities match current filters."
                : "No GPOA activities scheduled yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => {
              const currentStatus = event.status || "proposal";
              const badgeMeta =
                GPOA_STATUS_BADGES[currentStatus] ||
                GPOA_STATUS_BADGES["proposal"];

              const hasDriveAssets = Boolean(
                event.driveFolderUrl ||
                  event.proposalDocUrl ||
                  event.materialsUrl ||
                  event.documentationUrl ||
                  event.evaluationsUrl ||
                  event.terminalReportUrl,
              );

              return (
                <Card key={event.id} className="flex flex-col justify-between">
                  <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={
                              "text-[9px] uppercase font-bold " +
                              badgeMeta.className
                            }
                          >
                            {badgeMeta.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-semibold"
                          >
                            {event.targetAudience}
                          </Badge>
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(event)}
                              title="Edit Activity"
                              className={
                                "p-1 rounded-md text-muted-foreground " +
                                "hover:text-foreground hover:bg-secondary " +
                                "transition-colors"
                              }
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEventToDelete(event)}
                              title="Delete Activity"
                              className={
                                "p-1 rounded-md text-muted-foreground " +
                                "hover:text-rose-500 hover:bg-rose-500/10 " +
                                "transition-colors"
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-foreground">
                        {event.title}
                      </h4>
                      <p
                        className={
                          "text-xs text-muted-foreground mt-1 line-clamp-2"
                        }
                      >
                        {event.description}
                      </p>

                      {/* Drive Deliverables Quick Links */}
                      {hasDriveAssets && (
                        <div
                          className={
                            "flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 " +
                            "border-t border-border/50 text-[10px]"
                          }
                        >
                          <span className="font-semibold text-muted-foreground mr-0.5">
                            Drive:
                          </span>
                          {event.driveFolderUrl && (
                            <a
                              href={event.driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open Main Event Folder"
                              className={
                                "inline-flex items-center gap-1 px-1.5 py-0.5 " +
                                "rounded bg-secondary text-foreground " +
                                "hover:text-primary transition-colors"
                              }
                            >
                              <Folder className="w-3 h-3 text-primary" />
                              <span>Folder</span>
                            </a>
                          )}
                          {event.proposalDocUrl && (
                            <a
                              href={event.proposalDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="01 Proposals & Permits"
                              className={
                                "inline-flex items-center gap-1 px-1.5 py-0.5 " +
                                "rounded bg-secondary text-foreground " +
                                "hover:text-amber-500 transition-colors"
                              }
                            >
                              <FileText className="w-3 h-3 text-amber-500" />
                              <span>Proposal</span>
                            </a>
                          )}
                          {event.materialsUrl && (
                            <a
                              href={event.materialsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="02 Program & Materials"
                              className={
                                "inline-flex items-center gap-1 px-1.5 py-0.5 " +
                                "rounded bg-secondary text-foreground " +
                                "hover:text-blue-500 transition-colors"
                              }
                            >
                              <FileSpreadsheet className="w-3 h-3 text-blue-500" />
                              <span>Materials</span>
                            </a>
                          )}
                          {event.documentationUrl && (
                            <a
                              href={event.documentationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="03 Documentation"
                              className={
                                "inline-flex items-center gap-1 px-1.5 py-0.5 " +
                                "rounded bg-secondary text-foreground " +
                                "hover:text-emerald-500 transition-colors"
                              }
                            >
                              <Camera className="w-3 h-3 text-emerald-500" />
                              <span>Docs</span>
                            </a>
                          )}
                          {event.evaluationsUrl && (
                            <a
                              href={event.evaluationsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="04 Evaluations"
                              className={
                                "inline-flex items-center gap-1 px-1.5 py-0.5 " +
                                "rounded bg-secondary text-foreground " +
                                "hover:text-purple-500 transition-colors"
                              }
                            >
                              <BarChart2 className="w-3 h-3 text-purple-500" />
                              <span>Eval</span>
                            </a>
                          )}
                          {event.terminalReportUrl && (
                            <a
                              href={event.terminalReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="05 Terminal Report"
                              className={
                                "inline-flex items-center gap-1 px-1.5 py-0.5 " +
                                "rounded bg-secondary text-foreground " +
                                "hover:text-teal-500 transition-colors"
                              }
                            >
                              <CheckCircle2 className="w-3 h-3 text-teal-500" />
                              <span>Terminal</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className={
                        "pt-3 border-t border-border flex flex-col " +
                        "sm:flex-row sm:items-center justify-between " +
                        "gap-3 text-[11px] text-muted-foreground"
                      }
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span>
                            {new Date(event.startTime).toLocaleDateString()} (
                            {new Date(event.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            )
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span className="truncate">
                            {event.location || "Online / Discord"}
                          </span>
                        </div>
                      </div>

                      <a
                        href={buildGoogleCalendarUrl({
                          title: event.title,
                          description: event.description,
                          location: event.location,
                          startTime: event.startTime,
                          endTime: event.endTime,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          "inline-flex items-center justify-center gap-1.5 " +
                          "px-2.5 py-1.5 rounded-lg border border-border/70 " +
                          "hover:border-primary/50 bg-secondary/40 " +
                          "hover:bg-primary/10 text-[11px] font-semibold " +
                          "text-foreground transition-all duration-150 " +
                          "hover:-translate-y-0.5 shrink-0"
                        }
                        title="Sync to Google Calendar"
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                        <span>Sync to GCal</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Activity Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetCreateForm();
        }}
        title="Schedule GPOA Activity"
        description={
          "Set activity status lifecycle, Google Drive folders, and timeline."
        }
        className="max-w-2xl sm:max-w-2xl"
      >
        <form onSubmit={handleCreateEvent} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-2">
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Activity Title
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. CS General Assembly 2026"
              />
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => {
                  const newStatus = val as GPOAEventStatus;
                  setStatus(newStatus);
                  if (newStatus === "approved") {
                    setSyncToGoogle(true);
                  }
                }}
                options={GPOA_STATUS_OPTIONS}
              />
            </div>
          </div>

          <MarkdownTextarea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Agenda flow, deliverables, and objectives..."
            minHeight="min-h-[75px]"
            maxHeight="max-h-[160px]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Start Time
              </label>
              <DateTimePicker
                value={startTime}
                onChange={setStartTime}
                required
              />
            </div>
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                End Time
              </label>
              <DateTimePicker
                value={endTime}
                onChange={setEndTime}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Location
              </label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. CS Building AVR / Online"
              />
            </div>
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Target Audience
              </label>
              <Input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. All CS Students / 1st Year"
              />
            </div>
          </div>

          {/* Auto-Provision Info Banner */}
          <div
            className={
              "flex items-center gap-2 p-2.5 rounded-lg border " +
              "border-dashed border-primary/30 bg-primary/5 text-foreground"
            }
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground font-semibold">
                Auto-Provision Active:
              </strong>{" "}
              Submitting will automatically create the Google Drive event folder
              and 5 standard SOP subfolders.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="sync-gcal"
              type="checkbox"
              checked={syncToGoogle}
              onChange={(e) => setSyncToGoogle(e.target.checked)}
              className="rounded border-input text-foreground focus:ring-ring"
            />
            <label
              htmlFor="sync-gcal"
              className="text-xs text-foreground font-medium"
            >
              Push event to official Google Calendar via API
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}
        title="Edit GPOA Activity"
        description={
          "Update scheduled activity lifecycle, timeline, and Drive links."
        }
        className="max-w-2xl sm:max-w-2xl"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-2">
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Activity Title
              </label>
              <Input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                placeholder="e.g. CS General Assembly 2026"
              />
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Status
              </label>
              <Select
                value={editStatus}
                onValueChange={(val) => setEditStatus(val as GPOAEventStatus)}
                options={GPOA_STATUS_OPTIONS}
              />
            </div>
          </div>

          <MarkdownTextarea
            label="Description"
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Agenda flow, deliverables, and objectives..."
            minHeight="min-h-[75px]"
            maxHeight="max-h-[160px]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Start Time
              </label>
              <DateTimePicker
                value={editStartTime}
                onChange={setEditStartTime}
                required
              />
            </div>
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                End Time
              </label>
              <DateTimePicker
                value={editEndTime}
                onChange={setEditEndTime}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Location
              </label>
              <Input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. CS Building AVR / Online"
              />
            </div>
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Target Audience
              </label>
              <Input
                type="text"
                value={editTargetAudience}
                onChange={(e) => setEditTargetAudience(e.target.value)}
                placeholder="e.g. All CS Students / 1st Year"
              />
            </div>
          </div>

          {/* Edit Drive Section Accordion */}
          <EventDriveSection
            isOpen={showEditDriveSection}
            onToggle={() => setShowEditDriveSection(!showEditDriveSection)}
            eventTitle={editTitle}
            driveFolderUrl={editDriveFolderUrl}
            onDriveFolderChange={setEditDriveFolderUrl}
            proposalDocUrl={editProposalDocUrl}
            onProposalDocChange={setEditProposalDocUrl}
            materialsUrl={editMaterialsUrl}
            onMaterialsChange={setEditMaterialsUrl}
            documentationUrl={editDocumentationUrl}
            onDocumentationChange={setEditDocumentationUrl}
            evaluationsUrl={editEvaluationsUrl}
            onEvaluationsChange={setEditEvaluationsUrl}
            terminalReportUrl={editTerminalReportUrl}
            onTerminalReportChange={setEditTerminalReportUrl}
            onOpenSopModal={() => setDriveGuideOpen(true)}
            onProvisionDrive={
              editingEvent
                ? () => provisionDriveMutation.mutate(editingEvent.id)
                : undefined
            }
            isProvisioning={provisionDriveMutation.isPending}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateEventMutation.isPending}
            >
              {updateEventMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!eventToDelete}
        title="Delete GPOA Activity?"
        description={
          `Are you sure you want to remove "${eventToDelete?.title}"? ` +
          "This will remove the event from the council schedule."
        }
        confirmText="Delete Activity"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteEventMutation.isPending}
        onConfirm={() => {
          if (eventToDelete) {
            deleteEventMutation.mutate(eventToDelete.id);
          }
        }}
        onClose={() => setEventToDelete(null)}
      />

      {/* Drive Guide Modal pre-filtered to Wing 08 GPOA Events */}
      <DriveGuideModal
        open={driveGuideOpen}
        onOpenChange={setDriveGuideOpen}
        initialWing="08"
      />
    </>
  );
};
