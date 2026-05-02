"use client";
// src/lib/emailTemplateClient.ts
// Thin fetch bridge for email template endpoints.
// Reads auth config from ErixProvider context — no changes to @ecodrix/erix-api needed.
//
// Long-term: replace with sdk.marketing.emailTemplates.* once erix-api grows that namespace.

import { useErix } from "@/context/ErixProvider";

export interface ApiHeaders extends Record<string, string> {
  "x-api-key": string;
  "x-client-code": string;
  "Content-Type": string;
}

export interface EmailTemplateApiClient {
  base: string;
  headers: ApiHeaders;
}

/**
 * Returns the base URL and auth headers for email template requests.
 * Reads directly from ErixPlatformConfig exposed by ErixProvider.
 * Must be called inside a component/hook that is a descendant of <ErixProvider>.
 */
export function useEmailTemplateApi(): EmailTemplateApiClient {
  // useErix() returns { config, sdk, ... } — config has baseUrl, apiKey, clientCode
  const { config } = useErix();

  const baseUrl = config.baseUrl ?? "https://api.ecodrix.com";
  const base = `${baseUrl}/api/saas/marketing/mail/templates`;

  const headers: ApiHeaders = {
    "x-api-key": config.apiKey,
    "x-client-code": config.clientCode,
    "Content-Type": "application/json",
  };

  return { base, headers };
}

// ─── Response helpers ──────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Unwrap a JSON response body, throwing on HTTP errors or success=false.
 */
export async function unwrap<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return json.data;
}
