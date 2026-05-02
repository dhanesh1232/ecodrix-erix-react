"use client";
// src/components/email/TemplateBuilder.tsx
// Shell: delegates to EmailCanvasBuilder.
// Kept as a public-facing entry point for backwards compat.

import * as React from "react";
import type { IEmailTemplate } from "@/types/email";
import { EmailCanvasBuilder } from "./builder/EmailCanvasBuilder";

export interface TemplateBuilderProps {
  templateId?: string | null;
  onBack?: () => void;
  onSave?: (template: IEmailTemplate) => void;
  onCreated?: (id: string) => void;
  className?: string;
}

export function TemplateBuilder({
  templateId = null,
  onBack,
  onSave,
  onCreated,
  className = "",
}: TemplateBuilderProps) {
  return (
    <EmailCanvasBuilder
      templateId={templateId}
      onBack={onBack}
      onSave={onSave}
      onCreated={onCreated}
      className={className}
    />
  );
}
