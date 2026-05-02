"use client";
import * as React from "react";
import { useErixRoute } from "../../routing/RouterContext";
import { NotificationsPage } from "../notifications/NotificationsPage";

export function NotificationsRouter() {
  const { subPath } = useErixRoute();

  // Route matches
  // "" or "/" -> <NotificationsPage />
  
  if (subPath === "" || subPath === "/") {
    return <NotificationsPage />;
  }

  // Not found fallback for notifications router
  return (
    <div className="erix-p-8 erix-text-center erix-text-muted-foreground">
      Notification sub-page not found.
    </div>
  );
}
