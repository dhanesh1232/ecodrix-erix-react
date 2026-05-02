"use client";
// src/components/email/TemplateEditor.tsx
// Route wrapper: receives templateId from router and delegates to TemplateBuilder.
// Handles creating-new vs editing-existing routing logic.

import * as React from "react";
import type { IEmailTemplate } from "@/types/email";
import { TemplateBuilder } from "./TemplateBuilder";

export interface TemplateEditorProps {
  /** Existing template id — undefined = create new */
  templateId?: string;
  onBack?: () => void;
  onSave?: (template: IEmailTemplate) => void;
  className?: string;
}

export function TemplateEditor({
  templateId,
  onBack,
  onSave,
  className = "",
}: TemplateEditorProps) {
  return (
    <TemplateBuilder
      templateId={templateId ?? null}
      onBack={onBack}
      onSave={onSave}
      className={className}
    />
  );
}
