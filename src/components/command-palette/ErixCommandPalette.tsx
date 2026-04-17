"use client";
// src/command-palette/ErixCommandPalette.tsx
// ⌘K command palette — fuzzy search across CRM leads, navigation, actions.

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Search,
  ArrowRight,
  User,
  BarChart2,
  MessageSquare,
  Calendar,
  Mail,
  Loader2,
} from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { useErixNavigate } from "@/routing/RouterContext";
import { useErixClient } from "@/context/ErixProvider";
import { useErixEvent } from "@/events/useErixEvent";
import { useErixEmit } from "@/events/useErixEmit";
import type { ErixRouteConfig } from "@/routing/types";

// ── Theme Configuration ─────────────────────────────────────────────────────
const THEME = {
  colors: {
    backdrop: "rgba(0, 0, 0, 0.4)",
    overlay: "rgba(15, 23, 42, 0.85)", // Slate 900 with alpha
    ring: "rgba(255, 255, 255, 0.1)",
    border: "#1e293b", // Slate 800
    primary: "#6366f1", // Indigo 500
    text: "#f8fafc", // Slate 50
    textMuted: "#94a3b8", // Slate 400
    activeBg: "rgba(99, 102, 241, 0.15)", // Primary with alpha
    kbdBg: "#1e293b",
  },
  blur: "blur(12px)",
  shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <b key={i} style={{ color: THEME.colors.primary, fontWeight: 700 }}>
            {part}
          </b>
        ) : (
          part
        ),
      )}
    </>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  group: string;
  onSelect: () => void;
}

export interface ErixCommandPaletteProps {
  /** Module prefix map — same as ErixModuleRouter routes prop */
  routes?: ErixRouteConfig;
  /** Additional custom commands */
  commands?: CommandItem[];
}

export interface ErixCommandPaletteTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

/**
 * Radix-style trigger for the command palette.
 * Sends 'cmd_palette.toggle' to the bus.
 */
export const ErixCommandPaletteTrigger = React.forwardRef<
  HTMLButtonElement,
  ErixCommandPaletteTriggerProps
>(({ asChild, onClick, ...props }, ref) => {
  const emit = useErixEmit();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      {...props}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        emit("cmd_palette.toggle", undefined);
      }}
    />
  );
});
ErixCommandPaletteTrigger.displayName = "ErixCommandPaletteTrigger";

// ── Nav commands factory ──────────────────────────────────────────────────────
function buildNavCommands(
  routes: ErixCommandPaletteProps["routes"] = {},
  navigate: (url: string) => void,
): CommandItem[] {
  const items: CommandItem[] = [];
  if (routes.crm)
    items.push({
      id: "nav-crm",
      label: "Go to CRM",
      group: "Navigation",
      icon: <User size={14} />,
      onSelect: () => navigate(routes.crm!),
    });
  if (routes.analytics)
    items.push({
      id: "nav-analytics",
      label: "Go to Analytics",
      group: "Navigation",
      icon: <BarChart2 size={14} />,
      onSelect: () => navigate(routes.analytics!),
    });
  if (routes.whatsapp)
    items.push({
      id: "nav-whatsapp",
      label: "Go to WhatsApp",
      group: "Navigation",
      icon: <MessageSquare size={14} />,
      onSelect: () => navigate(routes.whatsapp!),
    });
  if (routes.meetings)
    items.push({
      id: "nav-meetings",
      label: "Go to Meetings",
      group: "Navigation",
      icon: <Calendar size={14} />,
      onSelect: () => navigate(routes.meetings!),
    });
  if (routes.marketing)
    items.push({
      id: "nav-marketing",
      label: "Go to Marketing",
      group: "Navigation",
      icon: <Mail size={14} />,
      onSelect: () => navigate(routes.marketing!),
    });
  return items;
}

