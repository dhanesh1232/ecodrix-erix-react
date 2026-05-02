"use client";
// src/hooks/email/useEmailTemplates.ts
// CRUD hook for email templates with optimistic UI updates.
// Pattern mirrors useLeads / useTemplates (whatsapp) in this SDK.

import * as React from "react";
import { unwrap, useEmailTemplateApi } from "@/lib/emailTemplateClient";
import type {
  EmailTemplateFilters,
  EmailTemplatePayload,
  IEmailTemplate,
} from "@/types/email";

// ─── List + CRUD ──────────────────────────────────────────────────────────────

export function useEmailTemplates(filters: EmailTemplateFilters = {}) {
  const { base, headers } = useEmailTemplateApi();
  const [templates, setTemplates] = React.useState<IEmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Serialize filters to a string for stable useCallback dependency
  const filterKey = JSON.stringify(filters);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined),
        ),
      ).toString();
      const url = params ? `${base}?${params}` : base;
      const res = await fetch(url, { headers });
      const data = await unwrap<IEmailTemplate[]>(res);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load templates");
    } finally {
      setLoading(false);
    }
    // filterKey captures serialized filters for stable dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, filterKey]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  // ─── Create (optimistic) ────────────────────────────────────────────────────

  const create = React.useCallback(
    async (payload: EmailTemplatePayload): Promise<IEmailTemplate> => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: IEmailTemplate = {
        ...payload,
        _id: tempId,
        version: 1,
        allowUnsubscribe: payload.allowUnsubscribe ?? true,
        variableMapping: payload.variableMapping ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTemplates((prev) => [optimistic, ...prev]);

      try {
        const res = await fetch(base, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const created = await unwrap<IEmailTemplate>(res);
        setTemplates((prev) =>
          prev.map((t) => (t._id === tempId ? created : t)),
        );
        return created;
      } catch (err) {
        // Rollback on failure
        setTemplates((prev) => prev.filter((t) => t._id !== tempId));
        throw err;
      }
    },
    [base, headers],
  );

  // ─── Update (optimistic) ────────────────────────────────────────────────────

  const update = React.useCallback(
    async (
      id: string,
      payload: Partial<EmailTemplatePayload>,
    ): Promise<IEmailTemplate> => {
      // Stash previous for rollback
      const prev = templates.find((t) => t._id === id);

      setTemplates((all) =>
        all.map((t) => (t._id === id ? { ...t, ...payload } : t)),
      );

      try {
        const res = await fetch(`${base}/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
        const updated = await unwrap<IEmailTemplate>(res);
        setTemplates((all) => all.map((t) => (t._id === id ? updated : t)));
        return updated;
      } catch (err) {
        // Rollback to previous state
        if (prev) {
          setTemplates((all) => all.map((t) => (t._id === id ? prev : t)));
        }
        throw err;
      }
    },
    [base, headers, templates],
  );

  // ─── Delete (optimistic) ────────────────────────────────────────────────────

  const remove = React.useCallback(
    async (id: string, force = false): Promise<void> => {
      const prev = templates.find((t) => t._id === id);
      setTemplates((all) => all.filter((t) => t._id !== id));

      try {
        const url = force ? `${base}/${id}?force=true` : `${base}/${id}`;
        const res = await fetch(url, { method: "DELETE", headers });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json.message ?? `Delete failed with HTTP ${res.status}`,
          );
        }
      } catch (err) {
        // Rollback
        if (prev) setTemplates((all) => [prev, ...all]);
        throw err;
      }
    },
    [base, headers, templates],
  );

  return {
    templates,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
  };
}

// ─── Single Template ──────────────────────────────────────────────────────────

export function useEmailTemplate(id: string | null) {
  const { base, headers } = useEmailTemplateApi();
  const [template, setTemplate] = React.useState<IEmailTemplate | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setTemplate(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${base}/${id}`, { headers })
      .then((res) => unwrap<IEmailTemplate>(res))
      .then(setTemplate)
      .catch((err: any) => setError(err.message ?? "Failed to load template"))
      .finally(() => setLoading(false));
  }, [base, id]);

  return { template, loading, error, setTemplate };
}
