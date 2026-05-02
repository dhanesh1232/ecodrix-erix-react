"use client";
/**
 * components/router/CrmRouter.tsx
 *
 * Sub-router for the CRM module.
 */

import * as React from "react";
import { CRMViewContainer } from "../crm/CRMViewContainer";
import { PipelineManager } from "../crm/PipelineManager";
import { useErixRoute } from "../../routing/RouterContext";

export const CrmRouter: React.FC = () => {
  const { subPath } = useErixRoute();

  if (subPath?.startsWith("pipelines")) {
    return <PipelineManager />;
  }

  return <CRMViewContainer />;
};
