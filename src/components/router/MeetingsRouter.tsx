"use client";
/**
 * components/router/MeetingsRouter.tsx
 * Sub-router for the Meetings module.
 *
 * Sub-path mapping:
 *   ""    → MeetingList
 *   "new" → MeetingScheduler (inline — for the popup/panel form)
 */

import * as React from "react";
import { useErixRoute } from "@/routing/RouterContext";
import { MeetingList } from "../meet/MeetingList";

// Placeholder until full implementation
const MeetingScheduler: React.FC = () => (
  <div className="erix-p-6">
    <h2 className="erix-text-xl erix-font-bold erix-mb-2">Schedule Meeting</h2>
    <p className="erix-text-muted-foreground erix-text-sm">Meeting scheduler</p>
  </div>
);

export const MeetingsRouter: React.FC = () => {
  const { subPath } = useErixRoute();

  switch (subPath) {
    case "new":
      return <MeetingScheduler />;
    case "":
    default:
      return <MeetingList />;
  }
};
