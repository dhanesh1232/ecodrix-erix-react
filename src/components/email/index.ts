"use client";
// src/components/email/index.ts
// Public barrel exports for the email sub-module.

export { TemplateBuilder } from "./TemplateBuilder";
export type { TemplateBuilderProps } from "./TemplateBuilder";

export { TemplateEditor } from "./TemplateEditor";
export type { TemplateEditorProps } from "./TemplateEditor";

export { TemplateList } from "./TemplateList";
export { HtmlEditorPane } from "./HtmlEditorPane";
export type { HtmlEditorPaneProps } from "./HtmlEditorPane";

export { VariableMappingPanel } from "./VariableMappingPanel";
export type { VariableMappingPanelProps } from "./VariableMappingPanel";

export { PreviewPane } from "./PreviewPane";
export type { PreviewPaneProps } from "./PreviewPane";

export { SyncStatus } from "./SyncStatus";

// Deprecated re-export kept for backwards compat
export { EmailDragDropBuilder } from "./EmailDragDropBuilder";
