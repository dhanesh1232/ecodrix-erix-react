"use client";
// src/components/dashboard/ErixDashboard.tsx
// Full-featured, embeddable Ecodrix dashboard shell
import * as React from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  Activity,
  Zap,
  Circle,
  AlertCircle,
  CheckCircle2,
  Bell,
  RefreshCw,
} from "lucide-react";
import { useErix } from "@/context/ErixProvider";
import { useErixToast } from "@/toast/useErixToast";
import type { ErixModule } from "@/types/platform";
import { cn } from "@/lib/utils";

// ─── Lazy-loaded module panels ─────────────────────────────────────────────────
const KanbanBoard = React.lazy(() =>
  import("@/components/crm/KanbanBoard").then((m) => ({ default: m.KanbanBoard })),
);
const AnalyticsDashboard = React.lazy(() =>
  import("@/components/analytics/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })),
);
const WhatsAppInbox = React.lazy(() =>
  import("@/components/whatsapp/WhatsAppInbox").then((m) => ({ default: m.WhatsAppInbox })),
);
const MeetingList = React.lazy(() =>
  import("@/components/meet/MeetingList").then((m) => ({ default: m.MeetingList })),
);
const WhatsAppBroadcast = React.lazy(() =>
  import("@/components/whatsapp/WhatsAppBroadcast").then((m) => ({ default: m.WhatsAppBroadcast })),
);
const ErixCommandPalette = React.lazy(() =>
  import("@/command-palette/ErixCommandPalette").then((m) => ({ default: m.ErixCommandPalette })),
);

type ActiveView = "overview" | "crm" | "analytics" | "whatsapp" | "marketing" | "meetings" | "editor";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  module?: ErixModule;
  badge?: string | number;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "crm",        label: "CRM",        icon: Users,         module: "crm" },
  { id: "analytics",  label: "Analytics",  icon: BarChart3,     module: "analytics" },
  { id: "whatsapp",   label: "WhatsApp",   icon: MessageSquare, module: "whatsapp" },
  { id: "marketing",  label: "Marketing",  icon: Mail,          module: "marketing" },
  { id: "meetings",   label: "Meetings",   icon: Calendar,      module: "meetings" },
  { id: "editor",     label: "Editor",     icon: FileText,      module: "editor" },
];

// ─── Health dot ───────────────────────────────────────────────────────────────
function HealthDot() {
  const { health, healthLoading } = useErix();
  if (healthLoading) return <Circle className="size-3 animate-pulse text-muted-foreground" />;
  if (!health) return <AlertCircle className="size-3 text-red-400" />;
  const allOk = Object.values(health.services).every((s) => s !== "not_configured");
  return allOk
    ? <CheckCircle2 className="size-3 text-emerald-400" />
    : <AlertCircle className="size-3 text-amber-400" />;
}

// ─── Header ───────────────────────────────────────────────────────────────────
function DashboardHeader({
  collapsed,
  toggle,
  activeLabel,
  onSearchOpen,
  onRefresh,
}: {
  collapsed: boolean;
  toggle: () => void;
  activeLabel: string;
  onSearchOpen: () => void;
  onRefresh?: () => void;
}) {
  const { config, health, refreshHealth } = useErix();
  const toast = useErixToast();

  const handleRefresh = async () => {
    onRefresh?.();
    await refreshHealth();
    toast.success("Platform status refreshed");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={toggle}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-foreground">{activeLabel}</h1>
        <p className="text-xs text-muted-foreground">{config.clientCode}</p>
      </div>

      {/* Search trigger */}
      <button
        type="button"
        onClick={onSearchOpen}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Search (⌘K)"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline rounded bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
      </button>

      {/* Health badge */}
      {health && (
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
          <HealthDot />
          <div className="flex items-center gap-1.5 text-xs">
            {Object.entries(health.services).map(([svc, status]) => (
              <span key={svc} className={cn("capitalize", status === "not_configured" ? "text-amber-400" : "text-emerald-400")}>
                {svc === "whatsapp" ? "WA" : svc === "googleMeet" ? "GCal" : svc}
              </span>
            ))}
          </div>
          {health.queueDepth > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Zap className="size-3" />
              {health.queueDepth}
            </span>
          )}
        </div>
      )}

      {/* Refresh */}
      <button
        type="button"
        onClick={handleRefresh}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Refresh platform status"
      >
        <RefreshCw className="size-4" />
      </button>

      {/* Avatar */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-bold text-white">
        {(config.branding?.appName ?? config.clientCode)[0]?.toUpperCase()}
      </div>
    </header>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  collapsed,
  active,
  setActive,
  items,
}: {
  collapsed: boolean;
  active: ActiveView;
  setActive: (v: ActiveView) => void;
  items: NavItem[];
}) {
  const { config } = useErix();
  const appName = config.branding?.appName ?? "Ecodrix";
  const logoUrl = config.branding?.logoUrl;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b border-border px-4 gap-2", collapsed && "justify-center")}>
        {logoUrl ? (
          <img src={logoUrl} alt={appName} className="size-7 rounded-lg object-contain" />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-xs font-bold text-white">
            {appName[0]?.toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <span className="truncate text-sm font-bold tracking-tight text-foreground">{appName}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex w-full items-center rounded-xl px-2.5 py-2 text-sm transition-all",
                collapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border p-3">
          <p className="text-[10px] text-muted-foreground text-center">
            Powered by{" "}
            <a href="https://ecodrix.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Ecodrix
            </a>
          </p>
        </div>
      )}
    </aside>
  );
}

