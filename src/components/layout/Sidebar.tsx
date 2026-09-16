import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  BookOpen,
  Boxes,
  Calendar,
  CheckSquare,
  ChevronRight,
  DollarSign,
  FileArchive,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MoreHorizontal,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/lib/useIsMobile";
import { Drawer } from "@/components/ui/Drawer";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

/* Desktop floating sidebar sizing constants */
const DESKTOP_LEFT_GUTTER = "0.75rem";
const EXPANDED_SIDEBAR_WIDTH = "16rem";
const COLLAPSED_SIDEBAR_WIDTH = "4.5rem";
const EXPANDED_FOOTPRINT = "18rem";
const COLLAPSED_FOOTPRINT = "6.5rem";

const EXPANDED_BRANDING_HEIGHT = "8rem";
const COLLAPSED_BRANDING_HEIGHT = "5.5rem";

/* Staged animation parameters */
const SHELL_DURATION = 380;
const PRE_COLLAPSE_DELAY = 90;
const EXPAND_CONTENT_DELAY = 135;
const SHELL_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const CONTENT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export const Sidebar: React.FC = () => {
  const { user, isPresident, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("cs_sidebar_pinned");
    return saved !== null ? saved === "true" : true;
  });

  const [visualExpanded, setVisualExpanded] = useState(sidebarPinned);
  const [showExpandedContent, setShowExpandedContent] = useState(sidebarPinned);
  const [openDrawer, setOpenDrawer] = useState(false);

  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSidebarPinned = () => {
    setSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem("cs_sidebar_pinned", String(next));
      return next;
    });
  };

  /* Staged expansion and collapse sequence */
  useEffect(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    if (sidebarPinned) {
      // 1. Expand shell immediately
      setVisualExpanded(true);
      // 2. Fade in labels after shell gains width
      animationTimerRef.current = setTimeout(() => {
        setShowExpandedContent(true);
        animationTimerRef.current = null;
      }, EXPAND_CONTENT_DELAY);
    } else {
      // 1. Fade out labels first
      setShowExpandedContent(false);
      // 2. Contract shell shortly after
      animationTimerRef.current = setTimeout(() => {
        setVisualExpanded(false);
        animationTimerRef.current = null;
      }, PRE_COLLAPSE_DELAY);
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [sidebarPinned]);

  const navGroups = [
    {
      label: "Overview",
      items: [
        {
          to: "/dashboard",
          label: "Dashboard",
          shortLabel: "Home",
          icon: LayoutDashboard,
        },
        {
          to: "/directory",
          label: "Council Directory",
          shortLabel: "Directory",
          icon: BookOpen,
        },
        {
          to: "/tasks",
          label: "Task Tracker",
          shortLabel: "Tasks",
          icon: CheckSquare,
        },
        {
          to: "/gpoa",
          label: "GPOA & Calendar",
          shortLabel: "GPOA",
          icon: Calendar,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          to: "/finance",
          label: "Finance Monitoring",
          shortLabel: "Finance",
          icon: DollarSign,
        },
        {
          to: "/inventory",
          label: "Inventory Monitoring",
          shortLabel: "Inventory",
          icon: Boxes,
        },
      ],
    },
    {
      label: "Hub & Governance",
      items: [
        {
          to: "/materials",
          label: "Materials Vault",
          shortLabel: "Vault",
          icon: FileArchive,
        },
        {
          to: "/templates",
          label: "Doc Templates",
          shortLabel: "Templates",
          icon: FileText,
        },
        {
          to: "/announcements",
          label: "Announcements",
          shortLabel: "Announce",
          icon: Megaphone,
        },
        {
          to: "/resolutions",
          label: "Internal Affairs & Docs",
          shortLabel: "Docs",
          icon: ScrollText,
        },
      ],
    },
  ];

  const adminItems = [
    {
      to: "/admin",
      label: "RBAC & Roles",
      shortLabel: "Admin",
      icon: ShieldAlert,
    },
    {
      to: "/admin/audit-logs",
      label: "Audit & Logs",
      shortLabel: "Logs",
      icon: Activity,
    },
  ];

  const allItems = [
    ...navGroups.flatMap((g) => g.items),
    ...(isPresident ? adminItems : []),
  ];

  const isActive = (to: string) => {
    return (
      location.pathname === to ||
      (to !== "/" && location.pathname.startsWith(`${to}/`))
    );
  };

  /* Mobile Bottom Dock */
  if (isMobile) {
    const primaryMobileItems = allItems.slice(0, 4);
    const overflowMobileItems = allItems.slice(4);
    const isMoreActive = overflowMobileItems.some((item) => isActive(item.to));

    return (
      <>
        {/* Floating Mobile Bottom Dock Pill */}
        <div
          className={cn(
            "fixed inset-x-0 z-40 flex w-full justify-center px-4 lg:hidden",
            "bottom-[max(1rem,env(safe-area-inset-bottom))]",
            "pointer-events-none",
          )}
        >
          <div
            className={cn(
              "flex h-16 w-full max-w-md items-center justify-around",
              "rounded-2xl border border-border bg-background/90 px-2 py-1",
              "shadow-lg backdrop-blur-xl pointer-events-auto",
            )}
          >
            {primaryMobileItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group flex flex-1 flex-col items-center justify-center",
                    "min-w-0 max-w-[72px] rounded-xl px-0.5 py-1.5",
                    "transition-all duration-150 active:scale-95",
                    active
                      ? "font-semibold text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                      active && "bg-primary/10",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight">
                    {item.shortLabel}
                  </span>
                </Link>
              );
            })}

            {/* "More" Overflow Trigger */}
            <button
              type="button"
              onClick={() => setOpenDrawer(true)}
              className={cn(
                "group flex flex-1 flex-col items-center justify-center",
                "min-w-0 max-w-[72px] rounded-xl px-0.5 py-1.5",
                "transition-all duration-150 active:scale-95",
                isMoreActive
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Open more navigation and officer profile"
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  isMoreActive && "bg-primary/10",
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight">
                More
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Overflow Bottom Sheet Drawer */}
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <div className="space-y-5">
            {/* Officer Profile Summary */}
            <Link
              to="/profile"
              onClick={() => setOpenDrawer(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border/70 hover:bg-secondary/70 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  avatarUrl={user?.avatarUrl}
                  name={user?.fullName}
                  className="w-10 h-10 rounded-xl text-sm"
                  fallbackClassName="bg-primary text-primary-foreground shadow-xs border-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate text-foreground leading-tight group-hover:text-primary transition-colors">
                    {user?.fullName || "Officer"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] text-muted-foreground truncate uppercase font-semibold">
                      {user?.roleName?.replace("_", " ") || "Officer"}
                    </p>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>

            {/* Overflow Navigation Items */}
            <div className="space-y-2">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Executive Modules
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {overflowMobileItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpenDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl p-3 text-xs font-semibold transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/40 text-foreground hover:bg-muted/70",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                setOpenDrawer(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 p-3 text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </Drawer>
      </>
    );
  }

  /* Desktop Floating Expandable Sidebar */
  const sidebarWidth = visualExpanded
    ? EXPANDED_SIDEBAR_WIDTH
    : COLLAPSED_SIDEBAR_WIDTH;
  const brandingHeight = visualExpanded
    ? EXPANDED_BRANDING_HEIGHT
    : COLLAPSED_BRANDING_HEIGHT;
  const navigationFootprint = visualExpanded
    ? EXPANDED_FOOTPRINT
    : COLLAPSED_FOOTPRINT;

  return (
    <div
      className="sticky top-0 z-40 hidden h-screen shrink-0 items-center lg:flex select-none"
      style={{
        width: navigationFootprint,
        transition: `width ${SHELL_DURATION}ms ${SHELL_EASING}`,
        willChange: "width",
      }}
    >
      <div
        className="relative z-40 h-[calc(100vh-1.5rem)] my-3"
        style={{
          marginLeft: DESKTOP_LEFT_GUTTER,
          width: sidebarWidth,
          transition: `width ${SHELL_DURATION}ms ${SHELL_EASING}`,
          willChange: "width",
          transform: "translateZ(0)",
        }}
      >
        <aside
          className={cn(
            "relative z-50 flex h-full w-full flex-col overflow-visible",
            "rounded-3xl border border-border bg-card/95 shadow-md",
            "backdrop-blur-xl",
          )}
        >
          {/* Top Branding Section */}
          <div
            className="relative shrink-0 overflow-visible border-b border-border/70"
            style={{
              height: brandingHeight,
              transition: `height ${SHELL_DURATION}ms ${SHELL_EASING}`,
              willChange: "height",
              transform: "translateZ(0)",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
              <img
                src="/logo.png"
                alt="PUPT Computer Society Logo"
                className="shrink-0 object-contain rounded-full"
                style={{
                  width: visualExpanded ? "3.25rem" : "2.25rem",
                  height: visualExpanded ? "3.25rem" : "2.25rem",
                  transition: [
                    `width ${SHELL_DURATION}ms ${SHELL_EASING}`,
                    `height ${SHELL_DURATION}ms ${SHELL_EASING}`,
                  ].join(", "),
                  willChange: "width, height",
                }}
              />

              {/* Text label with staged fade/slide */}
              <div
                className="w-full overflow-hidden"
                style={{
                  maxHeight: showExpandedContent ? "3.5rem" : "0rem",
                  marginTop: showExpandedContent ? "0.5rem" : "0rem",
                  opacity: showExpandedContent ? 1 : 0,
                  transform: showExpandedContent
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, -0.375rem, 0)",
                  transition: showExpandedContent
                    ? [
                        `max-height 300ms ${CONTENT_EASING}`,
                        `margin-top 300ms ${CONTENT_EASING}`,
                        "opacity 220ms ease-out",
                        `transform 260ms ${CONTENT_EASING}`,
                      ].join(", ")
                    : [
                        `max-height 180ms ${SHELL_EASING}`,
                        `margin-top 180ms ${SHELL_EASING}`,
                        "opacity 110ms ease-out",
                        `transform 160ms ${SHELL_EASING}`,
                      ].join(", "),
                  willChange: "max-height, margin-top, opacity, transform",
                }}
              >
                <p className="mx-auto max-w-[13rem] text-xs font-bold leading-tight text-foreground">
                  Polytechnic University of the Philippines Taguig Campus
                </p>
                <p className="mx-auto mt-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Computer Society Portal
                </p>
              </div>
            </div>

            {/* Expand / Collapse Floating Pod Toggle Button */}
            <div
              className={cn(
                "absolute bottom-0 right-0 z-30",
                "flex h-8 w-8 translate-x-1/2 translate-y-1/2",
                "items-center justify-center rounded-full border",
                "border-border/70 bg-background shadow-md",
              )}
            >
              <button
                type="button"
                onClick={toggleSidebarPinned}
                aria-label={
                  sidebarPinned ? "Collapse sidebar" : "Expand sidebar"
                }
                title={sidebarPinned ? "Collapse Sidebar" : "Expand Sidebar"}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-primary/40",
                )}
              >
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0"
                  style={{
                    transform: sidebarPinned
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: `transform 300ms ${SHELL_EASING}`,
                    willChange: "transform",
                  }}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2.5 pt-5">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-0.5">
                {/* Section Header (visible when expanded) */}
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: showExpandedContent ? "1.5rem" : "0rem",
                    opacity: showExpandedContent ? 1 : 0,
                    transition: showExpandedContent
                      ? "max-height 250ms ease-out, opacity 200ms ease-out"
                      : "max-height 150ms ease-in, opacity 100ms ease-in",
                  }}
                >
                  <p className="px-2.5 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {group.label}
                  </p>
                </div>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={!visualExpanded ? item.label : undefined}
                      className={cn(
                        "group flex cursor-pointer items-center rounded-xl",
                        visualExpanded
                          ? "justify-start gap-3 px-3 py-2"
                          : "justify-center p-2.5",
                        "transition-[background-color,color,box-shadow] duration-150 ease-out",
                        active
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>

                      <span
                        className="min-w-0 overflow-hidden whitespace-nowrap text-xs"
                        style={{
                          maxWidth: showExpandedContent ? "11.5rem" : "0rem",
                          opacity: showExpandedContent ? 1 : 0,
                          transform: showExpandedContent
                            ? "translate3d(0, 0, 0)"
                            : "translate3d(-0.4375rem, 0, 0)",
                          transition: showExpandedContent
                            ? [
                                `max-width 300ms ${CONTENT_EASING}`,
                                "opacity 220ms ease-out",
                                `transform 280ms ${CONTENT_EASING}`,
                              ].join(", ")
                            : [
                                `max-width 190ms ${SHELL_EASING}`,
                                "opacity 120ms ease-out",
                                `transform 170ms ${SHELL_EASING}`,
                              ].join(", "),
                          willChange: "max-width, opacity, transform",
                        }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Admin RBAC Section (President only) */}
            {isPresident && (
              <div className="pt-2 border-t border-border/50 mt-1 space-y-0.5">
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: showExpandedContent ? "1.5rem" : "0rem",
                    opacity: showExpandedContent ? 1 : 0,
                    transition: showExpandedContent
                      ? "max-height 250ms ease-out, opacity 200ms ease-out"
                      : "max-height 150ms ease-in, opacity 100ms ease-in",
                  }}
                >
                  <p
                    className={cn(
                      "px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase",
                      "tracking-wider text-amber-600 dark:text-amber-400",
                      "whitespace-nowrap",
                    )}
                  >
                    Administration
                  </p>
                </div>

                {adminItems.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={!visualExpanded ? item.label : undefined}
                      className={cn(
                        "group flex cursor-pointer items-center rounded-xl",
                        visualExpanded
                          ? "justify-start gap-3 px-3 py-2"
                          : "justify-center p-2.5",
                        "transition-all duration-150",
                        active
                          ? cn(
                              "bg-amber-500/15 text-amber-600",
                              "dark:text-amber-400 font-semibold shadow-xs",
                            )
                          : cn(
                              "text-muted-foreground",
                              "hover:bg-secondary hover:text-foreground",
                            ),
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center",
                        )}
                      >
                        <ItemIcon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            "text-amber-600 dark:text-amber-400",
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "min-w-0 overflow-hidden whitespace-nowrap",
                          "text-xs font-semibold",
                          "text-amber-600 dark:text-amber-400",
                        )}
                        style={{
                          maxWidth: showExpandedContent ? "11.5rem" : "0rem",
                          opacity: showExpandedContent ? 1 : 0,
                          transform: showExpandedContent
                            ? "translate3d(0, 0, 0)"
                            : "translate3d(-0.4375rem, 0, 0)",
                          transition: showExpandedContent
                            ? [
                                `max-width 300ms ${CONTENT_EASING}`,
                                "opacity 220ms ease-out",
                                `transform 280ms ${CONTENT_EASING}`,
                              ].join(", ")
                            : [
                                `max-width 190ms ${SHELL_EASING}`,
                                "opacity 120ms ease-out",
                                `transform 170ms ${SHELL_EASING}`,
                              ].join(", "),
                          willChange: "max-width, opacity, transform",
                        }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User Footer Container */}
          <div className="p-2 border-t border-border/70 shrink-0">
            {visualExpanded ? (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-secondary/40 border border-border/60 hover:bg-secondary/60 transition-colors">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 min-w-0 pr-1 flex-1 group cursor-pointer"
                  title="Manage Profile & Password"
                >
                  <UserAvatar
                    avatarUrl={user?.avatarUrl}
                    name={user?.fullName}
                    className="w-8 h-8 rounded-xl text-xs"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-foreground leading-tight group-hover:text-primary transition-colors">
                      {user?.fullName || "Officer"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                        {user?.roleName?.replace("_", " ") || "Officer"}
                      </p>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <Link
                  to="/profile"
                  className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 hover:border-primary/50 transition-colors overflow-hidden"
                  title={`${user?.fullName || "Officer"} (${user?.roleName || "Officer"}) - Edit Profile`}
                >
                  <UserAvatar
                    avatarUrl={user?.avatarUrl}
                    name={user?.fullName}
                    className="w-full h-full rounded-xl text-xs border-0"
                  />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
