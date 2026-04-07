"use client";
// src/command-palette/ErixCommandPalette.tsx
// ⌘K command palette — fuzzy search across CRM leads, navigation, actions.

import * as React from "react";
import { createPortal } from "react-dom";
import { Search, ArrowRight, User, BarChart2, MessageSquare, Calendar, Loader2 } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { useErixNavigate } from "@/routing/RouterContext";
import { useErixClient } from "@/context/ErixProvider";
import { useErixEvent } from "@/events/useErixEvent";
import { useErixEmit } from "@/events/useErixEmit";

// ── Types ────────────────────────────────────────────────────────────────────
export interface CommandItem {
  id:       string;
  label:    string;
  sublabel?: string;
  icon?:    React.ReactNode;
  group:    string;
  onSelect: () => void;
}

export interface ErixCommandPaletteProps {
  /** Module prefix map — same as ErixModuleRouter routes prop */
  routes?: Partial<Record<"crm" | "analytics" | "whatsapp" | "meetings", string>>;
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
export const ErixCommandPaletteTrigger = React.forwardRef<HTMLButtonElement, ErixCommandPaletteTriggerProps>(
  ({ asChild, onClick, ...props }, ref) => {
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
  }
);
ErixCommandPaletteTrigger.displayName = "ErixCommandPaletteTrigger";

// ── Nav commands factory ──────────────────────────────────────────────────────
function buildNavCommands(
  routes:   ErixCommandPaletteProps["routes"] = {},
  navigate: (url: string) => void,
): CommandItem[] {
  const items: CommandItem[] = [];
  if (routes.crm)       items.push({ id: "nav-crm",       label: "Go to CRM",       group: "Navigation", icon: <User size={14} />,          onSelect: () => navigate(routes.crm!) });
  if (routes.analytics) items.push({ id: "nav-analytics",  label: "Go to Analytics",  group: "Navigation", icon: <BarChart2 size={14} />,     onSelect: () => navigate(routes.analytics!) });
  if (routes.whatsapp)  items.push({ id: "nav-whatsapp",   label: "Go to WhatsApp",   group: "Navigation", icon: <MessageSquare size={14} />, onSelect: () => navigate(routes.whatsapp!) });
  if (routes.meetings)  items.push({ id: "nav-meetings",   label: "Go to Meetings",   group: "Navigation", icon: <Calendar size={14} />,      onSelect: () => navigate(routes.meetings!) });
  return items;
}

// ── Main component ────────────────────────────────────────────────────────────
export function ErixCommandPalette({ 
  routes = {}, 
  commands: extraCommands = [],
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: ErixCommandPaletteProps & { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((val: boolean | ((o: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(open) : val;
    if (setControlledOpen) setControlledOpen(next);
    else setInternalOpen(next);
  }, [controlledOpen, open, setControlledOpen]);

  // Handle bus events
  useErixEvent("cmd_palette.toggle", () => setOpen((o) => !o));
  useErixEvent("cmd_palette.open",   () => setOpen(true));
  useErixEvent("cmd_palette.close",  () => setOpen(false));

  const [query, setQuery]     = React.useState("");
  const [leads, setLeads]     = React.useState<CommandItem[]>([]);
  const [searching, setSearching] = React.useState(false);
  const inputRef              = React.useRef<HTMLInputElement>(null);
  const navigate              = useErixNavigate();
  const sdk                   = useErixClient();

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
    if (!query.trim() || query.length < 2) { setLeads([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res: any = await sdk.crm.leads.list({ search: query, limit: 5 });
        const items = (res?.data ?? []).map((l: any): CommandItem => ({
          id:       `lead-${l._id}`,
          label:    `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || l.phone,
          sublabel: l.phone,
          group:    "CRM Leads",
          icon:     <User size={14} />,
          onSelect: () => { navigate(`${routes.crm ?? "/crm"}/${l._id}`); setOpen(false); },
        }));
        setLeads(items);
      } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query, sdk, routes.crm, navigate]);

  const navCommands = React.useMemo(() => buildNavCommands(routes, (url) => { navigate(url); setOpen(false); }), [routes, navigate]);

  // All visible commands
  const allCommands = React.useMemo<CommandItem[]>(() => {
    const base  = [...navCommands, ...extraCommands];
    const q     = query.toLowerCase();
    const nav   = q ? base.filter((c) => c.label.toLowerCase().includes(q)) : base;
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
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter")     { flat[active]?.onSelect(); }
  };

  if (!open) return null;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.5)", display: "erix-flex", alignItems: "erix-flex-start", justifyContent: "center", paddingTop: 120 }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ background: "#0f172a", borderRadius: 12, width: "100%", maxWidth: 560, overflow: "erix-hidden", boxShadow: "0 20px 60px rgba(0,0,0,.6)", color: "#e2e8f0" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div style={{ display: "erix-flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #1e293b" }}>
          {searching ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} style={{ color: "#64748b" }} />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, navigate modules…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit" }}
          />
          <kbd style={{ fontSize: 11, color: "#64748b", background: "#1e293b", padding: "2px 6px", borderRadius: 4 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 8 }}>
          {grouped.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>No results</div>
          )}
          {grouped.map(([group, items]) => (
            <div key={group}>
              <div style={{ fontSize: 10, color: "#64748b", padding: "8px 8px 4px", textTransform: "erix-uppercase", letterSpacing: 1 }}>{group}</div>
              {items.map((cmd) => {
                const idx = flat.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={cmd.onSelect}
                    style={{
                      display: "erix-flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                      background: active === idx ? "#1e293b" : "transparent",
                      color: "#e2e8f0", textAlign: "left",
                    }}
                    onMouseEnter={() => setActive(idx)}
                  >
                    <span style={{ color: "#6366f1" }}>{cmd.icon}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 13 }}>{cmd.label}</span>
                      {cmd.sublabel && <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>{cmd.sublabel}</span>}
                    </span>
                    <ArrowRight size={13} style={{ color: "#334155" }} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
