import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  Calendar,
  CheckSquare,
  DollarSign,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CyberVisualizer } from "@/components/ui/CyberVisualizer";
import type { Announcement, DashboardStats } from "@/types";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: stats = null, isLoading: isStatsLoading } =
    useQuery<DashboardStats>({
      queryKey: queryKeys.stats,
      queryFn: () => api.get<DashboardStats>("/stats"),
    });

  const { data: announcements = [], isLoading: isAnnLoading } = useQuery<
    Announcement[]
  >({
    queryKey: queryKeys.announcements(),
    queryFn: () => api.get<Announcement[]>("/announcements"),
  });

  const isLoading = isStatsLoading || isAnnLoading;
  const recentAnnouncements = announcements.slice(0, 3);

  return (
    <>
      <Header
        title="Executive Dashboard"
        subtitle="Computer Science Student Organization Central Command"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Hero Section: Executive Command (Left) + Cyber Visualizer (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div
            className={
              "lg:col-span-7 flex flex-col justify-between rounded-xl " +
              "border border-border/80 bg-gradient-to-br from-card " +
              "via-card to-blue-50/40 dark:from-card dark:via-card " +
              "dark:to-card p-6 shadow-xs relative overflow-hidden"
            }
          >
            <div
              aria-hidden="true"
              className={
                "absolute -top-12 -right-12 w-56 h-56 rounded-full " +
                "pointer-events-none"
              }
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, " +
                  "transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                  Active Term 2026-2027
                </span>
                <span className="text-muted-foreground text-[10px]">•</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  {user?.roleName?.replace("_", " ") || "Officer"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Welcome, {user?.roleName || "Officer"}!
              </h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-xl leading-relaxed">
                Centralized executive suite: GPOA schedule, treasury ledger,
                physical inventory, and Google Workspace cloud coordination.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 relative z-10 border-t border-border/40 mt-4">
              <div className="flex items-center gap-2">
                <Link
                  to="/gpoa"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <span>View GPOA</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/tasks"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background/80 hover:bg-secondary text-xs font-semibold transition-colors"
                >
                  <span>Action Items</span>
                </Link>
                <Link
                  to="/materials"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border/60 bg-secondary/40 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Drive Vault</span>
                </Link>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 h-full min-h-[260px]">
            <CyberVisualizer />
          </div>
        </div>

        {/* Elevated Metric Cards with Hover Elevation and Glow Accents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GPOA Activity Metric (Primary Blue Highlight) */}
          <Card
            className={
              "border-border/80 bg-card hover:border-primary/40 " +
              "hover:-translate-y-0.5 hover:shadow-md " +
              "transition-[border-color,box-shadow,transform] duration-150"
            }
          >
            <CardContent className="p-5 flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  GPOA Schedule
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16 mt-2" />
                ) : (
                  <h4 className="text-2xl font-bold text-foreground mt-1">
                    {stats?.gpoaEventsCount ?? 0}
                  </h4>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  Activities planned
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-primary shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Treasury Balance Metric (Gold Accent Highlight) */}
          <Card
            className={
              "border-border/80 bg-card hover:border-amber-500/40 " +
              "hover:-translate-y-0.5 hover:shadow-md " +
              "transition-[border-color,box-shadow,transform] duration-150"
            }
          >
            <CardContent className="p-5 flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Net Treasury
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-24 mt-2" />
                ) : (
                  <h4 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    ₱
                    {(stats?.netTreasuryBalance ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </h4>
                )}
                <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                  Audited available cash
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs">
                <DollarSign className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Open Tasks Metric (Secondary Grey Highlight) */}
          <Card
            className={
              "border-border/80 bg-card hover:border-primary/40 " +
              "hover:-translate-y-0.5 hover:shadow-md " +
              "transition-[border-color,box-shadow,transform] duration-150"
            }
          >
            <CardContent className="p-5 flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Open Tasks
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16 mt-2" />
                ) : (
                  <h4 className="text-2xl font-bold text-foreground mt-1">
                    {stats?.activeTasksCount ?? 0}
                  </h4>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  Action items
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-border/80 bg-secondary text-secondary-foreground shadow-xs">
                <CheckSquare className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Executive Roster */}
          <Card
            className={
              "border-border/80 bg-card hover:border-primary/40 " +
              "hover:-translate-y-0.5 hover:shadow-md " +
              "transition-[border-color,box-shadow,transform] duration-150"
            }
          >
            <CardContent className="p-5 flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Executive Council
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mt-2" />
                ) : (
                  <h4 className="text-2xl font-bold text-foreground mt-1">
                    {stats?.definedRolesCount ?? 0} Roles
                  </h4>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  {stats?.registeredOfficersCount ?? 0} Active users
                </p>
              </div>
              <div className="p-2.5 rounded-lg border border-border/80 bg-secondary text-secondary-foreground shadow-xs">
                <Users className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Resource Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary text-secondary-foreground">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Physical Inventory
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Logged assets & custody
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-foreground">
              {isLoading ? "..." : `${stats?.inventoryItemsCount ?? 0} Items`}
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary text-secondary-foreground">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Resource Materials
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Academic, creative & sports
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-foreground">
              {isLoading ? "..." : `${stats?.materialsCount ?? 0} Files`}
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary text-secondary-foreground">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Passed Resolutions
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Internal affairs records
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-foreground">
              {isLoading ? "..." : `${stats?.resolutionsCount ?? 0} Enacted`}
            </span>
          </div>
        </div>

        {/* Recent Dispatches Feed */}
        <Card>
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Recent Dispatches & Announcements
            </h4>
            <Link
              to="/announcements"
              className="text-xs text-primary font-semibold hover:underline"
            >
              View Feed →
            </Link>
          </div>

          <CardContent className="p-5">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3">
                No recent announcements recorded.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-border bg-card/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="primary"
                          className="text-[9px] font-semibold uppercase"
                        >
                          {item.scope.replace("_", " ")}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-foreground mt-1">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {item.content}
                      </p>
                    </div>

                    {item.sentViaEmail && (
                      <Badge
                        variant="accent"
                        className="text-[9px] font-semibold"
                      >
                        Gmail Dispatched
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