// ── Main component ────────────────────────────────────────────────────────────
export const ErixCommandPalette = React.forwardRef<
  HTMLDivElement,
  ErixCommandPaletteProps & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>((props, ref) => {
  const {
    routes = {},
    commands: extraCommands = [],
    open: controlledOpen,
    onOpenChange: setControlledOpen,
  } = props;
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (val: boolean | ((o: boolean) => boolean)) => {
      const next = typeof val === "function" ? val(open) : val;
      if (setControlledOpen) setControlledOpen(next);
      else setInternalOpen(next);
    },
    [controlledOpen, open, setControlledOpen],
  );

  // Handle bus events
  useErixEvent("cmd_palette.toggle", () => setOpen((o) => !o));
  useErixEvent("cmd_palette.open", () => setOpen(true));
  useErixEvent("cmd_palette.close", () => setOpen(false));

  const [query, setQuery] = React.useState("");
  const [leads, setLeads] = React.useState<CommandItem[]>([]);
  const [searching, setSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useErixNavigate();
  const sdk = useErixClient();

  // Toggle on ⌘K / Ctrl+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  // Live lead search
  React.useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setLeads([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res: any = await sdk.crm.leads.list({ search: query, limit: 5 });
        const items = (res?.data ?? []).map(
          (l: any): CommandItem => ({
            id: `lead-${l._id}`,
            label: `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || l.phone,
            sublabel: l.phone,
            group: "CRM Leads",
            icon: <User size={14} />,
            onSelect: () => {
              navigate(`${routes.crm ?? "/crm"}/${l._id}`);
              setOpen(false);
            },
          }),
        );
        setLeads(items);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, sdk, routes.crm, navigate]);

  const navCommands = React.useMemo(
    () =>
      buildNavCommands(routes, (url) => {
        navigate(url);
        setOpen(false);
      }),
    [routes, navigate],
  );

  // All visible commands
  const allCommands = React.useMemo<CommandItem[]>(() => {
    const base = [...navCommands, ...extraCommands];
    const q = query.toLowerCase();
    const nav = q
      ? base.filter((c) => c.label.toLowerCase().includes(q))
      : base;
    return [...leads, ...nav];
  }, [leads, navCommands, extraCommands, query]);

  // Group the commands
  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const cmd of allCommands) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    }
    return [...map.entries()];
  }, [allCommands]);

  const [active, setActive] = React.useState(0);
  React.useEffect(() => setActive(0), [allCommands]);

  const flat = allCommands;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter") {
      flat[active]?.onSelect();
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: THEME.colors.backdrop,
        backdropFilter: THEME.blur,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
      }}
      onClick={() => setOpen(false)}
    >
      <style>{`
        @keyframes erix-palette-in {
          from { opacity: 0; transform: scale(0.97) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .erix-palette-container {
          animation: erix-palette-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .erix-palette-scrollbar::-webkit-scrollbar { width: 6px; }
        .erix-palette-scrollbar::-webkit-scrollbar-thumb { 
          background: ${THEME.colors.border}; 
          border-radius: 10px; 
        }
      `}</style>
      <div
        className="erix-palette-container"
        style={{
          background: THEME.colors.overlay,
          borderRadius: 16,
          width: "100%",
          maxWidth: 600,
          overflow: "hidden",
          boxShadow: THEME.shadow,
          border: `1px solid ${THEME.colors.ring}`,
          color: THEME.colors.text,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${THEME.colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", width: 20 }}>
            {searching ? (
              <Loader2
                size={18}
                style={{
                  animation: "spin 1s linear infinite",
                  color: THEME.colors.primary,
                }}
              />
            ) : (
              <Search size={18} style={{ color: THEME.colors.textMuted }} />
            )}
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, navigate modules…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: THEME.colors.text,
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "inherit",
            }}
          />
          <kbd
            style={{
              fontSize: 10,
              color: THEME.colors.textMuted,
              background: THEME.colors.kbdBg,
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 2px 0 rgba(0,0,0,0.2)",
              fontFamily: "sans-serif",
              letterSpacing: 0.5,
              fontWeight: 600,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          className="erix-palette-scrollbar"
          style={{
            maxHeight: 420,
            overflowY: "auto",
            padding: "8px 12px 12px",
          }}
        >
          {grouped.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Search size={32} style={{ color: THEME.colors.border }} />
              <div
                style={{
                  color: THEME.colors.textMuted,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {query
                  ? `No results for "${query}"`
                  : "Start typing to search..."}
              </div>
            </div>
          )}
          {grouped.map(([group, items]) => (
            <div key={group}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: THEME.colors.textMuted,
                  padding: "16px 12px 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 12,
                    background: THEME.colors.border,
                    borderRadius: 1,
                  }}
                />
                {group}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {items.map((cmd) => {
                  const idx = flat.indexOf(cmd);
                  const isActive = active === idx;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={cmd.onSelect}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        background: isActive
                          ? THEME.colors.activeBg
                          : "transparent",
                        transition: "all 0.15s ease",
                        color: THEME.colors.text,
                        textAlign: "left",
                        outline: "none",
                        transform: isActive ? "translateX(2px)" : "none",
                      }}
                      onMouseEnter={() => setActive(idx)}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isActive
                            ? "rgba(255,255,255,0.05)"
                            : THEME.colors.border,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isActive
                            ? THEME.colors.primary
                            : THEME.colors.textMuted,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {cmd.icon}
                      </div>
                      <span style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: isActive ? 600 : 500,
                          }}
                        >
                          <HighlightMatch text={cmd.label} query={query} />
                        </div>
                        {cmd.sublabel && (
                          <div
                            style={{
                              fontSize: 12,
                              color: THEME.colors.textMuted,
                              marginTop: 1,
                            }}
                          >
                            <HighlightMatch text={cmd.sublabel} query={query} />
                          </div>
                        )}
                      </span>
                      <ArrowRight
                        size={14}
                        style={{
                          color: THEME.colors.primary,
                          opacity: isActive ? 1 : 0,
                          transform: isActive
                            ? "translateX(0)"
                            : "translateX(-5px)",
                          transition: "all 0.2s ease",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: `1px solid ${THEME.colors.border}`,
            display: "flex",
            alignItems: "center",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <kbd
                style={{
                  fontSize: 9,
                  padding: "1px 4px",
                  background: THEME.colors.border,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                ↵
              </kbd>
              <span
                style={{
                  fontSize: 10,
                  color: THEME.colors.textMuted,
                  fontWeight: 500,
                }}
              >
                Select
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", gap: 2 }}>
                <kbd
                  style={{
                    fontSize: 9,
                    padding: "1px 4px",
                    background: THEME.colors.border,
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  ↑
                </kbd>
                <kbd
                  style={{
                    fontSize: 9,
                    padding: "1px 4px",
                    background: THEME.colors.border,
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  ↓
                </kbd>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: THEME.colors.textMuted,
                  fontWeight: 500,
                }}
              >
                Navigate
              </span>
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 600,
              color: THEME.colors.primary,
              opacity: 0.8,
              letterSpacing: 0.5,
            }}
          >
            ERIX SEARCH
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});
