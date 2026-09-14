import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WaveBackground } from "@/components/ui/WaveBackground";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface LocationState {
  fullName?: string;
  username?: string;
  email?: string;
  message?: string;
}

export const PendingVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      <WaveBackground />

      <Card className="w-full max-w-lg border-border/80 bg-card/95 backdrop-blur-md shadow-2xl relative z-10 animate-in fade-in-0 zoom-in-95 duration-200">
        <CardHeader className="space-y-1 pb-3 text-center">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="PUPT Computer Society"
                className="w-8 h-8 object-contain shrink-0"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">
                PUPT Computer Society
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="pt-2 flex justify-center">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Clock className="w-8 h-8 animate-pulse" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>
          </div>

          <CardTitle className="text-xl pt-3 text-foreground font-bold">
            Application Under Review
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
            Your officer registration was dispatched to council leadership.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Exact Prompt Required */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>User account is pending for verification</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
              Please wait for an administrator to admit your account. You will
              gain access to constitutional portfolios and workspace tools once
              approved.
            </p>
          </div>

          {/* Registered Applicant Details */}
          {(state.fullName || state.username || state.email) && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1.5 text-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                Applicant Record Summary
              </div>
              {state.fullName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-semibold text-foreground">
                    {state.fullName}
                  </span>
                </div>
              )}
              {state.username && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="text-foreground">@{state.username}</span>
                </div>
              )}
              {state.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{state.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Review Stepper Timeline */}
          <div className="p-3.5 rounded-lg border border-border bg-card/50 space-y-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Admission Pipeline
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-[11px]">
                    1. Registration Credentials Saved
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Account created with encrypted bcrypt credentials.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-[11px]">
                    2. President / Admin Review & Role Assignment
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Council board verifies identity and assigns constitutional
                    tier.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 opacity-60">
                <div className="w-5 h-5 rounded-full bg-secondary text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-[11px]">
                    3. Account Activated & Portal Access Granted
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Log in with your username/email once admitted.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <Button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 font-semibold h-9"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
