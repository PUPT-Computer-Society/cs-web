import React, { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Save,
  Shield,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiClientError } from "@/api/client";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type {
  AuthSessionUser,
  UserProfileUpdateRequest,
} from "@/types";

type ProfileTab = "profile" | "security";

export const ProfilePage: React.FC = () => {
  const { user, updateUserSession } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Active Navigation Tab (Hick's & Jakob's Law) */
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  /* Profile Edit Mode Toggle (Intentionality & Slip Prevention) */
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  /* Password Dialog State (High-Gravity Security Vault) */
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  /* Profile Form State */
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [suffix, setSuffix] = useState(user?.suffix || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const resetProfileForm = () => {
    setFirstName(user?.firstName || "");
    setMiddleName(user?.middleName || "");
    setLastName(user?.lastName || "");
    setSuffix(user?.suffix || "");
    setUsername(user?.username || "");
    setIsEditingProfile(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.trim().toLowerCase();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();

    if (!cleanFirst) {
      toast.error("First name cannot be empty.");
      return;
    }
    if (!cleanLast) {
      toast.error("Last name cannot be empty.");
      return;
    }
    if (!cleanUsername) {
      toast.error("Username cannot be empty.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const payload: UserProfileUpdateRequest = {
        username: cleanUsername,
        firstName: cleanFirst,
        middleName: middleName.trim() || null,
        lastName: cleanLast,
        suffix: suffix.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      };

      const updatedUser = await api.put<AuthSessionUser>(
        "/auth/profile",
        payload,
      );
      updateUserSession(updatedUser);
      setIsEditingProfile(false);
      toast.success("Officer profile updated successfully!");
    } catch (err: any) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Failed to update profile. Please try again.";
      toast.error(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5 MB limit.");
      return;
    }

    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedMimes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are supported.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.postForm<{ avatarUrl: string }>(
        "/auth/avatar",
        formData,
      );
      setAvatarUrl(res.avatarUrl);
      if (user) {
        updateUserSession({
          ...user,
          avatarUrl: res.avatarUrl,
        });
      }
      toast.success("Avatar uploaded and saved to static storage!");
    } catch (err: any) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Failed to upload avatar.";
      toast.error(msg);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Officer Settings"
        subtitle="Manage your council identity, account security, and credentials"
      />

      {/* Hidden file input for avatar uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Officer Identity Banner (Fitts's & Jakob's Law) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs">
          <div className="flex items-center gap-5">
            {/* Clickable Avatar Target with Prominent Fitts's Law Footprint */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className={cn(
                  "relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden",
                  "border-2 border-primary/30 shadow-md cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  "transition-all duration-150 active:scale-95 group",
                  isUploadingAvatar && "opacity-75 pointer-events-none",
                )}
                title="Click avatar to upload new photo"
                aria-label="Upload new avatar image"
              >
                <UserAvatar
                  avatarUrl={avatarUrl}
                  name={user?.fullName}
                  className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-200"
                  fallbackClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-2xl font-bold border-0"
                />

                {/* Dark Hover Scrim with Camera Icon */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-semibold tracking-wide">
                        Change
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Pinned Camera Badge Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-90 cursor-pointer"
                title="Click to upload new photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {user?.fullName || "Council Officer"}
                </h1>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                  {user?.roleName?.replace("_", " ") || "Officer"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground text-[11px]">
                  Verified Council Account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls (Jakob's Law & Hick's Law) */}
        <div className="flex items-center gap-2 border-b border-border/70 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer",
              activeTab === "profile"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <UserIcon className="w-4 h-4" />
            <span>Council Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer",
              activeTab === "security"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Access</span>
          </button>
        </div>

        {/* TAB 1: COUNCIL PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {!isEditingProfile ? (
              /* Executive Overview Mode (Read-Only By Default) */
              <Card className="border-border/80 bg-card/70 backdrop-blur-xs shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Officer Identity Record</CardTitle>
                      <CardDescription>
                        Official roster identity and display configuration
                      </CardDescription>
                    </div>
                  </div>

                  {/* Intentional Edit Trigger (Fitts's Law) */}
                  <Button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="h-10 px-4 text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Profile Details</span>
                  </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Full Legal Name
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {user?.fullName || "Not provided"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Portal Username
                      </p>
                      <p className="text-sm font-mono font-bold text-primary">
                        @{user?.username || "unassigned"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Council Institutional Email
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs font-mono font-bold text-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Officer Assignment
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {user?.roleName?.replace("_", " ") || "Officer"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        First Name
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {user?.firstName || "—"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Last Name
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {user?.lastName || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Intentional Edit Mode */
              <Card className="border-border/80 bg-card/70 backdrop-blur-xs shadow-md animate-in fade-in-0 duration-150">
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Edit Officer Information</CardTitle>
                      <CardDescription>
                        Update your name and portal handle
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetProfileForm}
                    disabled={isUpdatingProfile}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <span>Cancel</span>
                  </Button>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          First Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Juan"
                          className="h-10 text-xs"
                          required
                          disabled={isUpdatingProfile}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Middle Name
                        </label>
                        <Input
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="e.g. Protacio"
                          className="h-10 text-xs"
                          disabled={isUpdatingProfile}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Last Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="e.g. Dela Cruz"
                          className="h-10 text-xs"
                          required
                          disabled={isUpdatingProfile}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Suffix
                        </label>
                        <Input
                          value={suffix}
                          onChange={(e) => setSuffix(e.target.value)}
                          placeholder="e.g. Jr., III"
                          className="h-10 text-xs"
                          disabled={isUpdatingProfile}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Username <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs text-muted-foreground font-mono">
                          @
                        </span>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-10 pl-8 text-xs font-mono"
                          placeholder="username"
                          required
                          disabled={isUpdatingProfile}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        <span>Institutional Email (Permanent)</span>
                      </label>
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="h-10 bg-muted/40 text-muted-foreground cursor-not-allowed text-xs font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Locked to council whitelist credentials to guarantee identity integrity
                      </p>
                    </div>

                    {/* Fitts's Law Primary Action Target */}
                    <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                      <Button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="w-full sm:w-auto h-11 px-6 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Profile Changes</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetProfileForm}
                        disabled={isUpdatingProfile}
                        className="w-full sm:w-auto h-11 px-5 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: SECURITY & CREDENTIALS */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-in fade-in-0 duration-150">
            {/* High-Gravity Change Password Card (Fitts's Law) */}
            <Card className="border-amber-500/30 dark:border-amber-500/20 bg-card/80 backdrop-blur-xs shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Account Authentication Credentials</CardTitle>
                    <CardDescription>
                      Secure access to the CS organization portal with a robust password
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      Portal Password Protection
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your native password is authenticated with bcrypt hashing. Updating your password requires confirming your current credentials.
                    </p>
                  </div>

                  {/* Fitts's Law Elevated Action Button */}
                  <Button
                    type="button"
                    onClick={() => setIsPasswordDialogOpen(true)}
                    className="w-full sm:w-auto h-12 px-6 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-md shrink-0 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Change Account Password</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Posture & Account Integrity Overview */}
            <Card className="border-border/80 bg-card/70 backdrop-blur-xs shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Security Posture & Privileges</CardTitle>
                    <CardDescription>
                      Account protection standards enforced by the council infrastructure
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="text-xs font-bold">Session Active</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Signed bearer token active with Redis session synchronization.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="text-xs font-bold">Whitelist Identity</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Account email is permanently bound to the council officer whitelist.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="text-xs font-bold">Role-Based Control</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Assigned role: <span className="font-semibold text-foreground uppercase">{user?.roleName?.replace("_", " ")}</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dedicated High-Gravity Security Vault Modal */}
      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        userEmail={user?.email}
      />
    </div>
  );
};
