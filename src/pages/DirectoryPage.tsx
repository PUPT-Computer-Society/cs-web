import React, { useState } from "react";
import {
  BookOpen,
  FolderOpen,
  GraduationCap,
  Layers,
  Mail,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryKeys } from "@/lib/queryClient";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { DriveGuideModal } from "@/components/ui/DriveGuideModal";
import { SearchBar } from "@/components/ui/SearchBar";
import type { Role, User } from "@/types";

type DirectoryTab =
  | "all"
  | "higher_exec"
  | "lower_exec"
  | "directors"
  | "committees"
  | "apprentices";

export const DirectoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DirectoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [driveGuideOpen, setDriveGuideOpen] = useState(false);

  const { data: roles = [], isLoading: isRolesLoading } = useQuery<Role[]>({
    queryKey: queryKeys.roles,
    queryFn: () => api.get<Role[]>("/users/roles"),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: queryKeys.users,
    queryFn: () => api.get<User[]>("/users"),
  });

  const isLoading = isRolesLoading || isUsersLoading;

  const getOfficersForRole = (roleId: string) => {
    return users.filter((u) => u.role?.id === roleId && u.isActive);
  };

  const filteredRoles = roles.filter((role) => {
    // Search query filter
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "higher_exec") {
      return (
        role.name === "President" ||
        (role.name.startsWith("Vice President") &&
          !role.name.startsWith("Assistant Vice President"))
      );
    }
    if (activeTab === "lower_exec") {
      return (
        role.name.startsWith("Assistant Vice President") ||
        role.name === "Delegates Representative"
      );
    }
    if (activeTab === "directors") {
      return (
        role.name.startsWith("Director") || role.name.startsWith("Co-Director")
      );
    }
    if (activeTab === "committees") {
      return role.tier === "committee" || role.name.includes("Committee");
    }
    if (activeTab === "apprentices") {
      return role.tier === "apprentice" || role.name.includes("Apprentice");
    }
    return true;
  });

  return (
    <>
      <Header
        title="Council Directory & Role Handbook"
        subtitle="Constitutional scopes, officer duties, and organizational hierarchy"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Constitutional Banner */}
        <div
          className={
            "rounded-xl border border-border/80 bg-gradient-to-br from-card " +
            "via-card to-blue-50/40 dark:from-card dark:via-card dark:to-card " +
            "p-6 shadow-xs flex flex-col md:flex-row justify-between " +
            "items-start md:items-center gap-4 relative overflow-hidden"
          }
        >
          <div
            aria-hidden="true"
            className={
              "absolute -top-10 -right-10 w-56 h-56 rounded-full " +
              "pointer-events-none"
            }
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, " +
                "transparent 70%)",
            }}
          />
          <div className="flex items-start gap-4 relative z-10">
            <img
              src="/logo.png"
              alt="PUP Taguig Computer Society"
              className="w-12 h-12 object-contain shrink-0 hidden sm:block drop-shadow-xs"
            />
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  PUP Taguig Computer Society • Revised Constitution
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                Official Executive Portfolios & Scope of Responsibilities
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Article X & XI constitutional governance: Higher Executive
                Board, Lower Executive Board, Board of Directors, Special
                Committee Departments, and Apprentice Training Cadres.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 relative z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/60 p-2.5 rounded-lg border border-border/80">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>{roles.length} Defined Roles</span>
            </div>
            <button
              type="button"
              onClick={() => setDriveGuideOpen(true)}
              className={
                "flex items-center gap-1.5 px-3 py-2.5 rounded-lg " +
                "text-xs font-semibold bg-primary text-primary-foreground " +
                "hover:bg-primary/90 shadow-xs transition-colors"
              }
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Drive SOPs</span>
            </button>
          </div>
        </div>

        {/* Tab Selection and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(
              [
                { key: "all", label: "All Portfolios" },
                { key: "higher_exec", label: "Higher Executive" },
                { key: "lower_exec", label: "Lower Executive" },
                { key: "directors", label: "Board of Directors" },
                { key: "committees", label: "Committees" },
                { key: "apprentices", label: "Apprenticeship" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search roles or duties..."
            className="w-full sm:w-64"
            size="sm"
          />
        </div>

        {/* Role Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/40">
            <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground font-mono">
              No roles found matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredRoles.map((role) => {
              const assignedOfficers = getOfficersForRole(role.id);
              const isHigher =
                role.name === "President" ||
                (role.name.startsWith("Vice President") &&
                  !role.name.startsWith("Assistant Vice President"));
              const isDirector =
                role.name.startsWith("Director") ||
                role.name.startsWith("Co-Director");
              const isCommittee =
                role.tier === "committee" || role.name.includes("Committee");
              const isApprentice =
                role.tier === "apprentice" || role.name.includes("Apprentice");

              return (
                <Card
                  key={role.id}
                  className={
                    "flex flex-col h-full border border-border/80 bg-card " +
                    "hover:border-primary/40 hover:-translate-y-0.5 " +
                    "hover:shadow-md " +
                    "transition-[border-color,box-shadow,transform] " +
                    "duration-150 group"
                  }
                >
                  <div className="p-5 border-b border-border/80 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={
                          isApprentice
                            ? "accent"
                            : isCommittee
                              ? "secondary"
                              : isDirector
                                ? "primary"
                                : isHigher
                                  ? "default"
                                  : "outline"
                        }
                        className="text-[9px] font-semibold uppercase tracking-wider"
                      >
                        {isApprentice
                          ? "Apprentice Cadre"
                          : isCommittee
                            ? "Committee Dept"
                            : isDirector
                              ? "Board of Directors"
                              : isHigher
                                ? "Higher Executive"
                                : "Lower Executive"}
                      </Badge>

                      {role.committee && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {role.committee}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {role.name}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {role.description ||
                        "Constitutional portfolio duties specified under Article XI."}
                    </p>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Incumbent Officers */}
                    {/* <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                        Active Officer Roster
                      </span>

                      {assignedOfficers.length === 0 ? (
                        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-muted-foreground text-[11px] italic flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>No assigned officer (Vacant)</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {assignedOfficers.map((officer) => (
                            <div
                              key={officer.id}
                              className="p-2.5 rounded-lg border border-border/70 bg-secondary/30 hover:bg-secondary/50 transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/25 text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                                  {officer.fullName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">
                                    {officer.fullName}
                                  </p>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                    <Mail className="w-2.5 h-2.5 shrink-0 text-muted-foreground/80" />
                                    <span className="truncate">
                                      {officer.email}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div> */}

                    {/* Granted RBAC Capabilities */}
                    <div className="pt-2 border-t border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Constitutional Permissions ({role.permissions.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 4).map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-secondary text-secondary-foreground"
                          >
                            {p.replace("_", " ")}
                          </span>
                        ))}
                        {role.permissions.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground">
                            +{role.permissions.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <DriveGuideModal open={driveGuideOpen} onOpenChange={setDriveGuideOpen} />
    </>
  );
};
