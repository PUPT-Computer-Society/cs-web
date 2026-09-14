import React, { useState } from "react";
import { Mail, Plus } from "lucide-react";
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
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import type { Announcement, AnnouncementScope } from "@/types";

const PAGE_SIZE = 6;
const ANNOUNCEMENT_SCOPE_OPTIONS = [
  { value: "general", label: "General Announcement" },
  { value: "communications", label: "Communications & Socials" },
  { value: "external_partnership", label: "External Partnership" },
];

export const AnnouncementsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeScope, setActiveScope] = useState<"all" | AnnouncementScope>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<AnnouncementScope | "">("");
  const [dispatchGmail, setDispatchGmail] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState("");

  const { hasPermission } = useAuth();
  const canPublish = hasPermission("publish_announcements");

  // TanStack Query
  const endpoint =
    activeScope === "all"
      ? "/announcements"
      : `/announcements?scope=${activeScope}`;
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: queryKeys.announcements(activeScope),
    queryFn: () => api.get<Announcement[]>(endpoint),
  });

  // Mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: (newAnnouncement: Record<string, unknown>) =>
      api.post("/announcements", newAnnouncement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setDialogOpen(false);
      setTitle("");
      setContent("");
      setScope("");
      setDispatchGmail(false);
      setRecipientEmails("");
      toastSuccess("Announcement published successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to post announcement");
    },
  });

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = dispatchGmail
      ? recipientEmails
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    createAnnouncementMutation.mutate({
      title,
      content,
      scope: scope || "general",
      dispatchGmail,
      recipientEmails: emailList,
    });
  };

  const handleScopeChange = (newScope: "all" | AnnouncementScope) => {
    setActiveScope(newScope);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedAnnouncements = announcements.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <>
      <Header
        title="Announcements & Communications"
        subtitle="Executive notices, external partnership memos, and communications dispatch"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Scope Filters */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/40">
            {(
              [
                { id: "all", label: "All Feeds" },
                { id: "general", label: "General" },
                { id: "communications", label: "Communications" },
                { id: "external_partnership", label: "External" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => handleScopeChange(filter.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeScope === filter.id
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {canPublish && (
            <Button
              type="button"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="text-[11px] font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Compose Notice
            </Button>
          )}
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card">
            <p className="text-xs text-muted-foreground">
              No notices published under this scope.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedAnnouncements.map((item) => (
              <Card
                key={item.id}
                className="border-border/80 bg-card/80 backdrop-blur-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 animate-in fade-in-0 slide-in-from-top-2 duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-semibold uppercase"
                      >
                        {item.scope.replace("_", " ")}
                      </Badge>
                      {item.sentViaEmail && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          Gmail Dispatched
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground">
                    {item.title}
                  </h4>
                  <div className="mt-2 text-xs leading-relaxed">
                    <MarkdownRenderer content={item.content} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {announcements.length > 0 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalItems={announcements.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Compose Official Notice"
        description="Optionally dispatch to officer inboxes via Gmail API."
      >
        <form onSubmit={handlePublish} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Headline / Subject
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Partnership Confirmation with Industry Sponsor"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Scope
            </label>
            <Select
              value={scope}
              placeholder="Select Announcement Scope..."
              onValueChange={(val) => setScope(val as AnnouncementScope)}
              options={ANNOUNCEMENT_SCOPE_OPTIONS}
            />
          </div>

          <MarkdownTextarea
            label="Content"
            value={content}
            onChange={setContent}
            required
            placeholder="Official announcement body..."
            minHeight="min-h-[100px]"
            maxHeight="max-h-[250px]"
          />

          <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
            <div className="flex items-center gap-2">
              <input
                id="dispatch-gmail"
                type="checkbox"
                checked={dispatchGmail}
                onChange={(e) => setDispatchGmail(e.target.checked)}
                className="rounded border-input text-foreground focus:ring-ring"
              />
              <label
                htmlFor="dispatch-gmail"
                className="text-xs font-mono font-semibold text-foreground"
              >
                Dispatch via Gmail API to officer inboxes
              </label>
            </div>

            {dispatchGmail && (
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground mb-1">
                  Recipient Emails (comma separated)
                </label>
                <Input
                  type="text"
                  value={recipientEmails}
                  onChange={(e) => setRecipientEmails(e.target.value)}
                  placeholder="e.g. officers@csorg.edu, team@csorg.edu"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createAnnouncementMutation.isPending}
            >
              {createAnnouncementMutation.isPending
                ? "Publishing..."
                : "Publish Notice"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
};
