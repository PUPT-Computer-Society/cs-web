import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, UserPlus } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { WaveBackground } from "@/components/ui/WaveBackground";
import { useGlobalLoader } from "@/context/LoadingContext";
import type { AuthResponse } from "@/types";

const LABEL_CLS = "block text-[11px] font-semibold text-foreground mb-1";
const OPT_CLS = "text-muted-foreground text-[10px] font-normal";

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setCardHeight(Math.round(height));
        }
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  const { setAuthSession } = useAuth();
  const { showLoader, hideLoader } = useGlobalLoader();
  const navigate = useNavigate();

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setRegisterPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setInfoMessage("");
    setIsPendingVerification(false);
  };

  const handleNativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsPendingVerification(false);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        showLoader("VERIFYING CREDENTIALS // SIGNING IN...", 25);
        const res = await api.post<AuthResponse>("/auth/login/native", {
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        });
        setAuthSession(res);
        await hideLoader(true, "ACCESS GRANTED // REDIRECTING...");
        navigate("/dashboard");
      } else {
        if (
          !username.trim() ||
          !firstName.trim() ||
          !lastName.trim() ||
          !email.trim()
        ) {
          throw new Error("Please fill in all required registration fields.");
        }
        if (registerPassword !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (registerPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        showLoader("TRANSMITTING REGISTRATION MANIFEST...", 25);
        const res = await api.post<{ message: string; userId: string }>(
          "/auth/register",
          {
            username: username.trim(),
            email: email.trim(),
            password: registerPassword,
            firstName: firstName.trim(),
            middleName: middleName.trim() || undefined,
            lastName: lastName.trim(),
            suffix: suffix.trim() || undefined,
          },
        );

        const mid = middleName.trim() ? ` ${middleName.trim()}` : "";
        const sfx = suffix.trim() ? ` ${suffix.trim()}` : "";
        const full =
          `${firstName.trim()}${mid} ${lastName.trim()}${sfx}`.trim();

        await hideLoader(true, "MANIFEST RECEIVED // PROCEEDING...");
        navigate("/pending-verification", {
          state: {
            fullName: full,
            username: username.trim(),
            email: email.trim(),
            message: res.message,
          },
        });
      }
    } catch (err: any) {
      await hideLoader(false);
      const msg = err.message || "Authentication failed";
      if (msg.toLowerCase().includes("pending for verification")) {
        setIsPendingVerification(true);
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={
        "relative min-h-screen flex items-center justify-center p-4 " +
        "bg-background overflow-hidden"
      }
    >
      <WaveBackground />
      <Card
        style={{
          height: cardHeight ? `${cardHeight}px` : "auto",
          transition: "height 320ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className={
          "w-full max-w-lg border-border/80 bg-card/90 backdrop-blur-md " +
          "shadow-2xl relative z-10 overflow-hidden gpu-boost"
        }
      >
        <div ref={contentRef}>
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="PUPT Computer Society"
                  className="w-8 h-8 object-contain shrink-0"
                />
                <span
                  className={
                    "text-xs font-semibold uppercase tracking-wider " +
                    "text-muted-foreground"
                  }
                >
                  PUPT Computer Society Portal
                </span>
              </div>
              <ThemeToggle />
            </div>

            <div className="min-h-[58px]">
              <CardTitle
                key={`title-${mode}`}
                className="text-xl pt-2 animate-in fade-in-0 duration-200"
              >
                {mode === "login" ? "Officer Sign In" : "Officer Registration"}
              </CardTitle>
              <CardDescription
                key={`desc-${mode}`}
                className="animate-in fade-in-0 duration-200"
              >
                {mode === "login"
                  ? "Access central governance, council resources, and " +
                    "RBAC tools."
                  : "Submit your application for council review and admission."}
              </CardDescription>
            </div>

            {/* Mode Switcher Tabs with Smooth Sliding Pill */}
            <div
              className={
                "relative flex rounded-lg bg-secondary/50 p-1 " +
                "border border-border mt-3 overflow-hidden"
              }
            >
              <div
                className={
                  "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md " +
                  "bg-card shadow-xs transition-transform duration-250 " +
                  "ease-out " +
                  (mode === "login"
                    ? "left-1 translate-x-0"
                    : "left-1 translate-x-full")
                }
              />
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={
                  "relative z-10 flex-1 py-1.5 text-xs font-medium " +
                  "rounded-md transition-colors duration-200 " +
                  (mode === "login"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={
                  "relative z-10 flex-1 py-1.5 text-xs font-medium " +
                  "rounded-md transition-colors duration-200 flex " +
                  "items-center justify-center gap-1.5 " +
                  (mode === "register"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isPendingVerification && (
              <div
                className={
                  "p-3.5 rounded-lg bg-amber-500/10 border " +
                  "border-amber-500/30 text-amber-700 dark:text-amber-300 " +
                  "text-xs font-medium space-y-2"
                }
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Account Pending Verification</span>
                </div>
                <p
                  className={
                    "text-[11px] leading-relaxed text-amber-600 " +
                    "dark:text-amber-400"
                  }
                >
                  User account is pending for verification. Please wait for an
                  administrator to admit your account.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/pending-verification", {
                        state: {
                          username: loginIdentifier.trim(),
                        },
                      })
                    }
                    className={
                      "text-[11px] font-semibold text-amber-700 " +
                      "dark:text-amber-300 hover:text-foreground underline " +
                      "underline-offset-4 flex items-center gap-1"
                    }
                  >
                    <span>Track admission status</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {errorMessage && !isPendingVerification && (
              <div
                className={
                  "p-2.5 rounded-md bg-rose-500/10 border " +
                  "border-rose-500/20 text-rose-600 dark:text-rose-400 " +
                  "text-xs font-medium"
                }
              >
                {errorMessage}
              </div>
            )}

            {infoMessage && !isPendingVerification && (
              <div
                className={
                  "p-2.5 rounded-md bg-emerald-500/10 border " +
                  "border-emerald-500/20 text-emerald-600 " +
                  "dark:text-emerald-400 text-xs font-medium flex " +
                  "items-center gap-2"
                }
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleNativeSubmit} className="space-y-3">
              <div
                key={mode}
                className={
                  "space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 " +
                  "duration-250 ease-out"
                }
              >
                {mode === "login" && (
                  <>
                    <div>
                      <label className={LABEL_CLS}>Email or Username</label>
                      <Input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                        placeholder="officer@csorg.edu or username"
                        autoComplete="username"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLS}>Password</label>
                      <Input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                  </>
                )}

                {mode === "register" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className={LABEL_CLS}>
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          placeholder="Juan"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>
                          Middle Name <span className={OPT_CLS}>(Opt)</span>
                        </label>
                        <Input
                          type="text"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="Protacio"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-2">
                        <label className={LABEL_CLS}>
                          Last Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          placeholder="Dela Cruz"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>
                          Suffix <span className={OPT_CLS}>(Opt)</span>
                        </label>
                        <Input
                          type="text"
                          value={suffix}
                          onChange={(e) => setSuffix(e.target.value)}
                          placeholder="Jr., III"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className={LABEL_CLS}>
                          Username <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_.-]/g, ""),
                            )
                          }
                          required
                          placeholder="jdelacruz"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="juan@csorg.edu"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className={LABEL_CLS}>
                          Password <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          placeholder="Min 8 characters"
                          autoComplete="new-password"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>
                          Confirm Password{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Repeat password"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className={
                  "w-full mt-2 h-9 flex items-center justify-center " +
                  "gap-2 font-semibold"
                }
              >
                {isSubmitting ? (
                  "Processing..."
                ) : mode === "login" ? (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Submit Application</span>
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-muted-foreground">
                {mode === "login" ? (
                  <span>
                    Need an officer account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className={
                        "text-foreground font-semibold underline " +
                        "underline-offset-4"
                      }
                    >
                      Register here
                    </button>
                  </span>
                ) : (
                  <span>
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className={
                        "text-foreground font-semibold underline " +
                        "underline-offset-4"
                      }
                    >
                      Back to sign in
                    </button>
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};
