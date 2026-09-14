import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Edit3,
  ExternalLink,
  MapPin,
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
import { SearchBar } from "@/components/ui/SearchBar";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import type { GPOAEvent } from "@/types";

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

export const GPOAPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_gpoa");

  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GPOAEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<GPOAEvent | null>(null);

  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [syncToGoogle, setSyncToGoogle] = useState(true);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTargetAudience, setEditTargetAudience] = useState("");

  // TanStack Query
  const { data: events = [], isLoading } = useQuery<GPOAEvent[]>({
    queryKey: queryKeys.gpoa,
    queryFn: () => api.get<GPOAEvent[]>("/gpoa"),
  });

  // Create Mutation
  const createEventMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<GPOAEvent>("/gpoa", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gpoa });
      setCreateDialogOpen(false);
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setTargetAudience("");
      setSyncToGoogle(true);
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
    setEditStartTime(formatForDateTimeLocal(event.startTime));
    setEditEndTime(formatForDateTimeLocal(event.endTime));
    setEditLocation(event.location || "");
    setEditTargetAudience(event.targetAudience || "");
    setEditDialogOpen(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate({
      title,
      description,
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
        startTime: new Date(editStartTime).toISOString(),
        endTime: new Date(editEndTime).toISOString(),
        location: editLocation,
        targetAudience: editTargetAudience || "All CS Students",
      },
    });
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        (ev.description && ev.description.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.targetAudience && ev.targetAudience.toLowerCase().includes(q)),
    );
  }, [events, searchQuery]);

  return (
    <>
      <Header
        title="General Plan of Activities (GPOA)"
        subtitle="Annual timeline and 1-click Google Calendar integration"
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

            {canManage && (
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="text-xs font-semibold shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Plan Activity
              </Button>
            )}
          </div>
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
              {searchQuery
                ? `No GPOA activities match "${searchQuery}".`
                : "No GPOA activities scheduled yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="flex flex-col justify-between">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase font-semibold"
                    >
                      {event.targetAudience}
                    </Badge>

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

                  <div
                    className={
                      "mt-4 pt-3 border-t border-border flex flex-col " +
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
            ))}
          </div>
        )}
      </div>

      {/* Create Activity Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Schedule GPOA Activity"
        description={
          "Event will be saved to Postgres and synced to " + "Google Calendar."
        }
      >
        <form onSubmit={handleCreateEvent} className="space-y-3">
          <div>
            <label
              className={"block text-[11px] font-semibold text-foreground mb-1"}
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

          <MarkdownTextarea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Agenda flow, deliverables, and objectives..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[200px]"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Start Time
              </label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
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
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
          "Update scheduled activity timeline, location, " + "or objectives."
        }
      >
        <form onSubmit={handleUpdateEvent} className="space-y-3">
          <div>
            <label
              className={"block text-[11px] font-semibold text-foreground mb-1"}
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

          <MarkdownTextarea
            label="Description"
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Agenda flow, deliverables, and objectives..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[200px]"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "block text-[11px] font-semibold text-foreground mb-1"
                }
              >
                Start Time
              </label>
              <Input
                type="datetime-local"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
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
              <Input
                type="datetime-local"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
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
    </>
  );
};
