import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingSpotlight } from "@/components/ui/OnboardingSpotlight";

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className={
          "min-h-screen flex items-center justify-center bg-background"
        }
      >
        <div
          className={
            "w-6 h-6 border-2 border-foreground border-t-transparent " +
            "rounded-full animate-spin"
          }
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen flex bg-background text-foreground">
      <OnboardingSpotlight />
      {/* Background ambient container (contained to avoid obstruction) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Light mode ambient gradient depth mesh */}
        <div
          aria-hidden="true"
          className={
            "absolute inset-0 bg-gradient-to-br from-blue-50/50 " +
            "via-background to-amber-50/30 dark:from-transparent " +
            "dark:via-transparent dark:to-transparent"
          }
        />

        {/* Ambient tech dot grid texture without maskImage composition */}
        <div
          aria-hidden="true"
          className={
            "absolute inset-0 opacity-25 dark:opacity-15 " +
            "pointer-events-none"
          }
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--foreground) / 0.15) 1.2px, " +
              "transparent 1.2px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top ambient luminous primary glow - zero-cost radial gradient */}
        <div
          aria-hidden="true"
          className={
            "absolute top-0 left-1/2 -translate-x-1/2 w-[1050px] " +
            "h-[350px] pointer-events-none"
          }
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 0%, " +
              "hsl(var(--primary) / 0.16) 0%, transparent 75%)",
          }}
        />

        {/* Bottom-right ambient warm accent glow - zero-cost radial */}
        <div
          aria-hidden="true"
          className={
            "absolute -bottom-20 -right-20 w-[550px] " +
            "h-[300px] pointer-events-none"
          }
          style={{
            background:
              "radial-gradient(circle at 80% 80%, " +
              "hsl(var(--accent) / 0.14) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col min-w-0">
            <Outlet />
          </div>
          {/* Vanishing margin buffer for mobile floating dock - no cropping */}
          <div className="h-24 lg:hidden shrink-0" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
};
