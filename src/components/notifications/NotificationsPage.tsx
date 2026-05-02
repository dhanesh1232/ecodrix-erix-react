"use client";
import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Zap,
  Info,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useErixNotifications } from "../../notifications/NotificationsContext";
import { useModuleNavigate } from "../../routing/RouterContext";
import type {
  ErixNotification,
  ErixNotificationType,
} from "../../notifications/types";

// Icons for backend types: "action_required" | "alert" | "info"
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

const TypeLabel: Record<ErixNotificationType, string> = {
  action_required: "Action Required",
  alert: "Alert",
  info: "Info",
};

// Only show filter tabs that have matching notifications
function useAvailableFilters(notifications: ErixNotification[]) {
  return React.useMemo(() => {
    const base: Array<ErixNotificationType | "all" | "unread"> = [
      "all",
      "unread",
    ];
    const types = new Set(notifications.map((n) => n.type));
    const order: ErixNotificationType[] = ["action_required", "alert", "info"];
    order.forEach((t) => {
      if (types.has(t)) base.push(t);
    });
    return base;
  }, [notifications]);
}

export function NotificationsPage() {
  const { notifications, loading, error, dismiss, dismissAll, retry, refresh } =
    useErixNotifications();
  const [filter, setFilter] = React.useState<
    ErixNotificationType | "all" | "unread"
  >("all");
  const navigateTo = useModuleNavigate();
  const availableFilters = useAvailableFilters(notifications);

  React.useEffect(() => {
    if (!availableFilters.includes(filter)) setFilter("all");
  }, [availableFilters, filter]);

  const filtered = React.useMemo(() => {
    switch (filter) {
      case "all":
        return notifications;
      case "unread":
        return notifications.filter((n) => n.status === "unread");
      default:
        return notifications.filter((n) => n.type === filter);
    }
  }, [notifications, filter]);

  const handleClick = (n: ErixNotification) => {
    // Navigate based on actionData
    if (n.actionData?.leadId) {
      navigateTo("crm", `/${n.actionData.leadId}`);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="erix-flex erix-flex-col erix-h-full erix-bg-background erix-text-foreground">
      {/* Header */}
      <div className="erix-border-b erix-px-6 erix-py-4 erix-flex erix-items-center erix-justify-between">
        <div className="erix-flex erix-items-center erix-gap-2">
          <Bell className="erix-w-5 erix-h-5 erix-text-primary" />
          <h1 className="erix-text-lg erix-font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="erix-text-xs erix-bg-primary/10 erix-text-primary erix-px-2 erix-py-0.5 erix-rounded-full erix-font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="erix-flex erix-items-center erix-gap-3">
          {error && (
            <button
              onClick={() => void refresh()}
              className="erix-flex erix-items-center erix-gap-1 erix-text-xs erix-text-destructive hover:erix-underline"
            >
              <RefreshCw className="erix-w-3.5 erix-h-3.5" />
              Retry
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={() => void dismissAll()}
              className="erix-flex erix-items-center erix-gap-1.5 erix-text-sm erix-text-muted-foreground hover:erix-text-foreground erix-transition-colors"
            >
              <CheckCheck className="erix-w-4 erix-h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters — only show tabs that exist in current data */}
      <div className="erix-px-6 erix-py-3 erix-border-b erix-flex erix-gap-2 erix-overflow-x-auto">
        {availableFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`erix-px-3 erix-py-1.5 erix-rounded-full erix-text-xs erix-font-medium erix-whitespace-nowrap erix-transition-colors ${
              filter === f
                ? "erix-bg-primary erix-text-primary-foreground"
                : "erix-bg-muted erix-text-muted-foreground hover:erix-bg-muted/80 hover:erix-text-foreground"
            }`}
          >
            {f === "action_required"
              ? "Action Required"
              : f === "all"
                ? "All"
                : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="erix-flex-1 erix-overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="erix-p-8 erix-text-center erix-text-muted-foreground erix-text-sm">
            Loading notifications...
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="erix-p-12 erix-flex erix-flex-col erix-items-center erix-text-center">
            <AlertCircle className="erix-w-8 erix-h-8 erix-text-destructive/60 erix-mb-3" />
            <h3 className="erix-font-medium">Failed to load</h3>
            <p className="erix-text-muted-foreground erix-text-sm erix-mt-1">
              {error.message}
            </p>
            <button
              onClick={() => void refresh()}
              className="erix-mt-4 erix-px-4 erix-py-2 erix-rounded erix-bg-primary erix-text-primary-foreground erix-text-sm erix-font-medium hover:erix-bg-primary/90 erix-transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="erix-p-12 erix-flex erix-flex-col erix-items-center erix-text-center">
            <div className="erix-w-12 erix-h-12 erix-rounded-full erix-bg-muted erix-flex erix-items-center erix-justify-center erix-mb-4">
              <CheckCheck className="erix-w-6 erix-h-6 erix-text-muted-foreground" />
            </div>
            <h3 className="erix-font-medium erix-text-lg">All clear!</h3>
            <p className="erix-text-muted-foreground erix-text-sm erix-mt-1">
              No{" "}
              {filter !== "all"
                ? (TypeLabel[filter as ErixNotificationType] ?? filter)
                : ""}{" "}
              notifications.
            </p>
          </div>
        ) : (
          <div className="erix-divide-y">
            {filtered.map((n) => {
              const Icon = TypeIcon[n.type] ?? Bell;
              const iconColor =
                TypeColor[n.type] ?? "erix-text-muted-foreground";
              const isUnread = n.status === "unread";

              return (
                <div
                  key={n.id}
                  className={`erix-flex erix-gap-0 erix-transition-colors group ${
                    isUnread ? "erix-bg-primary/5" : "hover:erix-bg-muted/40"
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick(n);
                      }
                    }}
                    className="erix-flex-1 erix-flex erix-gap-4 erix-p-4 erix-text-left erix-min-w-0 erix-cursor-pointer focus:erix-outline-none focus:erix-ring-2 focus:erix-ring-primary/20 erix-rounded-lg"
                  >
                    <div
                      className={`erix-mt-1 erix-flex-shrink-0 ${iconColor}`}
                    >
                      <Icon className="erix-w-5 erix-h-5" />
                    </div>
                    <div className="erix-flex-1 erix-min-w-0">
                      <div className="erix-flex erix-items-center erix-justify-between erix-gap-2">
                        <p
                          className={`erix-text-sm erix-font-medium erix-truncate ${isUnread ? "erix-text-foreground" : "erix-text-muted-foreground"}`}
                        >
                          {n.title}
                        </p>
                        <span className="erix-text-xs erix-text-muted-foreground erix-flex-shrink-0">
                          {n.createdAt
                            ? formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                              })
                            : ""}
                        </span>
                      </div>
                      {/* Backend field is "message" not "body" */}
                      <p
                        className={`erix-text-sm erix-mt-0.5 erix-line-clamp-2 ${isUnread ? "erix-text-foreground/80" : "erix-text-muted-foreground"}`}
                      >
                        {n.message}
                      </p>
                      {/* Status badge */}
                      <div className="erix-flex erix-items-center erix-gap-2 erix-mt-2">
                        {isUnread && (
                          <span className="erix-inline-block erix-w-2 erix-h-2 erix-rounded-full erix-bg-primary" />
                        )}
                        {n.status === "resolved" && (
                          <span className="erix-text-[10px] erix-text-green-600 erix-font-medium">
                            Resolved
                          </span>
                        )}
                        {/* Retry for action_required */}
                        {n.type === "action_required" &&
                          n.status === "unread" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void retry(n.id);
                              }}
                              className="erix-flex erix-items-center erix-gap-1 erix-text-[10px] erix-font-medium erix-text-primary hover:erix-underline"
                            >
                              <RefreshCw className="erix-w-3 erix-h-3" />
                              Retry action
                            </button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => void dismiss(n.id)}
                    title="Dismiss"
                    className="erix-flex-shrink-0 erix-self-start erix-mt-4 erix-mr-3 erix-w-6 erix-h-6 erix-rounded erix-flex erix-items-center erix-justify-center erix-text-muted-foreground/0 group-hover:erix-text-muted-foreground erix-transition-colors hover:erix-bg-muted hover:!erix-text-foreground"
                  >
                    <X className="erix-w-3.5 erix-h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
