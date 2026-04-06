"use client";
// src/context/ErixProvider.tsx — Global Ecodrix Platform Provider

import * as React from "react";
import { Ecodrix } from "@ecodrix/erix-api";
import { ErixToastProvider } from "@/toast/ToastContext";
import { ErixToaster } from "@/toast/ErixToaster";
import { ErixEventBusProvider } from "@/events/EventBusContext";
import { ErixRealtimeProvider } from "@/realtime/RealtimeContext";
import { NotificationsProvider } from "@/notifications/NotificationsContext";
import { ErixPermissionsProvider } from "@/permissions/PermissionsContext";
import { ErixI18nProvider } from "@/i18n/I18nContext";
import type { ErixModule, ErixPlatformConfig, ClientHealth } from "@/types/platform";

// ─── Context Shape ─────────────────────────────────────────────────────────────

interface ErixPlatformContext {
  config:        ErixPlatformConfig;
  /** Typed Ecodrix SDK client — use this for all API calls */
  sdk:           Ecodrix;
  /** Check if a module is enabled */
  hasModule:     (module: ErixModule) => boolean;
  /** Tenant health (lazy-loaded on mount) */
  health:        ClientHealth | null;
  healthLoading: boolean;
  refreshHealth: () => Promise<void>;
}

const ErixCtx = React.createContext<ErixPlatformContext | null>(null);

export function useErix(): ErixPlatformContext {
  const ctx = React.useContext(ErixCtx);
  if (!ctx) throw new Error("useErix must be used inside <ErixProvider>");
  return ctx;
}

/** Direct access to the typed Ecodrix SDK client. */
export function useErixClient(): Ecodrix {
  return useErix().sdk;
}

// ─── Default modules (all enabled) ────────────────────────────────────────────

const ALL_MODULES: ErixModule[] = [
  "editor",
  "crm",
  "analytics",
  "whatsapp",
  "marketing",
  "meetings",
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface ErixProviderProps {
  config:   ErixPlatformConfig;
  children: React.ReactNode;
}

export function ErixProvider({ config, children }: ErixProviderProps) {
  const enabledModules = config.modules ?? ALL_MODULES;

  // Stable SDK instance — only recreated when credentials change.
  const sdk = React.useMemo(
    () =>
      new Ecodrix({
        apiKey:     config.apiKey,
        clientCode: config.clientCode,
        baseUrl:    config.baseUrl ?? "https://api.ecodrix.com",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.apiKey, config.clientCode, config.baseUrl],
  );

  // Disconnect socket when credentials change or on unmount
  React.useEffect(() => () => sdk.disconnect(), [sdk]);

  const [health, setHealth]               = React.useState<ClientHealth | null>(null);
  const [healthLoading, setHealthLoading] = React.useState(false);

  const refreshHealth = React.useCallback(async () => {
    try {
      setHealthLoading(true);
      const res = await sdk.health.clientHealth();
      setHealth((res as any)?.data ?? res ?? null);
    } catch {
      // Non-fatal — health is informational only
    } finally {
      setHealthLoading(false);
    }
  }, [sdk]);

  // Eagerly fetch health on mount
  React.useEffect(() => { void refreshHealth(); }, [refreshHealth]);

  // Theme injection — sets <html data-erix-platform-theme="dark|light">
  React.useEffect(() => {
    if (config.theme) {
      document.documentElement.setAttribute("data-erix-platform-theme", config.theme);
    }
    return () => {
      document.documentElement.removeAttribute("data-erix-platform-theme");
    };
  }, [config.theme]);

  const hasModule = React.useCallback(
    (module: ErixModule) => enabledModules.includes(module),
    [enabledModules],
  );

  const value = React.useMemo<ErixPlatformContext>(
    () => ({ config, sdk, hasModule, health, healthLoading, refreshHealth }),
    [config, sdk, hasModule, health, healthLoading, refreshHealth],
  );

  return (
    <ErixI18nProvider locale={config.locale ?? "en"}>
      <ErixPermissionsProvider 
        role={config.role ?? (config.permissions ? "custom" : "admin")}
        permissions={config.permissions ?? []}
      >
        <ErixEventBusProvider>

          <ErixToastProvider>
            <ErixCtx.Provider value={value}>
              <ErixRealtimeProvider>
                <NotificationsProvider>
                  {children}
                </NotificationsProvider>
              </ErixRealtimeProvider>
              <ErixToaster />
            </ErixCtx.Provider>
          </ErixToastProvider>
        </ErixEventBusProvider>
      </ErixPermissionsProvider>
    </ErixI18nProvider>
  );
}
