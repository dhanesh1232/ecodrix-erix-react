"use client";
// src/hooks/whatsapp/useTemplates.ts
import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { WhatsAppTemplate } from "@/types/platform";

export function useTemplates(statusFilter?: string) {
  const sdk = useErixClient();
  const [templates, setTemplates] = React.useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading]     = React.useState(false);

  const fetch_ = React.useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await sdk.whatsapp.templates.list(
        statusFilter ? { status: statusFilter } : undefined,
      );
      setTemplates(res?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [sdk, statusFilter]);

  React.useEffect(() => { void fetch_(); }, [fetch_]);

  const sync = React.useCallback(async () => {
    setLoading(true);
    try {
      await sdk.whatsapp.templates.sync();
      await fetch_();
    } finally {
      setLoading(false);
    }
  }, [sdk, fetch_]);

  const previewTemplate = React.useCallback(
    async (templateName: string, context: Record<string, unknown> = {}) => {
      const res: any = await sdk.whatsapp.templates.preview(templateName, context as any);
      return res?.data as { resolvedVariables: string[]; previewText: string };
    },
    [sdk],
  );

  const deleteTemplate = React.useCallback(
    async (name: string, force = false) => {
      await sdk.whatsapp.templates.deleteTemplate(name, force);
      setTemplates((prev) => prev.filter((t) => t.name !== name));
    },
    [sdk],
  );

  return { templates, loading, refetch: fetch_, sync, previewTemplate, deleteTemplate };
}

export function useTemplate(name: string | null) {
  const sdk = useErixClient();
  const [template, setTemplate] = React.useState<WhatsAppTemplate | null>(null);
  const [loading, setLoading]   = React.useState(false);

  React.useEffect(() => {
    if (!name) return;
    setLoading(true);
    sdk.whatsapp.templates.retrieve(name)
      .then((res: any) => setTemplate(res?.data ?? null))
      .finally(() => setLoading(false));
  }, [sdk, name]);

  return { template, loading };
}
