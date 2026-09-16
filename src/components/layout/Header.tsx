import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Compass, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTour } from "@/context/TourContext";
import { useSSE } from "@/context/SSEContext";
import { usePresence } from "@/lib/usePresence";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  children,
  className,
}) => {
  const { user, logout } = useAuth();
  const { startTour } = useTour();
  const { isConnected } = useSSE();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);

  const { isRendered: isProfileRendered, isClosing: isProfileClosing } =
    usePresence(isProfileOpen, 150);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOpenBell = (open: boolean) => {
    setIsBellOpen(open);
    if (open) setIsProfileOpen(false);
  };

  const handleOpenProfile = (open: boolean) => {
    setIsProfileOpen(open);
    if (open) setIsBellOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 w-full flex items-center justify-between " +
          "gap-4 px-4 sm:px-6 py-3 min-h-[3.5rem]",
        "bg-background border-b border-border",
        "shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] " +
          "dark:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.25)]",
        "transition-all duration-200 select-none",
        isProfileOpen || isBellOpen ? "z-50" : "z-30",
        className,
      )}
    >
      {/* Title & Page Context Area */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <h2
            className={
              "text-base font-bold tracking-tight text-foreground " +
              "truncate leading-snug"
            }
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p
            className={
              "text-[11px] text-muted-foreground mt-0.5 truncate " +
              "leading-tight"
            }
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Center / Custom Action Slots */}
      {children && (
        <div className="hidden md:flex items-center gap-2">{children}</div>
      )}

      {/* Right Utility & Identity Suite */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <NotificationBell
          isOpen={isBellOpen}
          onOpenChange={handleOpenBell}
        />
        <ThemeToggle />

        {/* Executive Officer Identity Capsule & Dropdown (Jakob's Law) */}
        <div className="relative" ref={dropdownRef} data-tour="header-user">
          <button
            type="button"
            onClick={() => handleOpenProfile(!isProfileOpen)}
            aria-label="Open user account menu"
            className={cn(
              "flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-full " +
                "cursor-pointer border border-border bg-card shadow-xs " +
                "hover:border-primary/60 hover:bg-secondary " +
                "transition-all duration-150 group relative",
              isProfileOpen &&
                "z-50 border-primary/60 bg-card ring-2 ring-primary/20",
            )}
          >
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              name={user?.fullName}
              className="w-5 h-5 rounded-full"
              fallbackClassName={
                "bg-amber-500/15 border-amber-500/30 text-amber-600 " +
                "dark:text-amber-400 group-hover:bg-primary/20 " +
                "group-hover:text-primary text-[10px]"
              }
              icon={<User className="w-3 h-3" />}
            />
            <div className="flex items-center gap-1.5 min-w-0">
              {user?.username && (
                <span
                  className={
                    "text-xs font-semibold text-foreground max-w-[120px] " +
                    "truncate hidden sm:inline group-hover:text-primary " +
                    "transition-colors"
                  }
                >
                  @{user.username}
                </span>
              )}
              <span
                title={
                  isConnected
                    ? "Real-time sync active"
                    : "Connecting to real-time sync..."
                }
                className={cn(
                  "w-1.5 h-1.5 rounded-full hidden sm:inline-block",
                  isConnected
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500/80",
                )}
              />
            </div>
            <ChevronDown
              className={cn(
                "w-3 h-3 text-muted-foreground transition-transform " +
                  "duration-200 shrink-0",
                isProfileOpen && "rotate-180 text-foreground",
              )}
            />
          </button>

          {/* User Dropdown Menu */}
          {isProfileRendered && (
            <>
              {/* Ambient focus backdrop overlay */}
              <div
                className={cn(
                  "fixed inset-0 bg-black/80 z-40",
                  isProfileClosing
                    ? "animate-out fade-out-0 duration-150"
                    : "animate-in fade-in-0 duration-200",
                )}
                onClick={() => setIsProfileOpen(false)}
                aria-hidden="true"
              />

              <div
                className={cn(
                  "fixed inset-x-3 top-16 sm:absolute sm:inset-auto " +
                    "sm:right-0 sm:top-full sm:mt-2 sm:w-64 max-w-xs " +
                    "mx-auto sm:mx-0 rounded-2xl border border-border " +
                    "bg-card shadow-2xl z-50 p-2 space-y-1 origin-top " +
                    "sm:origin-top-right",
                  isProfileClosing
                    ? "animate-out fade-out-0 zoom-out-95 " +
                        "slide-out-to-top-2 duration-150 ease-in"
                    : "animate-in fade-in-0 zoom-in-95 " +
                        "slide-in-from-top-2 duration-200 ease-out",
                )}
              >
                {/* Identity Header */}
                <div
                  className={
                    "flex items-center gap-3 p-2.5 rounded-xl " +
                    "bg-secondary border border-border"
                  }
                >
                  <UserAvatar
                    avatarUrl={user?.avatarUrl}
                    name={user?.fullName}
                    className="w-9 h-9 rounded-xl text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {user?.fullName || "Council Officer"}
                    </p>
                    <p
                      className={
                        "text-[11px] text-muted-foreground truncate font-mono"
                      }
                    >
                      {user?.email}
                    </p>
                    <div className="mt-1">
                      <span
                        className={
                          "inline-block px-1.5 py-0.5 text-[9px] font-bold " +
                          "rounded-md bg-amber-500/15 text-amber-600 " +
                          "dark:text-amber-400 uppercase tracking-wide"
                        }
                      >
                        {user?.roleName || "Officer"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="pt-1 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className={
                      "flex items-center gap-2.5 w-full px-2.5 py-2 " +
                      "text-xs font-semibold rounded-xl text-foreground " +
                      "hover:bg-secondary transition-colors"
                    }
                  >
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Profile & Password</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      startTour();
                    }}
                    className={
                      "flex items-center gap-2.5 w-full px-2.5 py-2 " +
                      "text-xs font-semibold rounded-xl text-foreground " +
                      "hover:bg-secondary transition-colors cursor-pointer"
                    }
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Tour Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className={
                      "flex items-center gap-2.5 w-full px-2.5 py-2 " +
                      "text-xs font-semibold rounded-xl text-destructive " +
                      "hover:bg-destructive/10 transition-colors"
                    }
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

/* Backward-compatibility alias */
export const Navbar = Header;