// ─── Overview panel ───────────────────────────────────────────────────────────
function Overview({ onNavigate }: { onNavigate: (v: ActiveView) => void }) {
  const { health, config } = useErix();
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {config.branding?.appName ?? config.clientCode} — platform overview
        </p>
      </div>

      {health && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(health.services).map(([svc, status]) => (
            <div key={svc} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", status === "connected" || status === "configured" ? "bg-emerald-400" : "bg-amber-400")} />
                <p className="text-sm font-medium capitalize">{svc === "googleMeet" ? "Google Meet" : svc}</p>
              </div>
              <p className={cn("mt-1 text-xs capitalize", status === "not_configured" ? "text-amber-400" : "text-emerald-400")}>
                {status.replace(/_/g, " ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["crm", "analytics", "whatsapp", "meetings"] as ActiveView[]).map((view) => {
          const item = ALL_NAV_ITEMS.find((n) => n.id === view)!;
          const Icon = item.icon;
          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted/30 hover:border-primary/20 transition-all group"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Open module →</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-violet-500/10 p-6">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Platform Active</p>
            <p className="text-xs text-muted-foreground">
              {health?.activeAutomations ?? 0} automations · {health?.queueDepth ?? 0} pending jobs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Loading fallback ─────────────────────────────────────────────────────────
function ModuleLoader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

// ─── Main ErixDashboard ────────────────────────────────────────────────────────

export interface ErixDashboardProps {
  /**
   * Restrict which modules appear in the sidebar.
   * Defaults to all modules enabled in ErixProvider config.
   */
  modules?: ErixModule[];
  pipelineId?: string;
  defaultView?: ActiveView;
  height?: string;
  onLeadOpen?: (leadId: string) => void;
  onBroadcastSuccess?: () => void;
  className?: string;
}

export function ErixDashboard({
  modules,
  pipelineId,
  defaultView = "overview",
  height = "100vh",
  onLeadOpen,
  onBroadcastSuccess,
  className,
}: ErixDashboardProps) {
  const { hasModule } = useErix();
  const [collapsed, setCollapsed] = React.useState(false);
  const [active, setActive]       = React.useState<ActiveView>(defaultView);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // ⌘K global shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Filter nav items: respect explicit `modules` prop, then hasModule()
  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.module) return true; // "Overview" always shown
    if (modules) return modules.includes(item.module);
    return hasModule(item.module);
  });

  const activeItem = visibleItems.find((i) => i.id === active) ?? visibleItems[0];

  const renderPanel = () => (
    <React.Suspense fallback={<ModuleLoader />}>
      {active === "overview" && <Overview onNavigate={setActive} />}
      {active === "crm" && (
        <KanbanBoard
          pipelineId={pipelineId ?? ""}
          onLeadOpen={onLeadOpen}
        />
      )}
      {active === "analytics" && <AnalyticsDashboard pipelineId={pipelineId} />}
      {active === "whatsapp" && <WhatsAppInbox onLeadOpen={onLeadOpen} />}
      {active === "marketing" && (
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Marketing</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Send WhatsApp broadcast campaigns to your lead segments
            </p>
          </div>
          <WhatsAppBroadcast onSuccess={onBroadcastSuccess} />
        </div>
      )}
      {active === "meetings" && <MeetingList />}
      {active === "editor" && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileText className="mx-auto size-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Rich Text Editor</p>
            <p className="text-xs opacity-60 mt-1">
              Use <code className="rounded bg-muted px-1 text-xs">&lt;ErixEditor /&gt;</code> directly in your layout
            </p>
          </div>
        </div>
      )}
    </React.Suspense>
  );

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border border-border bg-background font-sans antialiased",
        "data-[erix-platform-theme=dark]:dark",
        className,
      )}
      style={{ height }}
    >
      <Sidebar
        collapsed={collapsed}
        active={active}
        setActive={setActive}
        items={visibleItems}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          collapsed={collapsed}
          toggle={() => setCollapsed((c) => !c)}
          activeLabel={activeItem?.label ?? "Overview"}
          onSearchOpen={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-auto bg-background">
          {renderPanel()}
        </main>
      </div>

      {/* ⌘K Command Palette */}
      <React.Suspense fallback={null}>
        <ErixCommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
        />
      </React.Suspense>
    </div>
  );
}
