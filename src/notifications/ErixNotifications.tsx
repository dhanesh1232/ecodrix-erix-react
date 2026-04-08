"use client";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell, CheckCheck, AlertTriangle, Info, Zap, X, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useErixNotifications } from "./NotificationsContext";
import { useErixRouter } from "../routing/RouterContext";
import type { ErixNotification, ErixNotificationType } from "./types";

// Icons mapped to backend types: "action_required" | "alert" | "info"
const TypeIcon: Record<ErixNotificationType, React.ElementType> = {
  action_required: AlertTriangle,
  alert: Zap,
  info: Info,
};

const TypeColor: Record<ErixNotificationType, string> = {
  action_required: "erix-text-red-500",
  alert: "erix-text-amber-500",
  info: "erix-text-primary",
};

export interface ErixNotificationsProps {
  /**
   * Optional custom URL to navigate to for the full notifications page.
   * If provided, clicking "View all" will use this absolute path.
   */
  notificationsUrl?: string;
}

export function ErixNotifications({ notificationsUrl }: ErixNotificationsProps) {
  const { notifications, unreadCount, dismissAll, dismiss, retry } = useErixNotifications();
  const { routes, navigateTo } = useErixRouter();
  const [open, setOpen] = React.useState(false);

  const hasNotificationsRoute = !!routes.notifications;
  // Show only unread/unresolved in popover
  const displayNotifications = notifications
    .filter((n) => n.status === "unread")
    .slice(0, 10);

  const handleNotificationClick = (n: ErixNotification) => {
    setOpen(false);
    // Navigate based on actionData content
    if (n.actionData?.leadId) {
      navigateTo("crm", `/${n.actionData.leadId}`);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="erix-relative erix-inline-flex erix-items-center erix-justify-center erix-w-10 erix-h-10 erix-rounded-full erix-transition-colors hover:erix-bg-muted focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="erix-w-5 erix-h-5 erix-text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="erix-absolute erix-top-1.5 erix-right-1.5 erix-flex erix-items-center erix-justify-center erix-min-w-[16px] erix-h-4 erix-bg-red-500 erix-text-white erix-text-[9px] erix-font-bold erix-rounded-full erix-px-1 erix-shadow-sm erix-ring-2 erix-ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="erix-z-[100] erix-w-[340px] erix-rounded-xl erix-border erix-bg-background erix-shadow-xl erix-outline-none erix-flex erix-flex-col erix-overflow-hidden"
        >
          {/* Header */}
          <div className="erix-px-4 erix-py-3 erix-border-b erix-flex erix-items-center erix-justify-between erix-bg-muted/30">
            <div className="erix-flex erix-items-center erix-gap-2">
              <h3 className="erix-font-semibold erix-text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="erix-text-[10px] erix-font-medium erix-bg-primary/10 erix-text-primary erix-px-1.5 erix-py-0.5 erix-rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); void dismissAll(); }}
                className="erix-text-xs erix-text-primary erix-font-medium hover:erix-underline erix-flex erix-items-center erix-gap-1"
              >
                <CheckCheck className="erix-w-3.5 erix-h-3.5" />
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="erix-overflow-y-auto erix-max-h-[360px] erix-bg-background">
            {displayNotifications.length === 0 ? (
              <div className="erix-p-8 erix-text-center erix-text-sm erix-text-muted-foreground erix-flex erix-flex-col erix-items-center erix-gap-2">
                <Bell className="erix-w-8 erix-h-8 erix-text-muted-foreground/30" />
                All clear!
              </div>
            ) : (
              <div className="erix-divide-y">
                {displayNotifications.map((n) => {
                  const Icon = TypeIcon[n.type] ?? Bell;
                  const iconColor = TypeColor[n.type] ?? "erix-text-muted-foreground";

                  return (
                    <div
                      key={n.id}
                      className="erix-flex erix-items-start erix-bg-primary/5 erix-transition-colors erix-group hover:erix-bg-muted/40"
                    >
                      <button
                        onClick={() => handleNotificationClick(n)}
                        className="erix-flex-1 erix-flex erix-gap-3 erix-p-3 erix-text-left erix-min-w-0"
                      >
                        <div className={`erix-mt-0.5 erix-flex-shrink-0 ${iconColor}`}>
                          <Icon className="erix-w-4 erix-h-4" />
                        </div>
                        <div className="erix-flex-1 erix-min-w-0">
                          <div className="erix-flex erix-items-baseline erix-justify-between erix-gap-2">
                            <p className="erix-text-sm erix-font-medium erix-truncate erix-text-foreground">
                              {n.title}
                            </p>
                            <span className="erix-text-[10px] erix-text-muted-foreground erix-flex-shrink-0 erix-whitespace-nowrap">
                              {n.createdAt
                                ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                                : ""}
                            </span>
                          </div>
                          <p className="erix-text-xs erix-mt-0.5 erix-line-clamp-2 erix-text-foreground/80">
                            {n.message}
                          </p>
                          {/* Show retry only for action_required */}
                          {n.type === "action_required" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); void retry(n.id); }}
                              className="erix-mt-1.5 erix-flex erix-items-center erix-gap-1 erix-text-[10px] erix-font-medium erix-text-primary hover:erix-underline"
                            >
                              <RefreshCw className="erix-w-3 erix-h-3" />
                              Retry action
                            </button>
                          )}
                        </div>
                        <div className="erix-flex-shrink-0 erix-self-center erix-w-2 erix-h-2 erix-rounded-full erix-bg-primary" />
                      </button>

                      {/* Dismiss */}
                      <button
                        onClick={() => void dismiss(n.id)}
                        title="Dismiss"
                        className="erix-flex-shrink-0 erix-self-start erix-mt-3 erix-mr-2 erix-w-5 erix-h-5 erix-rounded erix-flex erix-items-center erix-justify-center erix-text-muted-foreground/0 group-hover:erix-text-muted-foreground erix-transition-colors hover:erix-bg-muted hover:!erix-text-foreground"
                      >
                        <X className="erix-w-3 erix-h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {(hasNotificationsRoute || notificationsUrl) && (
            <div className="erix-p-2 erix-border-t erix-bg-muted/30">
              <button
                onClick={() => {
                  if (notificationsUrl) {
                    window.location.href = notificationsUrl;
                  } else {
                    navigateTo("notifications");
                  }
                  setOpen(false);
                }}
                className="erix-w-full erix-py-1.5 erix-text-center erix-text-xs erix-font-medium erix-text-primary hover:erix-bg-muted erix-rounded erix-transition-colors"
              >
                View all notifications →
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
