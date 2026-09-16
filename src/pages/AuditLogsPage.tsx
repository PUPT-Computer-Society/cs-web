import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { formatDateTimeUTC8 } from "@/lib/dateUtils";
import type {
  AuditLogEntry,
  AuditLogsResponse,
  LogCategory,
  LogSeverity,
} from "@/types";

const SEVERITY_OPTIONS = [
  { value: "", label: "All Severities" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
  { value: "critical", label: "Critical" },
];

const AUDIT_LOG_SORT_OPTIONS = [
  { value: "created_at:desc", label: "Date (Newest first)" },
  { value: "created_at:asc", label: "Date (Oldest first)" },
  { value: "severity:desc", label: "Severity (Critical first)" },
  { value: "action:asc", label: "Action (A-Z)" },
];

function getCategoryBadge(category: LogCategory) {
  switch (category) {
    case "security":
      return (
        <Badge
          className={cn(
            "bg-purple-500/15 text-purple-600",
            "dark:text-purple-400 border-purple-500/30",
            "uppercase text-[10px] font-bold tracking-wide",
          )}
        >
          Security
        </Badge>
      );
    case "system":
      return (
        <Badge
          className={cn(
            "bg-cyan-500/15 text-cyan-600",
            "dark:text-cyan-400 border-cyan-500/30",
            "uppercase text-[10px] font-bold tracking-wide",
          )}
        >
          System
        </Badge>
      );
    default:
      return (
        <Badge
          className={cn(
            "bg-emerald-500/15 text-emerald-600",
            "dark:text-emerald-400 border-emerald-500/30",
            "uppercase text-[10px] font-bold tracking-wide",
          )}
        >
          Audit
        </Badge>
      );
  }
}

function getSeverityBadge(severity: LogSeverity) {
  switch (severity) {
    case "critical":
    case "error":
      return (
        <Badge variant="destructive" className="capitalize text-[10px]">
          {severity}
        </Badge>
      );
    case "warning":
      return (
        <Badge
          className={cn(
            "bg-amber-500/15 text-amber-600 dark:text-amber-400",
            "border-amber-500/30 capitalize text-[10px]",
          )}
        >
          {severity}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="capitalize text-[10px]">
          {severity}
        </Badge>
      );
  }
}

export const AuditLogsPage: React.FC = () => {
  const { isPresident } = useAuth();
  const { success: toastSuccess } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at:desc");
  const [searchInput, setSearchInput] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [sortField, sortOrder] = sortBy.split(":");

  const queryParams = {
    category: categoryFilter || undefined,
    severity: severityFilter || undefined,
    search: activeSearch || undefined,
    sort_by: sortField,
    order: sortOrder,
    page: currentPage,
    pageSize: 15,
  };

  const { data, isLoading, isRefetching, refetch } =
    useQuery<AuditLogsResponse>({
      queryKey: queryKeys.auditLogs(queryParams),
      queryFn: () => {
        const sp = new URLSearchParams();
        if (categoryFilter) sp.append("category", categoryFilter);
        if (severityFilter) sp.append("severity", severityFilter);
        if (activeSearch) sp.append("search", activeSearch);
        sp.append("sort_by", sortField);
        sp.append("order", sortOrder);
        sp.append("page", String(currentPage));
        sp.append("page_size", "15");
        return api.get<AuditLogsResponse>(`/audit-logs?${sp.toString()}`);
      },
      enabled: !!isPresident,
    });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  const handleSeverityChange = (sev: string) => {
    setSeverityFilter(sev);
    setCurrentPage(1);
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    const jsonStr = JSON.stringify(selectedLog, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    toastSuccess("JSON payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isPresident) {
    return (
      <>
        <Header title="Audit & System Logs" />
        <div className="p-8 max-w-xl mx-auto text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-muted-foreground text-sm">
            Only the President has authorization to inspect organization audit
            trails, security dispatches, and system diagnostic telemetry.
          </p>
        </div>
      </>
    );
  }

  const summary = data?.summary;
  const items = data?.items || [];
  const totalItems = data?.total || 0;

  return (
    <>
      <Header
        title="Audit & Telemetry Logs"
        subtitle={
          "Live monitoring of user actions, security triggers, and " +
          "system state."
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
          <Card className="rounded-2xl border border-border/80 shadow-xs">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl bg-primary/10",
                  "text-primary shrink-0",
                )}
              >
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] sm:text-xs text-muted-foreground",
                    "font-medium truncate",
                  )}
                >
                  Total Telemetry
                </p>
                <p className="text-lg sm:text-xl font-black text-foreground">
                  {isLoading ? "..." : (summary?.total ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/80 shadow-xs">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl bg-emerald-500/10",
                  "text-emerald-500 shrink-0",
                )}
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] sm:text-xs text-muted-foreground",
                    "font-medium truncate",
                  )}
                >
                  Audit Actions
                </p>
                <p className="text-lg sm:text-xl font-black text-foreground">
                  {isLoading ? "..." : (summary?.audit ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/80 shadow-xs">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl bg-purple-500/10",
                  "text-purple-500 shrink-0",
                )}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] sm:text-xs text-muted-foreground",
                    "font-medium truncate",
                  )}
                >
                  Security Events
                </p>
                <p className="text-lg sm:text-xl font-black text-foreground">
                  {isLoading ? "..." : (summary?.security ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/80 shadow-xs">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
              <div
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl bg-destructive/10",
                  "text-destructive shrink-0",
                )}
              >
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] sm:text-xs text-muted-foreground",
                    "font-medium truncate",
                  )}
                >
                  Errors / Alerts
                </p>
                <p className="text-lg sm:text-xl font-black text-foreground">
                  {isLoading ? "..." : (summary?.errors ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="rounded-2xl border border-border/80 shadow-xs">
          <CardContent className="p-4 space-y-4">
            {/* Category Tabs */}
            <div
              className={
                "flex flex-col sm:flex-row items-stretch sm:items-center " +
                "justify-between gap-2.5 sm:gap-3"
              }
            >
              <div
                className={cn(
                  "flex items-center gap-1.5 p-1 overflow-x-auto",
                  "rounded-xl bg-secondary/50 border border-border/50",
                  "text-xs no-scrollbar",
                )}
              >
                {[
                  { key: "", label: "All Telemetry" },
                  { key: "audit", label: "Audit" },
                  { key: "security", label: "Security" },
                  { key: "system", label: "System" },
                ].map((tab) => {
                  const active = categoryFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleCategoryChange(tab.key)}
                      className={cn(
                        "px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-0",
                        "rounded-lg font-semibold transition-all",
                        "whitespace-nowrap shrink-0 flex items-center",
                        active
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className={cn(
                  "gap-2 rounded-xl text-xs h-10 sm:h-9 shrink-0",
                  "w-full sm:w-auto justify-center",
                )}
              >
                <RefreshCw
                  className={cn(
                    "w-3.5 h-3.5",
                    isRefetching && "animate-spin text-primary",
                  )}
                />
                Refresh
              </Button>
            </div>

            {/* Search and Severity Filter */}
            <div
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
                "gap-2.5 sm:gap-3",
              )}
            >
              <form
                onSubmit={handleSearchSubmit}
                className="sm:col-span-2 relative flex items-center"
              >
                <Search
                  className={cn(
                    "absolute left-3 w-4 h-4 text-muted-foreground",
                    "pointer-events-none",
                  )}
                />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search actions, actor name, or resource..."
                  className="pl-9 pr-20 h-10 rounded-xl text-xs sm:text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "absolute right-1.5 min-h-[32px] h-8 px-3 rounded-lg",
                    "text-xs font-semibold",
                  )}
                >
                  Search
                </Button>
              </form>

              <div>
                <Select
                  options={SEVERITY_OPTIONS}
                  value={severityFilter}
                  onValueChange={handleSeverityChange}
                  placeholder="All Severities"
                  triggerClassName="h-10 rounded-xl text-xs"
                />
              </div>

              <div>
                <Select
                  options={AUDIT_LOG_SORT_OPTIONS}
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                  triggerClassName="h-10 rounded-xl text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table / Listing */}
        <Card
          className={cn(
            "rounded-2xl border border-border/80 shadow-xs overflow-hidden",
          )}
        >
          {/* Mobile Feed (< sm) */}
          <div className="sm:hidden divide-y divide-border/50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-4 space-y-2.5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground font-sans">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">No telemetry records</p>
                <p className="text-xs">
                  No logs match your selected filter criteria.
                </p>
              </div>
            ) : (
              items.map((log) => {
                const isErrorStatus = log.statusCode >= 400;
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "p-3.5 sm:p-4 space-y-2.5 hover:bg-secondary/30",
                      "transition-colors",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getSeverityBadge(log.severity)}
                        {getCategoryBadge(log.category)}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-sans text-muted-foreground",
                          "whitespace-nowrap shrink-0",
                        )}
                      >
                        {formatDateTimeUTC8(log.createdAt)}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p
                        className={cn(
                          "font-semibold text-foreground text-xs",
                          "leading-snug break-words",
                        )}
                      >
                        {log.action}
                      </p>
                      {log.resourceType && (
                        <p
                          className={cn(
                            "text-[11px] text-muted-foreground font-mono",
                            "truncate",
                          )}
                        >
                          target: {log.resourceType}
                          {log.resourceId ? ` / ${log.resourceId}` : ""}
                        </p>
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 pt-1",
                        "border-t border-border/40",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 min-w-0 font-sans",
                          "text-xs",
                        )}
                      >
                        <span
                          className={cn(
                            "font-semibold text-foreground truncate",
                            "max-w-[130px]",
                          )}
                        >
                          {log.actorName || "System / Anon"}
                        </span>
                        <Badge
                          variant={isErrorStatus ? "destructive" : "outline"}
                          className={cn(
                            "font-mono text-[10px] px-1.5 py-0.5 shrink-0",
                          )}
                        >
                          {log.statusCode}
                        </Badge>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className={cn(
                          "min-h-[36px] h-9 px-3 text-xs gap-1.5 shrink-0",
                          "rounded-xl cursor-pointer font-medium",
                        )}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={cn(
                  "bg-secondary/40 border-b border-border/60",
                  "text-xs text-muted-foreground uppercase font-semibold",
                )}
              >
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Action / Resource</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-28 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-16 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-14 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-40 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-24 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-10 rounded-md" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Skeleton className="h-8 w-16 ml-auto rounded-md" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className={cn(
                        "py-12 text-center text-muted-foreground font-sans",
                      )}
                    >
                      <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-sm">
                        No telemetry records
                      </p>
                      <p className="text-xs">
                        No logs match your selected filter criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((log) => {
                    const isErrorStatus = log.statusCode >= 400;
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td
                          className={
                            "py-3 px-4 whitespace-nowrap text-muted-foreground"
                          }
                        >
                          {formatDateTimeUTC8(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getCategoryBadge(log.category)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getSeverityBadge(log.severity)}
                        </td>
                        <td className="py-3 px-4">
                          <div
                            className={cn(
                              "font-semibold text-foreground truncate",
                              "max-w-md",
                            )}
                          >
                            {log.action}
                          </div>
                          {log.resourceType && (
                            <div
                              className={
                                "text-[11px] text-muted-foreground truncate"
                              }
                            >
                              target: {log.resourceType}
                              {log.resourceId ? ` / ${log.resourceId}` : ""}
                            </div>
                          )}
                        </td>
                        <td
                          className={
                            "py-3 px-4 whitespace-nowrap font-sans text-xs"
                          }
                        >
                          {log.actorName ? (
                            <span className="font-semibold text-foreground">
                              {log.actorName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              System / Anonymous
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant={isErrorStatus ? "destructive" : "outline"}
                            className="font-mono text-[11px] px-1.5 py-0.5"
                          >
                            {log.statusCode}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className={
                              "min-h-[36px] px-2.5 rounded-lg text-xs gap-1 " +
                              "cursor-pointer"
                            }
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalItems > 15 && (
            <div
              className={
                "p-4 border-t border-border/60 flex justify-center " +
                "w-full min-w-0"
              }
            >
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={15}
                onPageChange={(p) => setCurrentPage(p)}
                className="w-full border-t-0 pt-0"
              />
            </div>
          )}
        </Card>

        {/* JSON Detail Inspector Modal */}
        <Dialog
          open={Boolean(selectedLog)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedLog(null);
          }}
          title="Telemetry Record Details"
          className="max-w-2xl w-[95vw] sm:w-full"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div
                  className={cn(
                    "p-2.5 rounded-xl bg-secondary/40 border",
                    "border-border/50",
                  )}
                >
                  <span className="text-muted-foreground font-medium block">
                    Action
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold text-foreground break-all",
                    )}
                  >
                    {selectedLog.action}
                  </span>
                </div>
                <div
                  className={cn(
                    "p-2.5 rounded-xl bg-secondary/40 border",
                    "border-border/50",
                  )}
                >
                  <span className="text-muted-foreground font-medium block">
                    Timestamp (UTC+8)
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatDateTimeUTC8(selectedLog.createdAt)}
                  </span>
                </div>
                <div
                  className={cn(
                    "p-2.5 rounded-xl bg-secondary/40 border",
                    "border-border/50",
                  )}
                >
                  <span className="text-muted-foreground font-medium block">
                    Client IP Address
                  </span>
                  <span className="font-mono text-foreground break-all">
                    {selectedLog.ipAddress || "Unknown"}
                  </span>
                </div>
                <div
                  className={cn(
                    "p-2.5 rounded-xl bg-secondary/40 border",
                    "border-border/50",
                  )}
                >
                  <span className="text-muted-foreground font-medium block">
                    Actor UUID
                  </span>
                  <span className="font-mono text-foreground break-all block">
                    {selectedLog.actorId || "N/A"}
                  </span>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div
                  className={cn(
                    "p-2.5 rounded-xl bg-secondary/40 border",
                    "border-border/50 text-xs",
                  )}
                >
                  <span className="text-muted-foreground font-medium block">
                    User Agent
                  </span>
                  <span
                    className={cn(
                      "font-mono text-muted-foreground text-[11px] break-all",
                    )}
                  >
                    {selectedLog.userAgent}
                  </span>
                </div>
              )}

              {/* Raw JSON Details Block */}
              <div className="space-y-1.5">
                <div
                  className={cn(
                    "flex items-center justify-between text-xs font-semibold",
                    "text-muted-foreground",
                  )}
                >
                  <span>Structured Payload</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyJson}
                    className={cn(
                      "min-h-[32px] h-8 px-2.5 text-xs gap-1.5 rounded-lg",
                    )}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied" : "Copy JSON"}
                  </Button>
                </div>
                <pre
                  className={cn(
                    "p-3.5 rounded-xl bg-black/80 text-emerald-400 font-mono",
                    "text-[11px] overflow-x-auto max-h-60 border",
                    "border-emerald-950/50 touch-pan-x",
                  )}
                >
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="w-full sm:w-auto min-h-[40px] rounded-xl text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </>
  );
};
