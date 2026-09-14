import React, { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiClientError } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import type { UserPasswordUpdateRequest } from "@/types";
import { cn } from "@/lib/utils";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onOpenChange,
  userEmail,
}) => {
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation rules (Miller's Law chunking)
  const hasMinLength = newPassword.length >= 8;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent =
    newPassword.length > 0 &&
    currentPassword.length > 0 &&
    newPassword !== currentPassword;
  const isFormValid =
    currentPassword.trim().length > 0 &&
    hasMinLength &&
    isMatching &&
    isDifferentFromCurrent;

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrorMessage(null);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage("Please enter your current password.");
      return;
    }

    if (!hasMinLength) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (!isMatching) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    if (!isDifferentFromCurrent) {
      setErrorMessage(
        "New password must be different from your current password.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UserPasswordUpdateRequest = {
        currentPassword,
        newPassword,
      };

      await api.put<{ message: string }>("/auth/password", payload);
      toast.success("Security credentials updated successfully!");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Failed to update password. Please verify current credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Change Account Password"
      description="Update your native CS organization credentials"
      className="max-w-md p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Security Warning & Session Context */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs leading-relaxed">
            <p className="font-semibold">Elevated Security Operation</p>
            <p className="text-muted-foreground text-[11px]">
              Updating credentials for{" "}
              <span className="font-mono font-bold text-foreground">
                {userEmail || "your account"}
              </span>
              . Current password verification is mandatory.
            </p>
          </div>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-in fade-in-0 duration-150">
            {errorMessage}
          </div>
        )}

        {/* Form Fields Suite */}
        <div className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>
                Current Password <span className="text-destructive">*</span>
              </span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-10 pl-10 pr-10 text-xs"
                required
                disabled={isSubmitting}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-2.5 top-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={showCurrent ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              New Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="h-10 pl-10 pr-10 text-xs"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-2.5 top-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={showNew ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Confirm New Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="h-10 pl-10 pr-10 text-xs"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-2.5 top-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={showConfirm ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Requirement Checklist (Miller's Law) */}
        <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 space-y-2 text-xs">
          <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            Password Requirements
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            <div
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                hasMinLength
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                  hasMinLength
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>At least 8 characters in length</span>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                isMatching
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                  isMatching
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>Passwords match</span>
            </div>
          </div>
        </div>

        {/* Fitts's Law Touch Targets & Primary Actions */}
        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-11 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Credentials...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Update Password Now</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="w-full h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
