import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
}

const RESEND_COOLDOWN_SECONDS = 60;
const LABEL_CLS = "block text-[11px] font-semibold text-foreground mb-1";

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  open,
  onOpenChange,
  initialEmail = "",
}) => {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setStep("request");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage("");
      setSuccessMessage("");
      setIsSubmitting(false);
    }
  }, [open, initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await api.post<{ message: string }>(
        "/auth/forgot-password",
        { email: cleanEmail },
      );
      setSuccessMessage(
        res.message || "A verification code has been dispatched to your email.",
      );
      setStep("reset");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to dispatch password reset request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await api.post<{ message: string }>(
        "/auth/forgot-password",
        { email: email.trim() },
      );
      setSuccessMessage(res.message || "Verification code resent.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!otp.trim()) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ message: string }>(
        "/auth/reset-password",
        {
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        },
      );
      setSuccessMessage(res.message || "Password reset successfully!");
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={step === "request" ? "Reset Password" : "Enter Verification Code"}
      description={
        step === "request"
          ? "Enter your registered officer email to receive a 6-digit OTP."
          : `A reset code was sent to ${email}. Enter code and new password.`
      }
    >
      <div className="space-y-4 pt-1">
        {errorMessage && (
          <div
            className={
              "p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 " +
              "text-rose-600 dark:text-rose-400 text-xs font-medium"
            }
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            className={
              "p-2.5 rounded-md bg-emerald-500/10 border " +
              "border-emerald-500/20 text-emerald-600 " +
              "dark:text-emerald-400 text-xs font-medium flex items-center " +
              "gap-2"
            }
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>Officer Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="officer@csorg.edu"
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                "w-full h-10 min-h-[44px] flex items-center justify-center " +
                "gap-2"
              }
            >
              {isSubmitting ? (
                "Sending Code..."
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>6-Digit Verification Code</label>
              <Input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                placeholder="123456"
                className="text-center font-mono text-base tracking-widest"
                maxLength={6}
              />
            </div>

            <div>
              <label className={LABEL_CLS}>New Password</label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className={LABEL_CLS}>Confirm New Password</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                "w-full h-10 min-h-[44px] flex items-center justify-center " +
                "gap-2"
              }
            >
              {isSubmitting ? (
                "Updating Password..."
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep("request")}
                className={
                  "text-xs text-muted-foreground hover:text-foreground " +
                  "flex items-center gap-1 min-h-[44px] px-1"
                }
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change email</span>
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || isSubmitting}
                onClick={handleResendOtp}
                className={
                  "text-xs font-medium min-h-[44px] px-1 " +
                  (cooldown > 0
                    ? "text-muted-foreground/60 cursor-not-allowed"
                    : "text-foreground hover:underline")
                }
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};
