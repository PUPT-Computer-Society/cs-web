import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck } from "lucide-react";
import { api } from "@/api/client";
import { usePresence } from "@/lib/usePresence";
import { useSSE } from "@/context/SSEContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, Pill } from "@/components/ui/Badge";
import type { AppNotification, NotificationListResponse } from "@/types";

export const NotificationBell: React.FC = () => {
  const { lastEvent } = useSSE();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTouched, setIsTouched] = useState<boolean>(() => {
    return sessionStorage.getItem("cs_bell_is_touched") === "true";
  });
  const [isOpen, setIsOpen] = useState(false);
  const { isRendered: isDropdownRendered, isClosing: isDropdownClosing } =
    usePresence(isOpen, 150);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await api.get<NotificationListResponse>("/notifications");
      setNotifications(data.notifications);

      // If new unread items appeared, un-touch so the user is alerted
      if (data.unreadCount > prevCountRef.current && data.unreadCount > 0) {
        setIsTouched(false);
        sessionStorage.setItem("cs_bell_is_touched", "false");
      }
      prevCountRef.current = data.unreadCount;
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 60s fallback
    return () => clearInterval(interval);
  }, []);

  // Live SSE real-time reactive trigger
  useEffect(() => {
    if (lastEvent?.type === "notifications") {
      fetchNotifications();
    }
  }, [lastEvent]);

  // Close dropdown on click outside (supporting touch on mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setIsTouched(true);
      sessionStorage.setItem("cs_bell_is_touched", "true");
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string, linkUrl?: string | null) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      setIsTouched(true);
      sessionStorage.setItem("cs_bell_is_touched", "true");
      if (linkUrl) {
        setIsOpen(false);
        navigate(linkUrl);
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setIsTouched(true);
      sessionStorage.setItem("cs_bell_is_touched", "true");
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const normalized =
      dateStr.endsWith("Z") || dateStr.includes("+")
        ? dateStr
        : `${dateStr}+08:00`;
    const diff = Math.floor(
      (Date.now() - new Date(normalized).getTime()) / 1000,
    );
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const tooltipTitle =
    unreadCount > 0
      ? `${unreadCount} unread dispatches (${
          isTouched ? "Viewed" : "New dispatches"
        })`
      : "No unread dispatches";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        data-touched={isTouched}
        className={cn(
          "relative p-2 rounded-md border transition-all",
          !isTouched && unreadCount > 0
            ? "border-amber-500/60 bg-amber-500/10 text-amber-600 " +
                "dark:text-amber-400 ring-2 ring-amber-500/30"
            : "border-border bg-background hover:bg-secondary " +
                "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Officer Notifications"
        title={tooltipTitle}
      >
        <Bell
          className={cn(
            "w-4 h-4 transition-transform",
            !isTouched &&
              unreadCount > 0 &&
              "animate-bell-wiggle text-amber-500 scale-105",
          )}
        />
        {unreadCount > 0 && (
          <>
            {!isTouched && (
              <span
                className={
                  "absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full " +
                  "bg-amber-500 animate-ping opacity-60 pointer-events-none"
                }
              />
            )}
            <span
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
                "rounded-full font-mono text-[10px] font-bold flex",
                "items-center justify-center shadow-xs transition-colors",
                !isTouched
                  ? "bg-amber-500 text-slate-950"
                  : "bg-secondary text-muted-foreground border border-border",
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {isDropdownRendered && (
        <>
          {/* Mobile ambient backdrop dismissal */}
          <div
            className={cn(
              "fixed inset-0 bg-background/50 z-40 sm:hidden",
              isDropdownClosing
                ? "animate-out fade-out-0 duration-150"
                : "animate-in fade-in-0 duration-200",
            )}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className={cn(
              "fixed inset-x-3 top-16 sm:absolute sm:inset-auto " +
                "sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-w-md mx-auto " +
                "sm:mx-0 rounded-2xl border border-border bg-card " +
                "shadow-2xl z-50 overflow-hidden origin-top " +
                "sm:origin-top-right flex flex-col " +
                "max-h-[calc(100dvh-13rem-env(safe-area-inset-bottom,0px))] " +
                "sm:max-h-none",
              isDropdownClosing
                ? "animate-out fade-out-0 zoom-out-95 slide-out-to-top-2 " +
                    "duration-150 ease-in"
                : "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 " +
                    "duration-200 ease-out",
            )}
          >
            <div
              className={
                "p-3.5 border-b border-border flex items-center " +
                "justify-between bg-muted"
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    "text-xs font-mono font-bold uppercase tracking-wider " +
                    "text-foreground"
                  }
                >
                  Council Dispatches
                </span>
                {unreadCount > 0 && (
                  <Pill
                    size="sm"
                    className={cn(
                      "font-mono text-[10px] font-bold border",
                      !isTouched
                        ? "bg-amber-500/20 text-amber-600 " +
                            "dark:text-amber-400 border-amber-500/30"
                        : "bg-secondary text-muted-foreground border-border",
                    )}
                  >
                    {unreadCount} Unread {!isTouched ? "• New" : "• Seen"}
                  </Pill>
                )}
              </div>

              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  className={
                    "h-7 px-2 text-[11px] font-mono text-muted-foreground " +
                    "hover:text-foreground inline-flex items-center gap-1"
                  }
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </Button>
              )}
            </div>

            <div
              className={
                "max-h-64 sm:max-h-80 overflow-y-auto " +
                "divide-y divide-border"
              }
            >
              {notifications.length === 0 ? (
                <div
                  className={
                    "p-6 text-center text-xs text-muted-foreground italic"
                  }
                >
                  No notifications logged.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.linkUrl)}
                    className={cn(
                      "p-3 text-left cursor-pointer transition-colors flex",
                      "items-start gap-3",
                      notif.isRead
                        ? "bg-card hover:bg-secondary/70"
                        : "bg-secondary hover:bg-secondary/90",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 w-2 h-2 rounded-full shrink-0",
                        notif.isRead ? "bg-transparent" : "bg-amber-500",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p
                            className={
                              "text-xs font-bold text-foreground truncate"
                            }
                          >
                            {notif.title}
                          </p>
                          {notif.targetPermission && (
                            <Badge
                              size="sm"
                              variant="outline"
                              className={
                                "px-1 py-0.5 text-[9px] font-mono " +
                                "uppercase bg-primary/10 text-primary " +
                                "border-primary/20 shrink-0"
                              }
                            >
                              {notif.targetPermission.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <span
                          className={
                            "text-[10px] font-mono text-muted-foreground " +
                            "whitespace-nowrap"
                          }
                        >
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p
                        className={
                          "text-[11px] text-muted-foreground line-clamp-2 " +
                          "mt-0.5"
                        }
                      >
                        {notif.message}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        className={
                          "h-7 w-7 min-h-[28px] min-w-[28px] shrink-0 " +
                          "text-muted-foreground hover:text-foreground"
                        }
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
