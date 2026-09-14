import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Plus,
  RefreshCw,
  ShieldAlert,
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
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import type { Role, User } from "@/types";

const PAGE_SIZE = 10;

const ROLE_TIER_OPTIONS = [
  {
    value: "committee",
    label: "Committee Department (e.g. Sports, Creatives)",
  },
  {
    value: "apprentice",
    label: "Apprentice Cadre (Officer Understudy)",
  },
  {
    value: "executive",
    label: "Executive Portfolio (Council Board)",
  },
];

const availablePermissions = [
  "manage_users",
  "manage_roles",
  "view_portal",
  "manage_gpoa",
  "manage_finance",
  "audit_finance",
  "manage_inventory",
  "resolve_affairs",
  "manage_materials",
  "publish_announcements",
  "manage_tasks",
  "dispatch_gmail",
  "sync_calendar",
];

export const AdminPage: React.FC = () => {
  const { user: currentUser, isPresident } = useAuth();
  const {
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
  } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // TanStack Query
  const { data: users = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: queryKeys.users,
    queryFn: () => api.get<User[]>("/users"),
    enabled: !!isPresident,
  });

  const { data: roles = [], isLoading: isRolesLoading } = useQuery<Role[]>({
    queryKey: queryKeys.roles,
    queryFn: () => api.get<Role[]>("/users/roles"),
    enabled: !!isPresident,
  });

  const isLoading = isUsersLoading || isRolesLoading;
  const selectedRole =
    roles.find((r) => r.id === selectedRoleId) || roles[0] || null;

  const matrixRoleOptions = useMemo(
    () =>
      roles.map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [roles],
  );

  const admitRoleOptions = useMemo(
    () => [
      { value: "", label: "Select Constitutional Portfolio..." },
      ...roles.map((r) => ({
        value: String(r.id),
        label: `${r.name} (${r.tier})`,
      })),
    ],
    [roles],
  );

  // New Role / Committee Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleTier, setNewRoleTier] = useState<
    "committee" | "executive" | "apprentice" | ""
  >("");
  const [newRoleCommittee, setNewRoleCommittee] = useState("");

  // Admit Applicant Modal State
  const [userToAdmit, setUserToAdmit] = useState<User | null>(null);
  const [admitRoleId, setAdmitRoleId] = useState<string | null>(null);

  // Revoke Officer Pop-up Confirmation State
  const [officerToRevoke, setOfficerToRevoke] = useState<User | null>(null);

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      api.put(`/users/${userId}/role`, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toastSuccess("Role assignment updated.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update role");
    },
  });

  const togglePermissionMutation = useMutation({
    mutationFn: ({
      roleId,
      permissions,
    }: {
      roleId: string;
      permissions: string[];
    }) => api.put<Role>(`/users/roles/${roleId}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      toastSuccess("Permissions updated.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update role permissions");
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (newRole: Record<string, unknown>) =>
      api.post<Role>("/users/roles", newRole),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      setRoleModalOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRoleTier("");
      setNewRoleCommittee("");
      setSelectedRoleId(created.id);
      toastSuccess(`Role '${created.name}' created successfully.`);
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to create role");
    },
  });

  const admitUserMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      api.post<User>(`/users/${userId}/admit`, { roleId }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setUserToAdmit(null);
      setAdmitRoleId(null);
      toastSuccess(
        `Officer '${updated.fullName}' admitted successfully as ${updated.role?.name}!`,
      );
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to admit applicant");
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post<{ message: string; otp: string }>(`/users/${userId}/resend-otp`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toastInfo(`${res.message} (New OTP: ${res.otp})`);
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to resend activation code");
    },
  });

  const revokeUserMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setOfficerToRevoke(null);
      toastSuccess("Officer removed from roster.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete user");
    },
  });

  const handleUpdateUserRole = (userId: string, roleId: string) => {
    updateRoleMutation.mutate({ userId, roleId });
  };

  const handleTogglePermission = (perm: string) => {
    if (!selectedRole) return;
    const currentPerms = new Set(selectedRole.permissions);
    if (currentPerms.has(perm)) {
      currentPerms.delete(perm);
    } else {
      currentPerms.add(perm);
    }
    togglePermissionMutation.mutate({
      roleId: selectedRole.id,
      permissions: Array.from(currentPerms),
    });
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate({
      name: newRoleName,
      description: newRoleDesc,
      tier: newRoleTier || "committee",
      committee: newRoleCommittee || null,
      permissions: ["view_portal"],
    });
  };

  const handleAdmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToAdmit || !admitRoleId) {
      toastError("Please select a constitutional role to assign.");
      return;
    }
    admitUserMutation.mutate({
      userId: userToAdmit.id,
      roleId: admitRoleId,
    });
  };

  const handleResendUserOtp = (userId: string) => {
    resendOtpMutation.mutate(userId);
  };

  const handleConfirmRevokeUser = () => {
    if (!officerToRevoke) return;
    revokeUserMutation.mutate(officerToRevoke.id);
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = users.slice(startIndex, startIndex + PAGE_SIZE);

  if (!isPresident) {
    return (
      <>
        <Header title="Administration" />
        <div className="p-8 max-w-xl mx-auto text-center space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">
            President Authorization Required
          </h3>
          <p className="text-xs text-muted-foreground">
            Only the President possesses executive administrative privileges to
            configure user roles and permission sets.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="President Administration & RBAC"
        subtitle="Role-based access control governance for council members"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Officer Roster */}
        <Card>
          <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Officer Directory
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Target council capacity: &lt;30 members. Admin-governed
                activation flow.
              </p>
            </div>
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-secondary/40 font-mono text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3.5">Officer</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Assigned Role</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">
                            {u.fullName}
                          </div>
                          {u.username && (
                            <div className="text-[10px] font-mono text-muted-foreground">
                              @{u.username}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {u.role?.name || "Unassigned"}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                {u.role
                                  ? "Pending Activation"
                                  : "Pending Admission"}
                              </span>
                              {u.activationOtp && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    title="Click to copy OTP"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        u.activationOtp!,
                                      );
                                      toastSuccess("Copied OTP to clipboard!");
                                    }}
                                    className="inline-flex items-center gap-1 bg-secondary/80 hover:bg-secondary px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-foreground border border-border transition-colors"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>OTP: {u.activationOtp}</span>
                                  </button>
                                  <button
                                    type="button"
                                    title="Resend Activation OTP"
                                    onClick={() => handleResendUserOtp(u.id)}
                                    className="text-[10px] text-muted-foreground hover:text-foreground underline flex items-center gap-0.5"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Resend</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {!u.isActive ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setUserToAdmit(u);
                                  setAdmitRoleId(
                                    u.role?.id || roles[0]?.id || null,
                                  );
                                }}
                                className="h-7 text-xs flex items-center gap-1 bg-primary text-primary-foreground font-semibold"
                              >
                                <Check className="w-3 h-3" />
                                <span>Admit</span>
                              </Button>
                            ) : (
                              <Select
                                size="sm"
                                value={u.role?.id ? String(u.role.id) : ""}
                                onValueChange={(val) =>
                                  handleUpdateUserRole(u.id, val)
                                }
                                options={roles.map((r) => ({
                                  value: String(r.id),
                                  label: r.name,
                                }))}
                                placeholder="Change Role..."
                                className="w-36"
                                triggerClassName="h-8"
                              />
                            )}

                            {currentUser?.id !== u.id && (
                              <button
                                type="button"
                                title="Revoke officer"
                                onClick={() => setOfficerToRevoke(u)}
                                className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-md hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {users.length > 0 && (
              <div className="p-4 border-t border-border">
                <Pagination
                  currentPage={currentPage}
                  totalItems={users.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Granular Permission Matrix */}
        <Card>
          <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Granular Capability Matrix
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Customize granted permissions per executive portfolio.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {roles.length > 0 && (
                <Select
                  size="sm"
                  value={selectedRole?.id ? String(selectedRole.id) : ""}
                  onValueChange={(val) => setSelectedRoleId(val || null)}
                  options={matrixRoleOptions}
                  className="w-48"
                  triggerClassName="h-8"
                />
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => setRoleModalOpen(true)}
                className="font-mono text-[11px]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Portfolio
              </Button>
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            {selectedRole && (
              <>
                <div className="p-3.5 rounded-lg border border-border bg-secondary/30 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {selectedRole.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {selectedRole.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {selectedRole.permissions.length} Enabled
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availablePermissions.map((perm) => {
                    const isGranted = selectedRole.permissions.includes(perm);
                    return (
                      <button
                        key={perm}
                        type="button"
                        onClick={() => handleTogglePermission(perm)}
                        className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                          isGranted
                            ? "border-foreground bg-secondary text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-mono font-semibold">
                            {perm}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {isGranted
                              ? "Permission Granted"
                              : "Access Restricted"}
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isGranted
                              ? "bg-foreground border-foreground text-background"
                              : "border-input"
                          }`}
                        >
                          {isGranted && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create New Portfolio / Committee Dialog */}
      <Dialog
        open={roleModalOpen}
        onOpenChange={(open) => {
          setRoleModalOpen(open);
          if (!open) {
            setNewRoleName("");
            setNewRoleDesc("");
            setNewRoleTier("");
            setNewRoleCommittee("");
          }
        }}
        title="Add Council Portfolio or Committee"
        description="Expand the organizational structure with new committees or apprentice roles."
      >
        <form onSubmit={handleCreateRole} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Role Title
            </label>
            <Input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required
              placeholder="e.g. Sports Committee Member"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Hierarchical Tier
            </label>
            <Select
              value={newRoleTier}
              placeholder="Select Hierarchical Tier..."
              onValueChange={(val) =>
                setNewRoleTier(val as "committee" | "executive" | "apprentice")
              }
              options={ROLE_TIER_OPTIONS}
              triggerClassName="h-8"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Department / Committee Group (Optional)
            </label>
            <Input
              type="text"
              value={newRoleCommittee}
              onChange={(e) => setNewRoleCommittee(e.target.value)}
              placeholder="e.g. Sports Department"
            />
          </div>

          <MarkdownTextarea
            label="Duties & Constitutional Scope"
            value={newRoleDesc}
            onChange={setNewRoleDesc}
            placeholder="Detailed responsibilities, reporting hierarchy, and errands..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[220px]"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRoleModalOpen(false);
                setNewRoleName("");
                setNewRoleDesc("");
                setNewRoleTier("");
                setNewRoleCommittee("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Portfolio
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Admit Officer Modal */}
      <Dialog
        open={!!userToAdmit}
        onOpenChange={(open) => {
          if (!open) {
            setUserToAdmit(null);
            setAdmitRoleId(null);
          }
        }}
        title="Admit Officer Applicant"
        description="Verify this applicant and assign their constitutional council portfolio to activate their account."
      >
        <form onSubmit={handleAdmitUser} className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applicant Name:</span>
              <span className="font-semibold text-foreground">
                {userToAdmit?.fullName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-mono text-foreground">
                @{userToAdmit?.username || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-foreground">
                {userToAdmit?.email}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Select Constitutional Role to Assign{" "}
              <span className="text-rose-500">*</span>
            </label>
            <Select
              value={admitRoleId ? String(admitRoleId) : ""}
              onValueChange={(val) => setAdmitRoleId(val || null)}
              options={admitRoleOptions}
              placeholder="Select Constitutional Portfolio..."
              triggerClassName="h-8"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setUserToAdmit(null);
                setAdmitRoleId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={admitUserMutation.isPending}
            >
              {admitUserMutation.isPending
                ? "Admitting..."
                : "Admit & Activate Officer"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirm Revoke Officer Pop-up */}
      <ConfirmDialog
        open={!!officerToRevoke}
        title="Revoke Officer Access?"
        description={`Are you sure you want to revoke officer access for "${officerToRevoke?.fullName}" (${officerToRevoke?.email})? They will immediately lose access to the portal and constitutional duties.`}
        confirmText="Revoke Access"
        cancelText="Cancel"
        variant="danger"
        isLoading={revokeUserMutation.isPending}
        onConfirm={handleConfirmRevokeUser}
        onClose={() => setOfficerToRevoke(null)}
      />
    </>
  );
};
