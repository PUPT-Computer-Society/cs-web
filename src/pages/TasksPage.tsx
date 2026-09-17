import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  GripVertical,
  ListTodo,
  Plus,
  Search,
  Square,
  Trash2,
  User as UserIcon,
  UserCheck,
  X,
} from "lucide-react";
import { API_BASE_URL, api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useGlobalLoader } from "@/context/LoadingContext";
import { useSSE } from "@/context/SSEContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, Pill } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ConflictResolutionDialog } from "@/components/ui/ConflictResolutionDialog";
import { Select } from "@/components/ui/Select";
import { SearchBar } from "@/components/ui/SearchBar";
import { DatePicker } from "@/components/ui/DatePicker";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import {
  formatDateUTC8,
  toDateTimeLocalUTC8,
  toISOStringUTC8,
} from "@/lib/dateUtils";
import type { GPOAEvent, Task, TaskStatus, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const TASK_SORT_OPTIONS = [
  { value: "created_at:desc", label: "Date (Newest first)" },
  { value: "created_at:asc", label: "Date (Oldest first)" },
  { value: "due_date:asc", label: "Due Date (Earliest first)" },
  { value: "due_date:desc", label: "Due Date (Latest first)" },
  { value: "title:asc", label: "Title (A-Z)" },
];

export const COUNCIL_DEPARTMENTS = [
  "Executive Governance",
  "Internal Affairs",
  "External Affairs",
  "Records & Documentation",
  "Finance & Audit",
  "Communications & Media",
  "Creatives & Branding",
  "Academics & Research",
  "Sports & Wellness",
  "Logistics & Property",
] as const;

const TASK_MIME_TYPE = "application/x-cs-task-id";

interface KanbanColumnDef {
  status: TaskStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeClass: string;
  borderClass: string;
  dotClass: string;
}

const columns: KanbanColumnDef[] = [
  {
    status: "todo",
    label: "To Do",
    icon: Circle,
    colorClass: "text-slate-500 dark:text-slate-400",
    badgeClass:
      "text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/20",
    borderClass: "border-t-slate-400/80",
    dotClass: "bg-slate-400",
  },
  {
    status: "in_progress",
    label: "In Progress",
    icon: Clock,
    colorClass: "text-amber-500 dark:text-amber-400",
    badgeClass:
      "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    borderClass: "border-t-amber-500",
    dotClass: "bg-amber-500",
  },
  {
    status: "under_review",
    label: "Under Review",
    icon: AlertCircle,
    colorClass: "text-blue-500 dark:text-blue-400",
    badgeClass:
      "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    borderClass: "border-t-blue-500",
    dotClass: "bg-blue-500",
  },
  {
    status: "done",
    label: "Done",
    icon: CheckCircle2,
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeClass:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    borderClass: "border-t-emerald-500",
    dotClass: "bg-emerald-500",
  },
];

interface KanbanColumnProps {
  col: KanbanColumnDef;
  tasks: Task[];
  isOver: boolean;
  draggedTaskId: string | null;
  canEditTask: (task: Task) => boolean;
  usersMap: Map<string, User>;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = React.memo(
  ({
    col,
    tasks,
    isOver,
    draggedTaskId,
    canEditTask,
    usersMap,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragStart,
    onDragEnd,
    onSelectTask,
    onUpdateStatus,
  }) => {
    return (
      <div
        onDragOver={(e) => onDragOver(e, col.status)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, col.status)}
        className={
          "rounded-xl border border-white/[0.08] p-3 flex flex-col " +
          `border-t-2 ${col.borderClass} ` +
          "max-h-[calc(100vh-270px)] min-h-[460px] " +
          `transition-colors duration-100 ${
            isOver
              ? "ring-1 ring-primary/40 bg-primary/10"
              : "bg-card/40"
          }`
        }
      >
        <div
          className={
            "flex justify-between items-center pb-2.5 border-b " +
            "border-white/[0.08] mb-2.5 shrink-0"
          }
        >
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", col.dotClass)} />
            <col.icon className={cn("w-3.5 h-3.5 shrink-0", col.colorClass)} />
            <span
              className={
                "text-[12px] font-semibold tracking-[-0.01em] text-foreground"
              }
            >
              {col.label}
            </span>
          </div>
          <span
            className={cn(
              "text-[11px] font-mono font-medium px-1.5 py-0.5 " +
                "rounded border",
              col.badgeClass,
            )}
          >
            {tasks.length}
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {tasks.map((task) => {
            const assignee = task.assignedToId
              ? usersMap.get(task.assignedToId)
              : null;
            const isDragged = draggedTaskId === task.id;
            const canEdit = canEditTask(task);

            return (
              <div
                key={task.id}
                draggable={canEdit}
                onDragStart={(e) => onDragStart(e, task.id)}
                onDragEnd={onDragEnd}
                onClick={() => onSelectTask(task)}
                className={
                  "p-3 rounded-lg cursor-pointer border border-white/[0.08] " +
                  "hover:border-white/20 select-none group relative bg-card " +
                  "hover:bg-muted/30 text-[13px] tracking-[-0.01em] " +
                  (isDragged
                    ? "opacity-40 border-dashed border-primary " +
                      "ring-1 ring-primary/40"
                    : "transition-colors duration-100")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <h5
                    className={
                      "text-[13px] font-medium text-foreground " +
                      "line-clamp-2 flex-1 tracking-[-0.01em] leading-snug"
                    }
                  >
                    {task.title}
                  </h5>
                  {canEdit && (
                    <GripVertical
                      className={
                        "w-3.5 h-3.5 text-muted-foreground/40 opacity-0 " +
                        "group-hover:opacity-100 transition-opacity shrink-0"
                      }
                    />
                  )}
                </div>

                {task.description && (
                  <p
                    className={
                      "text-[12px] text-muted-foreground mt-1 line-clamp-2 " +
                      "leading-relaxed"
                    }
                  >
                    {task.description}
                  </p>
                )}

                <div
                  className={
                    "mt-2 flex flex-wrap items-center " +
                    "gap-1.5 text-[11px] text-muted-foreground"
                  }
                >
                  {task.dueDate && (
                    <a
                      href={buildGoogleCalendarUrl({
                        title: `[Action Item] ${task.title}`,
                        description: task.description || "",
                        startTime: task.dueDate,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      onClick={(e) => e.stopPropagation()}
                      className={
                        "inline-flex items-center gap-1 bg-secondary/60 " +
                        "border border-white/[0.06] text-muted-foreground " +
                        "hover:text-foreground px-1.5 py-0.5 rounded " +
                        "transition-colors duration-100 group/gcal"
                      }
                      title="Sync deadline to Google Calendar"
                    >
                      <Calendar
                        className={"w-3 h-3 text-muted-foreground shrink-0"}
                      />
                      <span>{formatDateUTC8(task.dueDate)}</span>
                      <ExternalLink
                        className={
                          "w-2.5 h-2.5 opacity-60 " +
                          "group-hover/gcal:opacity-100"
                        }
                      />
                    </a>
                  )}

                  {task.department && (
                    <span
                      className={
                        "inline-flex items-center gap-1 bg-amber-500/10 " +
                        "text-amber-600 dark:text-amber-400 border " +
                        "border-amber-500/20 px-1.5 py-0.5 rounded " +
                        "truncate max-w-[130px]"
                      }
                      title={`Department: ${task.department}`}
                    >
                      <Building2
                        className={"w-3 h-3 shrink-0 text-amber-500/80"}
                      />
                      <span className="truncate">{task.department}</span>
                    </span>
                  )}

                  {task.gpoaEventTitle && (
                    <span
                      className={
                        "inline-flex items-center gap-1 bg-blue-500/10 " +
                        "text-blue-600 dark:text-blue-400 border " +
                        "border-blue-500/20 px-1.5 py-0.5 rounded " +
                        "truncate max-w-[150px]"
                      }
                    >
                      <Calendar
                        className={"w-3 h-3 shrink-0 text-blue-500/80"}
                      />
                      <span className="truncate">{task.gpoaEventTitle}</span>
                    </span>
                  )}

                  {assignee && (
                    <span
                      className={
                        "inline-flex items-center gap-1 bg-secondary/60 " +
                        "border border-white/[0.06] text-muted-foreground " +
                        "px-1.5 py-0.5 rounded truncate max-w-[120px]"
                      }
                    >
                      <UserIcon
                        className={"w-3 h-3 shrink-0 text-muted-foreground/80"}
                      />
                      <span className="truncate">{assignee.fullName}</span>
                    </span>
                  )}
                </div>

                {/* Subtasks Progress Micro-indicator */}
                {task.totalSubtasksCount !== undefined &&
                  task.totalSubtasksCount > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border/60">
                      <div
                        className={
                          "flex items-center justify-between text-[10px] " +
                          "text-muted-foreground mb-1"
                        }
                      >
                        <span className="flex items-center gap-1">
                          <ListTodo className="w-3 h-3 text-primary" />
                          {task.completedSubtasksCount || 0}/
                          {task.totalSubtasksCount} parts done
                        </span>
                        <span className="font-semibold text-foreground">
                          {Math.round(
                            ((task.completedSubtasksCount || 0) /
                              task.totalSubtasksCount) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div
                        className={
                          "w-full bg-secondary/80 h-1.5 rounded-full " +
                          "overflow-hidden"
                        }
                      >
                        <div
                          className={`h-full transition-all duration-300 ${
                            (task.completedSubtasksCount || 0) ===
                            task.totalSubtasksCount
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-primary to-primary/80"
                          }`}
                          style={{
                            width: `${Math.round(
                              ((task.completedSubtasksCount || 0) /
                                task.totalSubtasksCount) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                {/* Accessible Move Quick-Links */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={
                    "mt-3 pt-2 border-t border-border flex " +
                    "items-center " +
                    "justify-between text-[10px]"
                  }
                >
                  <span className="text-muted-foreground text-[9px] uppercase">
                    Move:
                  </span>
                  <div className="flex gap-1.5">
                    {task.status !== "todo" && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(task.id, "todo")}
                        className={
                          "text-muted-foreground hover:text-foreground " +
                          "underline"
                        }
                      >
                        Todo
                      </button>
                    )}
                    {task.status !== "in_progress" && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(task.id, "in_progress")}
                        className={
                          "text-muted-foreground hover:text-foreground " +
                          "underline"
                        }
                      >
                        Prog
                      </button>
                    )}
                    {task.status !== "under_review" && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(task.id, "under_review")}
                        className={
                          "text-muted-foreground hover:text-foreground " +
                          "underline"
                        }
                      >
                        Rev
                      </button>
                    )}
                    {task.status !== "done" && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(task.id, "done")}
                        className="text-foreground font-bold hover:underline"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div
              className={
                "h-28 rounded-lg border border-dashed " +
                "border-border/60 flex items-center justify-center " +
                "text-[11px] text-muted-foreground/60 italic"
              }
            >
              Drop action item here
            </div>
          )}
        </div>
      </div>
    );
  },
);

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<string>("created_at:desc");
  const [sortField, sortOrder] = sortBy.split(":");

  const currentTasksKey = useMemo(
    () => queryKeys.tasksFiltered({ sort_by: sortField, order: sortOrder }),
    [sortField, sortOrder],
  );

  // 1. TanStack Query: instant cached retrieval without DOM destruction
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: currentTasksKey,
    queryFn: () =>
      api.get<Task[]>(`/tasks?sort_by=${sortField}&order=${sortOrder}`),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: queryKeys.users,
    queryFn: () => api.get<User[]>("/users"),
  });

  const { data: events = [] } = useQuery<GPOAEvent[]>({
    queryKey: queryKeys.gpoa,
    queryFn: () => api.get<GPOAEvent[]>("/gpoa"),
  });

  const isLoading = isTasksLoading || isUsersLoading;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const dragOverColRef = useRef<TaskStatus | null>(null);

  // Form (Create Task)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [gpoaEventId, setGpoaEventId] = useState<string | null>(null);
  const [draftSubtasks, setDraftSubtasks] = useState<
    { title: string; assignedToId: string | null }[]
  >([]);
  const [draftSubtaskTitle, setDraftSubtaskTitle] = useState("");
  const [draftSubtaskAssigneeId, setDraftSubtaskAssigneeId] = useState<
    string | null
  >(null);

  // Form (Edit Task)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDepartment, setEditDepartment] = useState<string>("");
  const [editAssignedToId, setEditAssignedToId] = useState<string | null>(null);
  const [editGpoaEventId, setEditGpoaEventId] = useState<string | null>(null);

  // Multidimensional Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>("all");
  const [filterEventId, setFilterEventId] = useState<string>("all");
  const [showConcludedEvents, setShowConcludedEvents] = useState(false);

  // Subtask management in Detail Modal
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssigneeId, setNewSubtaskAssigneeId] = useState<
    string | null
  >(null);

  // Pop-up confirmations
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [subtaskToDelete, setSubtaskToDelete] = useState<{
    taskId: string;
    subtaskId: string;
    title: string;
  } | null>(null);

  const { user, hasPermission } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { showLoader, hideLoader } = useGlobalLoader();
  const { lastEvent } = useSSE();
  const [isExporting, setIsExporting] = useState(false);
  const [isStaleWarningVisible, setIsStaleWarningVisible] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const canManage = hasPermission("manage_tasks");

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "tasks") return;
    const payload = lastEvent.data as any;
    if (
      editDialogOpen &&
      selectedTask &&
      payload?.taskId === selectedTask.id &&
      (payload?.action === "update" || payload?.action === "status_change")
    ) {
      setIsStaleWarningVisible(true);
    }
  }, [lastEvent, editDialogOpen, selectedTask]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        document.activeElement?.getAttribute("contenteditable") === "true";
      if (isInput) return;

      if (
        e.key.toLowerCase() === "c" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        if (canManage) {
          e.preventDefault();
          setDialogOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canManage]);

  const canEditTask = useCallback(
    (t: Task | null) => {
      if (!t) return false;
      if (canManage) return true;
      return Boolean(
        user && (t.createdById === user.id || t.assignedToId === user.id),
      );
    },
    [canManage, user],
  );

  const departmentFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Departments" },
      { value: "none", label: "No Department (General)" },
      ...COUNCIL_DEPARTMENTS.map((dept) => ({
        value: dept,
        label: dept,
      })),
    ],
    [],
  );

  const assigneeFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Assignees" },
      ...(user ? [{ value: "my", label: "Assigned to Me" }] : []),
      { value: "unassigned", label: "Unassigned (Shared)" },
      ...users.map((u) => ({
        value: String(u.id),
        label: u.fullName || u.username || `Officer #${u.id}`,
      })),
    ],
    [users, user],
  );

  const eventFilterOptions = useMemo(
    () => [
      { value: "all", label: "All GPOA Events" },
      { value: "none", label: "Standalone (No Event)" },
      ...events.map((ev) => ({
        value: String(ev.id),
        label: ev.title,
      })),
    ],
    [events],
  );

  const statusOptions = useMemo(
    () => [
      { value: "todo", label: "To Do" },
      { value: "in_progress", label: "In Progress" },
      { value: "under_review", label: "Under Review" },
      { value: "done", label: "Done" },
    ],
    [],
  );

  const departmentModalOptions = useMemo(
    () => [
      { value: "", label: "No Department (General Council Task)" },
      ...COUNCIL_DEPARTMENTS.map((dept) => ({
        value: dept,
        label: dept,
      })),
    ],
    [],
  );

  const userSelectOptions = useMemo(
    () => [
      { value: "", label: "Select Active Officer..." },
      ...users.map((u) => ({
        value: String(u.id),
        label: `${u.fullName || u.username || "Officer"} (${
          u.role?.name || "Officer"
        })`,
      })),
    ],
    [users],
  );

  const subtaskAssigneeOptions = useMemo(
    () => [
      { value: "", label: "Assignee" },
      ...users.map((u) => ({
        value: String(u.id),
        label: u.fullName || u.username || `Officer #${u.id}`,
      })),
    ],
    [users],
  );

  const gpoaModalOptions = useMemo(
    () => [
      { value: "", label: "No GPOA activity linked (Standalone Task)" },
      ...events.map((ev) => ({
        value: String(ev.id),
        label: ev.title,
      })),
    ],
    [events],
  );

  // Keep selectedTask in sync with cache updates
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks, selectedTask?.id]);

  // 2. Optimistic status mutation - 0ms UI response
  const updateStatusMutation = useMutation({
    mutationFn: ({
      taskId,
      newStatus,
    }: {
      taskId: string;
      newStatus: TaskStatus;
    }) => api.patch<Task>(`/tasks/${taskId}/status`, { status: newStatus }),
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      const previousTasks = queryClient.getQueryData<Task[]>(currentTasksKey);
      queryClient.setQueriesData<Task[]>(
        { queryKey: queryKeys.tasks },
        (old = []) =>
          old.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
      return { previousTasks };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(currentTasksKey, context.previousTasks);
      }
      toastError(err.message || "Failed to update task status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const handleUpdateStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      const current = tasks.find((t) => t.id === taskId);
      const oldStatus = current?.status;
      if (!current || oldStatus === newStatus) return;

      updateStatusMutation.mutate(
        { taskId, newStatus },
        {
          onSuccess: () => {
            if (oldStatus) {
              const statusLabel =
                newStatus === "in_progress"
                  ? "In Progress"
                  : newStatus === "under_review"
                    ? "Under Review"
                    : newStatus === "done"
                      ? "Done"
                      : "To Do";
              toastSuccess(`Status moved to ${statusLabel}`, {
                label: "Undo",
                onClick: () => {
                  updateStatusMutation.mutate({
                    taskId,
                    newStatus: oldStatus,
                  });
                },
              });
            }
          },
        },
      );
    },
    [tasks, updateStatusMutation, toastSuccess],
  );

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      setDetailModalOpen(false);
      setSelectedTask(null);
      setTaskToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete task");
    },
  });

  const handleConfirmDeleteTask = () => {
    if (!taskToDelete) return;
    const taskBackup: Task = { ...taskToDelete };
    deleteTaskMutation.mutate(taskToDelete.id, {
      onSuccess: () => {
        toastSuccess("Action item deleted.", {
          label: "Undo",
          onClick: async () => {
            try {
              await api.post("/tasks", {
                title: taskBackup.title,
                description: taskBackup.description || "",
                status: taskBackup.status,
                dueDate: taskBackup.dueDate || null,
                department: taskBackup.department || null,
                assignedToId: taskBackup.assignedToId || null,
                gpoaEventId: taskBackup.gpoaEventId || null,
              });
              queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
              toastSuccess("Action item restored.");
            } catch (err: any) {
              toastError(err.message || "Failed to restore action item");
            }
          },
        });
      },
    });
  };

  const handleOpenEditDialog = (t: Task) => {
    setEditTitle(t.title);
    setEditDescription(t.description || "");
    setEditStatus(t.status);
    setEditDepartment(t.department || "");
    setEditDueDate(
      t.dueDate ? toDateTimeLocalUTC8(t.dueDate).slice(0, 10) : "",
    );
    setEditAssignedToId(t.assignedToId || null);
    setEditGpoaEventId(t.gpoaEventId || null);
    setIsStaleWarningVisible(false);
    setEditDialogOpen(true);
  };

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: {
        title: string;
        description: string;
        status: TaskStatus;
        dueDate: string | null;
        department?: string | null;
        assignedToId: string | null;
        gpoaEventId: string | null;
        version?: number;
      };
    }) => api.patch<Task>(`/tasks/${taskId}`, payload),
    onSuccess: (updatedTask) => {
      queryClient.setQueriesData<Task[]>(
        { queryKey: queryKeys.tasks },
        (old = []) =>
          old.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
      if (selectedTask && selectedTask.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      setEditDialogOpen(false);
      setIsStaleWarningVisible(false);
    },
    onError: (err: any) => {
      if (
        err?.status === 409 ||
        err?.message?.toLowerCase().includes("conflict") ||
        err?.message?.toLowerCase().includes("stale")
      ) {
        setConflictDialogOpen(true);
        return;
      }
      toastError(err.message || "Failed to update action item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const handleEditTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTitle.trim()) return;
    const taskBackup: Task = { ...selectedTask };
    const taskId = selectedTask.id;

    updateTaskMutation.mutate(
      {
        taskId,
        payload: {
          title: editTitle.trim(),
          description: editDescription,
          status: editStatus,
          dueDate: editDueDate ? toISOStringUTC8(editDueDate) : null,
          department: editDepartment || null,
          assignedToId: editAssignedToId,
          gpoaEventId: editGpoaEventId,
          version: selectedTask.version,
        },
      },
      {
        onSuccess: (updatedTask) => {
          toastSuccess("Action item updated.", {
            label: "Undo",
            onClick: async () => {
              try {
                await api.patch(`/tasks/${taskId}`, {
                  title: taskBackup.title,
                  description: taskBackup.description || "",
                  status: taskBackup.status,
                  dueDate: taskBackup.dueDate
                    ? toISOStringUTC8(taskBackup.dueDate)
                    : null,
                  department: taskBackup.department || null,
                  assignedToId: taskBackup.assignedToId || null,
                  gpoaEventId: taskBackup.gpoaEventId || null,
                  version: updatedTask.version,
                });
                queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
                toastSuccess("Changes reverted.");
              } catch (err: any) {
                toastError(err.message || "Failed to revert changes");
              }
            },
          });
        },
      },
    );
  };

  const createTaskMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      status: TaskStatus;
      dueDate?: string | null;
      department?: string | null;
      assignedToId?: string | null;
      gpoaEventId?: string | null;
      subtasks?: { title: string; assignedToId: string | null }[];
    }) => api.post<Task>("/tasks", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setDepartment("");
      setAssignedToId(null);
      setGpoaEventId(null);
      setDraftSubtasks([]);
      setDraftSubtaskTitle("");
      setDraftSubtaskAssigneeId(null);
      toastSuccess("Action item created successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to create task");
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      title,
      description,
      status: "todo",
      dueDate: dueDate ? toISOStringUTC8(dueDate) : null,
      department: department || null,
      assignedToId,
      gpoaEventId,
      subtasks: draftSubtasks,
    });
  };

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({
      taskId,
      subtaskId,
    }: {
      taskId: string;
      subtaskId: string;
    }) => api.patch<Task>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {}),
    onSuccess: (updatedTask) => {
      queryClient.setQueriesData<Task[]>(
        { queryKey: queryKeys.tasks },
        (old = []) =>
          old.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
      if (selectedTask && selectedTask.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to toggle subtask");
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    toggleSubtaskMutation.mutate({ taskId, subtaskId });
  };

  const addSubtaskMutation = useMutation({
    mutationFn: ({
      taskId,
      title: subTitle,
      assignedToId: subAssigneeId,
    }: {
      taskId: string;
      title: string;
      assignedToId: string | null;
    }) =>
      api.post<Task>(`/tasks/${taskId}/subtasks`, {
        title: subTitle,
        assignedToId: subAssigneeId,
      }),
    onSuccess: (updatedTask) => {
      queryClient.setQueriesData<Task[]>(
        { queryKey: queryKeys.tasks },
        (old = []) =>
          old.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
      setSelectedTask(updatedTask);
      setNewSubtaskTitle("");
      setNewSubtaskAssigneeId(null);
      toastSuccess("Subtask deliverable added.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to add subtask item");
    },
  });

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    addSubtaskMutation.mutate({
      taskId: selectedTask.id,
      title: newSubtaskTitle.trim(),
      assignedToId: newSubtaskAssigneeId,
    });
  };

  const deleteSubtaskMutation = useMutation({
    mutationFn: ({
      taskId,
      subtaskId,
    }: {
      taskId: string;
      subtaskId: string;
    }) => api.delete<Task>(`/tasks/${taskId}/subtasks/${subtaskId}`),
    onSuccess: (updatedTask, vars) => {
      queryClient.setQueriesData<Task[]>(
        { queryKey: queryKeys.tasks },
        (old = []) => old.map((t) => (t.id === vars.taskId ? updatedTask : t)),
      );
      if (selectedTask && selectedTask.id === vars.taskId) {
        setSelectedTask(updatedTask);
      }
      setSubtaskToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete subtask item");
    },
  });

  const handleConfirmDeleteSubtask = () => {
    if (!subtaskToDelete) return;
    const backup = { ...subtaskToDelete };
    deleteSubtaskMutation.mutate(
      {
        taskId: subtaskToDelete.taskId,
        subtaskId: subtaskToDelete.subtaskId,
      },
      {
        onSuccess: () => {
          toastSuccess("Subtask deliverable removed.", {
            label: "Undo",
            onClick: () => {
              addSubtaskMutation.mutate({
                taskId: backup.taskId,
                title: backup.title,
                assignedToId: null,
              });
            },
          });
        },
      },
    );
  };

  const isDeleting =
    deleteTaskMutation.isPending || deleteSubtaskMutation.isPending;
  const isSubmittingSubtask = addSubtaskMutation.isPending;

  const eventStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ev of events) {
      map.set(ev.id, ev.status);
    }
    return map;
  }, [events]);

  const concludedTasksCount = useMemo(() => {
    let count = 0;
    for (const t of tasks) {
      if (t.gpoaEventId) {
        const s = eventStatusMap.get(t.gpoaEventId);
        if (s === "completed" || s === "cancelled") {
          count++;
        }
      }
    }
    return count;
  }, [tasks, eventStatusMap]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (query) {
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = (t.description || "").toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      if (departmentFilter !== "all") {
        if (departmentFilter === "none") {
          if (t.department) return false;
        } else {
          if (t.department !== departmentFilter) return false;
        }
      }

      if (filterAssigneeId !== "all") {
        if (filterAssigneeId === "my") {
          if (!user || t.assignedToId !== user.id) return false;
        } else if (filterAssigneeId === "unassigned") {
          if (t.assignedToId) return false;
        } else {
          if (t.assignedToId !== filterAssigneeId) return false;
        }
      }

      if (filterEventId !== "all") {
        if (filterEventId === "none") {
          if (t.gpoaEventId) return false;
        } else {
          if (t.gpoaEventId !== filterEventId) return false;
        }
      } else if (!showConcludedEvents && t.gpoaEventId) {
        const evStatus = eventStatusMap.get(t.gpoaEventId);
        if (evStatus === "completed" || evStatus === "cancelled") {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    departmentFilter,
    filterAssigneeId,
    filterEventId,
    showConcludedEvents,
    eventStatusMap,
    user,
  ]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      under_review: [],
      done: [],
    };
    for (const t of filteredTasks) {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    }
    return map;
  }, [filteredTasks]);

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    departmentFilter !== "all" ||
    filterAssigneeId !== "all" ||
    filterEventId !== "all" ||
    showConcludedEvents;

  const handleClearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setFilterAssigneeId("all");
    setFilterEventId("all");
    setShowConcludedEvents(false);
  };

  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) {
      map.set(u.id, u);
    }
    return map;
  }, [users]);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData(TASK_MIME_TYPE, taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    window.requestAnimationFrame(() => {
      setDraggedTaskId(taskId);
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragOverColRef.current = null;
    setDraggedTaskId(null);
    setDragOverCol(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, colStatus: TaskStatus) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverColRef.current !== colStatus) {
        dragOverColRef.current = colStatus;
        setDragOverCol(colStatus);
      }
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, colStatus: TaskStatus) => {
      e.preventDefault();
      const taskId =
        e.dataTransfer.getData(TASK_MIME_TYPE) ||
        e.dataTransfer.getData("text/plain");
      dragOverColRef.current = null;
      setDraggedTaskId(null);
      setDragOverCol(null);

      if (taskId) {
        const task = tasks.find((t) => t.id === taskId);
        if (task && task.status !== colStatus) {
          await handleUpdateStatus(taskId, colStatus);
        }
      }
    },
    [tasks, handleUpdateStatus],
  );

  const getAssignee = (assignedToId: string | null) => {
    if (!assignedToId) return null;
    return usersMap.get(assignedToId);
  };

  const handleExportTasksCsv = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    showLoader("PREPARING CSV EXPORT...", 25);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (filterAssigneeId !== "all") {
        params.set("assigned_to_id", filterAssigneeId);
      }
      if (departmentFilter !== "all") {
        params.set("department", departmentFilter);
      }
      if (filterEventId !== "all") {
        params.set("gpoa_event_id", filterEventId);
      }

      const queryStr = params.toString();
      const exportUrl = `${API_BASE_URL}/tasks/export${
        queryStr ? `?${queryStr}` : ""
      }`;

      const res = await fetch(exportUrl, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateTag = new Date().toISOString().slice(0, 10);

      link.href = downloadUrl;
      link.download = `tasks_export_${dateTag}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      await hideLoader(true, "CSV EXPORTED");
      toastSuccess("Filtered tasks exported to CSV successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export tasks";
      console.error(`[GetTasksExport] {ClientDownload}: ${msg}`);
      await hideLoader(false, "EXPORT FAILED");
      toastError(msg);
    } finally {
      setIsExporting(false);
    }
  }, [
    isExporting,
    showLoader,
    hideLoader,
    searchQuery,
    departmentFilter,
    filterAssigneeId,
    filterEventId,
    toastSuccess,
    toastError,
  ]);

  return (
    <>
      <Header
        title="Officer Task Tracker"
        subtitle={
          "Interactive Kanban board with drag-and-drop and " +
          "Trello-style detail inspection"
        }
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div
          className={
            "flex flex-col sm:flex-row justify-between items-start " +
            "sm:items-center gap-3"
          }
        >
          <div
            className={"flex items-center gap-2 text-xs text-muted-foreground"}
          >
            <span>Coordinated Action Items</span>
            <span className="text-border">•</span>
            <span className="hidden sm:inline">
              Drag cards between columns to change state
            </span>
          </div>

          <div
            className={
              "flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap"
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportTasksCsv}
              disabled={isExporting}
              className={
                "text-[11px] font-semibold flex items-center " +
                "gap-1.5 h-8 px-3"
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>

            {canManage && (
              <Button
                type="button"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className={
                  "text-[12px] font-semibold tracking-[-0.01em] h-8 px-3 " +
                  "flex items-center gap-1.5"
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Action Item</span>
                <kbd
                  className={
                    "ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono " +
                    "bg-primary-foreground/20 text-primary-foreground " +
                    "select-none"
                  }
                >
                  C
                </kbd>
              </Button>
            )}
          </div>
        </div>

        {/* Multidimensional Filter Toolbar */}
        <div
          className={
            "flex flex-col md:flex-row items-stretch md:items-center " +
            "justify-between gap-3 p-3 rounded-xl border border-border/80 " +
            "bg-card/70 shadow-xs"
          }
        >
          <div
            className={
              "flex flex-1 flex-col sm:flex-row items-stretch " +
              "sm:items-center gap-2.5"
            }
          >
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search action items or deliverables..."
                size="sm"
              />
            </div>

            {/* Filter by Department */}
            <div className="flex items-center gap-1.5 sm:w-48">
              <Select
                size="sm"
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
                options={departmentFilterOptions}
                triggerClassName="bg-background/50"
              />
            </div>

            {/* Filter by Assignee */}
            <div className="flex items-center gap-1.5 sm:w-48">
              <Select
                size="sm"
                value={filterAssigneeId}
                onValueChange={setFilterAssigneeId}
                options={assigneeFilterOptions}
                triggerClassName="bg-background/50"
              />
            </div>

            {/* Filter by GPOA Activity */}
            <div className="flex items-center gap-1.5 sm:w-52">
              <Select
                size="sm"
                value={filterEventId}
                onValueChange={setFilterEventId}
                options={eventFilterOptions}
                triggerClassName="bg-background/50"
              />
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5 sm:w-48">
              <Select
                size="sm"
                value={sortBy}
                onValueChange={setSortBy}
                options={TASK_SORT_OPTIONS}
                triggerClassName="bg-background/50"
              />
            </div>
          </div>

          {/* Active Filter Badge & Reset */}
          {isFiltered && (
            <div
              className={
                "flex items-center justify-between sm:justify-end gap-2 " +
                "shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 " +
                "border-border/60"
              }
            >
              <Badge
                variant="outline"
                className={
                  "text-[10px] font-semibold bg-primary/10 text-primary " +
                  "border-primary/20"
                }
              >
                Filtered: {filteredTasks.length} / {tasks.length}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className={
                  "h-7 px-2 text-[11px] text-muted-foreground " +
                  "hover:text-foreground"
                }
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Concluded Events Lifecycle Notice */}
        {concludedTasksCount > 0 && filterEventId === "all" && (
          <div
            className={
              "flex flex-col sm:flex-row sm:items-center " +
              "justify-between gap-2 px-3.5 py-2.5 rounded-xl border " +
              "border-border/80 bg-card/60 text-xs shadow-2xs"
            }
          >
            <div
              className={
                "flex items-center gap-2 text-muted-foreground min-w-0"
              }
            >
              <Archive className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">
                {showConcludedEvents
                  ? `Showing all tasks, including ${concludedTasksCount} ` +
                    "from concluded GPOA events."
                  : `${concludedTasksCount} action item` +
                    `${concludedTasksCount > 1 ? "s" : ""} from ` +
                    "concluded GPOA events archived from active board."}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const next = !showConcludedEvents;
                setShowConcludedEvents(next);
                if (next) {
                  toastSuccess("Showing tasks from concluded GPOA events.");
                } else {
                  toastSuccess(
                    "Active board restored. Concluded tasks archived.",
                  );
                }
              }}
              className={
                "h-7 px-2.5 text-[11px] font-semibold text-primary " +
                "hover:bg-primary/10 shrink-0 self-start sm:self-auto"
              }
            >
              {showConcludedEvents ? "Hide Concluded" : "View Concluded"}
            </Button>
          </div>
        )}

        {/* Drag and Drop Kanban Board */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.status}
                col={col}
                tasks={tasksByStatus[col.status] || []}
                isOver={dragOverCol === col.status}
                draggedTaskId={draggedTaskId}
                canEditTask={canEditTask}
                usersMap={usersMap}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onSelectTask={handleSelectTask}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trello-Style Clickable Task Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        title={selectedTask ? selectedTask.title : "Action Item Details"}
        description={
          "Inspect full task specifications, constitutional " +
          "assignees, and workflow stage."
        }
        className="max-w-xl"
      >
        {selectedTask && (
          <div className="space-y-4 pt-2">
            {/* Status Switcher & Due Date Bar */}
            <div
              className={
                "flex flex-wrap items-center justify-between " +
                "gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    "text-[11px] uppercase tracking-wider " +
                    "text-muted-foreground font-semibold"
                  }
                >
                  Status:
                </span>
                <Select
                  size="sm"
                  value={selectedTask.status}
                  onValueChange={(val) =>
                    handleUpdateStatus(selectedTask.id, val as TaskStatus)
                  }
                  options={statusOptions}
                  className="w-32"
                  triggerClassName="h-7 px-2 text-xs font-semibold"
                />
              </div>

              {selectedTask.dueDate && (
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "flex items-center gap-1.5 text-xs " +
                      "text-muted-foreground"
                    }
                  >
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Due: {formatDateUTC8(selectedTask.dueDate)}</span>
                  </div>
                  <a
                    href={buildGoogleCalendarUrl({
                      title: `[Action Item] ${selectedTask.title}`,
                      description:
                        `${selectedTask.description || ""}` +
                        `\n\nDeliverables:\n${
                          selectedTask.subtasks
                            ?.map(
                              (st) =>
                                `- [${st.isCompleted ? "x" : " "}] ${st.title}`,
                            )
                            .join("\n") || "None"
                        }`,
                      startTime: selectedTask.dueDate,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      "inline-flex items-center gap-1 px-2 py-1 " +
                      "rounded-md " +
                      "border border-border/70 hover:border-primary/50 " +
                      "bg-secondary/60 hover:bg-primary/10 text-[10px] " +
                      "font-semibold text-foreground transition-all " +
                      "duration-150 shrink-0"
                    }
                    title="Add deadline to Google Calendar"
                  >
                    <Calendar className="w-3 h-3 text-primary" />
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                className={
                  "block text-[11px] font-semibold " + "text-foreground mb-1"
                }
              >
                Description & Deliverables
              </label>
              <div
                className={
                  "p-3 rounded-lg border border-border bg-card/60 " +
                  "text-xs text-foreground min-h-[80px] max-h-56 " +
                  "overflow-y-auto"
                }
              >
                <MarkdownRenderer content={selectedTask.description} />
              </div>
            </div>

            {/* Subtasks / Deliverables Breakdown Checklist */}
            <div
              className={
                "space-y-3 p-3.5 rounded-lg border border-border " +
                "bg-card/60"
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-primary" />
                  <span
                    className={
                      "text-xs font-bold text-foreground uppercase " +
                      "tracking-wider"
                    }
                  >
                    Deliverables & Subtask Breakdown
                  </span>
                </div>
                {selectedTask.totalSubtasksCount !== undefined &&
                  selectedTask.totalSubtasksCount > 0 && (
                    <span className="text-[11px] font-bold text-primary">
                      {selectedTask.completedSubtasksCount || 0} /{" "}
                      {selectedTask.totalSubtasksCount} completed (
                      {Math.round(
                        ((selectedTask.completedSubtasksCount || 0) /
                          selectedTask.totalSubtasksCount) *
                          100,
                      )}
                      %)
                    </span>
                  )}
              </div>

              {selectedTask.totalSubtasksCount !== undefined &&
                selectedTask.totalSubtasksCount > 0 && (
                  <div
                    className={
                      "w-full bg-secondary h-2 rounded-full " +
                      "overflow-hidden"
                    }
                  >
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          ((selectedTask.completedSubtasksCount || 0) /
                            selectedTask.totalSubtasksCount) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                )}

              {/* Subtask list */}
              <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                  selectedTask.subtasks.map((st) => (
                    <div
                      key={st.id}
                      className={
                        "flex items-center justify-between gap-3 p-2.5 " +
                        "rounded-lg border transition-all animate-in " +
                        "fade-in-0 slide-in-from-top-2 duration-200 " +
                        (st.isCompleted
                          ? "bg-secondary/30 border-border/50 " +
                            "text-muted-foreground"
                          : "bg-card border-border text-foreground " +
                            "hover:border-primary/40")
                      }
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleSubtask(selectedTask.id, st.id)
                          }
                          className={
                            "shrink-0 text-primary " +
                            "hover:text-primary/80 " +
                            "transition-transform active:scale-90"
                          }
                        >
                          {st.isCompleted ? (
                            <CheckCircle2
                              className={
                                "w-4 h-4 text-emerald-500 " +
                                "fill-emerald-500/20"
                              }
                            />
                          ) : (
                            <Square
                              className={
                                "w-4 h-4 text-muted-foreground " +
                                "hover:text-foreground"
                              }
                            />
                          )}
                        </button>
                        <span
                          onClick={() =>
                            handleToggleSubtask(selectedTask.id, st.id)
                          }
                          className={
                            "text-xs cursor-pointer select-none " +
                            `truncate ${
                              st.isCompleted
                                ? "line-through text-muted-foreground"
                                : "font-medium text-foreground"
                            }`
                          }
                        >
                          {st.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {st.assignedToName ? (
                          <Pill
                            size="sm"
                            className={
                              "gap-1 text-[10px] bg-blue-500/10 " +
                              "text-blue-600 dark:text-blue-400 " +
                              "border-blue-500/20"
                            }
                          >
                            <UserCheck className="w-3 h-3 shrink-0" />
                            <span className="max-w-[120px] truncate">
                              {st.assignedToName}
                            </span>
                          </Pill>
                        ) : (
                          <span
                            className={
                              "text-[10px] text-muted-foreground/70 italic"
                            }
                          >
                            Unassigned
                          </span>
                        )}

                        {canEditTask(selectedTask) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setSubtaskToDelete({
                                taskId: selectedTask.id,
                                subtaskId: st.id,
                                title: st.title,
                              })
                            }
                            title="Remove subtask"
                            aria-label="Remove subtask"
                            className={
                              "h-7 w-7 min-h-[28px] min-w-[28px] shrink-0 " +
                              "text-muted-foreground hover:text-rose-500 " +
                              "hover:bg-rose-500/10"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className={
                      "p-3 rounded-lg border border-dashed " +
                      "border-border/80 text-center text-xs " +
                      "text-muted-foreground"
                    }
                  >
                    No subtasks added yet. Add one below to track granular
                    deliverables.
                  </div>
                )}
              </div>

              {/* Add Subtask Form */}
              {canEditTask(selectedTask) && (
                <form
                  onSubmit={handleAddSubtask}
                  className={
                    "p-2.5 rounded-lg border border-border " +
                    "bg-secondary/30 space-y-2 mt-2"
                  }
                >
                  <span
                    className={
                      "block text-[10px] font-semibold uppercase " +
                      "tracking-wider text-muted-foreground"
                    }
                  >
                    Subtask Deliverable
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="e.g. Design posters, Draft letter..."
                      className="h-9 sm:h-8 text-base sm:text-xs flex-1"
                      required
                    />
                    <Select
                      size="sm"
                      value={newSubtaskAssigneeId || ""}
                      onValueChange={(val) =>
                        setNewSubtaskAssigneeId(val || null)
                      }
                      options={subtaskAssigneeOptions}
                      className="sm:w-48"
                      triggerClassName="h-9 sm:h-8"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingSubtask || !newSubtaskTitle.trim()}
                      className="h-9 sm:h-8 text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Part
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Assignee & Creator Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg border border-border bg-card/40">
                <span
                  className={
                    "block text-[10px] uppercase tracking-wider " +
                    "text-muted-foreground mb-1.5 font-semibold"
                  }
                >
                  Person Responsible (Assignee)
                </span>
                {(() => {
                  const assignee = getAssignee(selectedTask.assignedToId);
                  if (assignee) {
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className={
                            "w-7 h-7 rounded-full bg-primary/10 border " +
                            "border-primary/20 flex items-center " +
                            "justify-center text-primary font-bold text-xs"
                          }
                        >
                          {assignee.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {assignee.fullName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {assignee.role?.name || assignee.email}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <span className="text-xs text-muted-foreground italic">
                      Unassigned (Council Shared)
                    </span>
                  );
                })()}
              </div>

              <div className="p-3 rounded-lg border border-border bg-card/40">
                <span
                  className={
                    "block text-[10px] uppercase tracking-wider " +
                    "text-muted-foreground mb-1.5 font-semibold"
                  }
                >
                  Action Item Metadata
                </span>
                <p className="text-xs text-muted-foreground">
                  ID: #{selectedTask.id}
                </p>
                {selectedTask.department && (
                  <p
                    className={
                      "text-[11px] text-amber-600 dark:text-amber-400 " +
                      "mt-1 flex items-center gap-1 font-semibold"
                    }
                  >
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span>Dept: {selectedTask.department}</span>
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Created: {formatDateUTC8(selectedTask.createdAt)}
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div
              className={
                "flex justify-between items-center pt-3 border-t " +
                "border-border"
              }
            >
              {canEditTask(selectedTask) ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(selectedTask)}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTaskToDelete(selectedTask)}
                    className={
                      "text-rose-600 hover:text-rose-700 " +
                      "hover:bg-rose-500/10 border-rose-500/30 text-xs " +
                      "flex items-center gap-1.5"
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </Button>
                </div>
              ) : (
                <div />
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Action Item"
        description={
          "Update specifications, assignee, and schedule for " + "this task."
        }
      >
        <form onSubmit={handleEditTaskSubmit} className="space-y-3">
          {isStaleWarningVisible && (
            <div
              className={
                "flex items-center justify-between gap-2 p-2.5 rounded-xl " +
                "border border-amber-500/40 bg-amber-500/10 " +
                "text-amber-600 dark:text-amber-400 text-xs " +
                "animate-in fade-in-0 duration-200"
              }
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                <span>May bagong pagbabago mula sa kabilang device!</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!selectedTask) return;
                  try {
                    const fresh = await api.get<Task>(
                      `/tasks/${selectedTask.id}`,
                    );
                    setSelectedTask(fresh);
                    setEditTitle(fresh.title);
                    setEditDescription(fresh.description || "");
                    setEditStatus(fresh.status);
                    setEditDueDate(
                      fresh.dueDate
                        ? toDateTimeLocalUTC8(fresh.dueDate).slice(0, 10)
                        : "",
                    );
                    setEditDepartment(fresh.department || "");
                    setEditAssignedToId(fresh.assignedToId || null);
                    setEditGpoaEventId(fresh.gpoaEventId || null);
                    setIsStaleWarningVisible(false);
                    toastSuccess("Na-refresh ang pinakabagong bersyon.");
                  } catch (err: any) {
                    toastError(err.message || "Failed to reload task");
                  }
                }}
                className="h-7 text-xs border-amber-500/40 shrink-0"
              >
                I-refresh
              </Button>
            </div>
          )}
          <div>
            <label
              className={
                "block text-[11px] font-semibold " + "text-foreground mb-1"
              }
            >
              Task Title
            </label>
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              placeholder="e.g. Draft Memorandum of Agreement"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold " + "text-foreground mb-1"
                }
              >
                Status
              </label>
              <Select
                value={editStatus}
                onValueChange={(val) => setEditStatus(val as TaskStatus)}
                options={statusOptions}
                triggerClassName="h-8"
              />
            </div>

            <div>
              <label
                className={
                  "block text-[11px] font-semibold " + "text-foreground mb-1"
                }
              >
                Department / Committee
              </label>
              <Select
                value={editDepartment}
                onValueChange={setEditDepartment}
                options={departmentModalOptions}
                placeholder="No Department (General)"
                triggerClassName="h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold " + "text-foreground mb-1"
                }
              >
                Person Responsible (Assignee)
              </label>
              <Select
                value={editAssignedToId || ""}
                onValueChange={(val) => setEditAssignedToId(val || null)}
                options={userSelectOptions}
                placeholder="Select Active Officer..."
                triggerClassName="h-8"
              />
            </div>

            <div>
              <label
                className={
                  "block text-[11px] font-semibold " + "text-foreground mb-1"
                }
              >
                Due Date
              </label>
              <DatePicker
                value={editDueDate}
                onChange={setEditDueDate}
                placeholder="Pick due date"
              />
            </div>
          </div>

          <div>
            <label
              className={
                "block text-[11px] font-semibold " + "text-foreground mb-1"
              }
            >
              Associated GPOA Activity (Optional)
            </label>
            <Select
              value={editGpoaEventId || ""}
              onValueChange={(val) => setEditGpoaEventId(val || null)}
              options={gpoaModalOptions}
              placeholder="No GPOA activity linked (Standalone Task)"
              triggerClassName="h-8"
            />
          </div>

          <MarkdownTextarea
            label="Description"
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Provide context and requirements..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[200px]"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateTaskMutation.isPending || !editTitle.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      <ConflictResolutionDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        entityName="Task"
        draftContentToCopy={`Title: ${editTitle}\nDescription: ${editDescription}`}
        onReloadLatest={async () => {
          if (!selectedTask) return;
          try {
            const fresh = await api.get<Task>(`/tasks/${selectedTask.id}`);
            setSelectedTask(fresh);
            setEditTitle(fresh.title);
            setEditDescription(fresh.description || "");
            setEditStatus(fresh.status);
            setEditDueDate(
              fresh.dueDate
                ? toDateTimeLocalUTC8(fresh.dueDate).slice(0, 10)
                : "",
            );
            setEditDepartment(fresh.department || "");
            setEditAssignedToId(fresh.assignedToId || null);
            setEditGpoaEventId(fresh.gpoaEventId || null);
            setIsStaleWarningVisible(false);
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            toastSuccess("Na-load ang pinakabagong bersyon.");
          } catch (err: any) {
            toastError(err.message || "Failed to reload task");
          }
        }}
      />

      {/* Create Task Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create Action Item"
        description={
          "Assigned action items streamline workflow across " +
          "council members."
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-3">
          <div>
            <label
              className={
                "block text-[11px] font-semibold " + "text-foreground mb-1"
              }
            >
              Task Title
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Draft Memorandum of Agreement"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold " + "text-foreground mb-1"
                }
              >
                Department / Committee
              </label>
              <Select
                value={department}
                onValueChange={setDepartment}
                options={departmentModalOptions}
                placeholder="No Department (General)"
                triggerClassName="h-8"
              />
            </div>

            <div>
              <label
                className={
                  "block text-[11px] font-semibold " + "text-foreground mb-1"
                }
              >
                Person Responsible (Assignee)
              </label>
              <Select
                value={assignedToId || ""}
                onValueChange={(val) => setAssignedToId(val || null)}
                options={userSelectOptions}
                placeholder="Select Active Officer..."
                triggerClassName="h-8"
              />
            </div>
          </div>

          <div>
            <label
              className={
                "block text-[11px] font-semibold " + "text-foreground mb-1"
              }
            >
              Associated GPOA Activity (Optional)
            </label>
            <Select
              value={gpoaEventId || ""}
              onValueChange={(val) => setGpoaEventId(val || null)}
              options={gpoaModalOptions}
              placeholder="No GPOA activity linked (Standalone Task)"
              triggerClassName="h-8"
            />
          </div>

          <MarkdownTextarea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Provide context and requirements..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[200px]"
          />

          <div>
            <label
              className={
                "block text-[11px] font-semibold " + "text-foreground mb-1"
              }
            >
              Due Date
            </label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder="Pick due date"
            />
          </div>

          {/* Draft Subtasks Section */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="block text-[11px] font-semibold text-foreground">
              Subtasks & Granular Deliverables (Optional)
            </label>

            {draftSubtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {draftSubtasks.map((st, idx) => {
                  const assignedUser = users.find(
                    (u) => u.id === st.assignedToId,
                  );
                  return (
                    <div
                      key={idx}
                      className={
                        "flex items-center justify-between text-xs " +
                        "bg-secondary/50 p-2 rounded border " +
                        "border-border animate-in fade-in-0 " +
                        "slide-in-from-top-1 duration-200"
                      }
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={
                            "text-muted-foreground text-[10px] " +
                            "font-semibold"
                          }
                        >
                          #{idx + 1}
                        </span>
                        <span className="truncate">{st.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={
                            "text-[10px] px-1.5 py-0.5 rounded " +
                            "bg-blue-500/10 text-blue-600 " +
                            "dark:text-blue-400"
                          }
                        >
                          {assignedUser ? assignedUser.fullName : "Unassigned"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSubtasks((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                value={draftSubtaskTitle}
                onChange={(e) => setDraftSubtaskTitle(e.target.value)}
                placeholder="Subtask name (e.g. Venue booking)"
                className="h-8 text-xs flex-1"
              />
              <Select
                size="sm"
                value={draftSubtaskAssigneeId || ""}
                onValueChange={(val) => setDraftSubtaskAssigneeId(val || null)}
                options={[
                  { value: "", label: "Assign to..." },
                  ...subtaskAssigneeOptions.filter((o) => o.value !== ""),
                ]}
                className="sm:w-44"
                triggerClassName="h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!draftSubtaskTitle.trim()) return;
                  setDraftSubtasks((prev) => [
                    ...prev,
                    {
                      title: draftSubtaskTitle.trim(),
                      assignedToId: draftSubtaskAssigneeId,
                    },
                  ]);
                  setDraftSubtaskTitle("");
                  setDraftSubtaskAssigneeId(null);
                }}
                disabled={!draftSubtaskTitle.trim()}
                className="h-8 text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Part
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Item
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirm Delete Task Pop-up */}
      <ConfirmDialog
        open={!!taskToDelete}
        title="Delete Action Item?"
        description={
          `Are you sure you want to delete "${taskToDelete?.title}"? ` +
          "This action cannot be undone and will permanently remove all " +
          "associated deliverables."
        }
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteTask}
        onClose={() => setTaskToDelete(null)}
      />

      {/* Confirm Delete Subtask Pop-up */}
      <ConfirmDialog
        open={!!subtaskToDelete}
        title="Remove Subtask Deliverable?"
        description={
          `Are you sure you want to remove the deliverable ` +
          `"${subtaskToDelete?.title}" from this action item?`
        }
        confirmText="Remove Subtask"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteSubtask}
        onClose={() => setSubtaskToDelete(null)}
      />
    </>
  );
};
