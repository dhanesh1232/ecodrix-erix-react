"use client";
/**
 * components/router/AnalyticsRouter.tsx
 * Sub-router for the Analytics module.
 */

import * as React from "react";
import { useErixRoute } from "@/routing/RouterContext";
import { AnalyticsDashboard } from "../analytics/AnalyticsDashboard";

export const AnalyticsRouter: React.FC = () => {
  const { subPath } = useErixRoute();

  switch (subPath) {
    case "":
    default:
      return <AnalyticsDashboard />;
  }
};
