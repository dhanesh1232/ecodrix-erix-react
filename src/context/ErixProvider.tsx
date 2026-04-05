"use client";
// src/context/ErixProvider.tsx — Global Ecodrix Platform Provider

import * as React from "react";
import { Ecodrix } from "@ecodrix/erix-api";
import { ErixToastProvider } from "@/toast/ToastContext";
import { ErixToaster } from "@/toast/ErixToaster";
import { ErixEventBusProvider } from "@/events/EventBusContext";
import { ErixRealtimeProvider } from "@/realtime/RealtimeContext";
import type { ErixModule, ErixPlatformConfig, ClientHealth } from "@/types/platform";

// ─── Context Shape ─────────────────────────────────────────────────────────────
interface ErixPlatformContext {
  config:       ErixPlatformConfig;
  /** Typed Ecodrix SDK client — use this for all API calls */
  sdk:          Ecodrix;
  /** Check if a module is enabled */
  hasModule:    (module: ErixModule) => boolean;
  /** Tenant health (lazy-loaded) */
  health:       ClientHealth | null;
  healthLoading: boolean;
  refreshHealth: () => Promise<void>;
}

const ErixCtx = React.createContext<ErixPlatformContext | null>(null);

export function useErix(): ErixPlatformContext {
  const ctx = React.useContext(ErixCtx);
  if (!ctx) throw new Error("useErix must be inside <ErixProvider>");
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
  // The Ecodrix constructor also sets up the Socket.io connection.
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

  const [health, setHealth]           = React.useState<ClientHealth | null>(null);
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

  // Theme injection into <html> data-attribute
  React.useEffect(() => {
    if (config.theme) {
      document.documentElement.setAttribute("data-erix-platform-theme", config.theme);
    }
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
    <ErixEventBusProvider>
      <ErixToastProvider>
        <ErixCtx.Provider value={value}>
          <ErixRealtimeProvider>
            {children}
          </ErixRealtimeProvider>
          <ErixToaster />
        </ErixCtx.Provider>
      </ErixToastProvider>
    </ErixEventBusProvider>
  );
}
