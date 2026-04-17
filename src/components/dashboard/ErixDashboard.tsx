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
  import("@/components/crm/KanbanBoard").then((m) => ({
    default: m.KanbanBoard,
  })),
);
const AnalyticsDashboard = React.lazy(() =>
  import("@/components/analytics/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  })),
);
const WhatsAppInbox = React.lazy(() =>
  import("@/components/whatsapp/WhatsAppInbox").then((m) => ({
    default: m.WhatsAppInbox,
  })),
);
const MeetingList = React.lazy(() =>
  import("@/components/meet/MeetingList").then((m) => ({
    default: m.MeetingList,
  })),
);
const WhatsAppBroadcast = React.lazy(() =>
  import("@/components/whatsapp/WhatsAppBroadcast").then((m) => ({
    default: m.WhatsAppBroadcast,
  })),
);
const ErixCommandPalette = React.lazy(() =>
  import("@/components/command-palette/ErixCommandPalette").then((m) => ({
    default: m.ErixCommandPalette,
  })),
);

export type ActiveView =
  | "overview"
  | "crm"
  | "analytics"
  | "whatsapp"
  | "marketing"
  | "meetings"
  | "editor";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  module?: ErixModule;
  badge?: string | number;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "crm", label: "CRM", icon: Users, module: "crm" },
  { id: "analytics", label: "Analytics", icon: BarChart3, module: "analytics" },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    module: "whatsapp",
  },
  { id: "marketing", label: "Marketing", icon: Mail, module: "marketing" },
  { id: "meetings", label: "Meetings", icon: Calendar, module: "meetings" },
  { id: "editor", label: "Editor", icon: FileText, module: "editor" },
];

// ─── Health dot ───────────────────────────────────────────────────────────────
function HealthDot() {
  const { health, healthLoading } = useErix();
  if (healthLoading)
    return (
      <Circle className="erix-size-3 erix-animate-pulse erix-text-muted-foreground" />
    );
  if (!health) return <AlertCircle className="erix-size-3 erix-text-red-400" />;
  const allOk = Object.values(health.services).every(
    (s) => s !== "not_configured",
  );
  return allOk ? (
    <CheckCircle2 className="erix-size-3 erix-text-emerald-400" />
  ) : (
    <AlertCircle className="erix-size-3 erix-text-amber-400" />
  );
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
    <header className="erix-flex erix-h-14 erix-shrink-0 erix-items-center erix-gap-3 erix-border-b erix-border-border erix-bg-card/80 px-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={toggle}
        className="erix-rounded-lg erix-p-2 erix-text-muted-foreground hover:erix-bg-muted hover:erix-text-foreground transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="erix-size-4" />
        ) : (
          <ChevronLeft className="erix-size-4" />
        )}
      </button>

      <div className="min-w-0 erix-flex-1">
        <h1 className="erix-truncate erix-text-sm font-semibold erix-text-foreground">
          {activeLabel}
        </h1>
        <p className="erix-text-xs erix-text-muted-foreground">
          {config.clientCode}
        </p>
      </div>

      {/* Search trigger */}
      <button
        type="button"
        onClick={onSearchOpen}
        className="erix-flex erix-items-center erix-gap-2 erix-rounded-lg erix-border erix-border-border erix-bg-muted/40 px-3 py-1.5 erix-text-xs erix-text-muted-foreground hover:erix-bg-muted hover:erix-text-foreground transition-colors"
        title="Search (⌘K)"
      >
        <Search className="erix-size-3.5" />
        <span className="erix-hidden sm:erix-inline">Search</span>
        <kbd className="erix-hidden sm:erix-inline erix-rounded erix-bg-muted px-1 font-mono erix-text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Health badge */}
      {health && (
        <div className="erix-hidden md:erix-flex erix-items-center erix-gap-2 erix-rounded-lg erix-border erix-border-border erix-bg-muted/40 px-3 py-1.5">
          <HealthDot />
          <div className="erix-flex erix-items-center erix-gap-1.5 erix-text-xs">
            {Object.entries(health.services).map(([svc, status]) => (
              <span
                key={svc}
                className={cn(
                  "erix-capitalize",
                  status === "not_configured"
                    ? "erix-text-amber-400"
                    : "erix-text-emerald-400",
                )}
              >
                {svc === "whatsapp"
                  ? "WA"
                  : svc === "googleMeet"
                    ? "GCal"
                    : svc}
              </span>
            ))}
          </div>
          {health.queueDepth > 0 && (
            <span className="erix-flex erix-items-center erix-gap-1 erix-text-xs erix-text-amber-400">
              <Zap className="erix-size-3" />
              {health.queueDepth}
            </span>
          )}
        </div>
      )}

      {/* Refresh */}
      <button
        type="button"
        onClick={handleRefresh}
        className="erix-rounded-lg erix-p-2 erix-text-muted-foreground hover:erix-bg-muted hover:erix-text-foreground transition-colors"
        title="Refresh platform status"
      >
        <RefreshCw className="erix-size-4" />
      </button>

      {/* Avatar */}
      <div className="erix-flex erix-size-8 erix-shrink-0 erix-items-center erix-justify-center erix-rounded-full erix-bg-gradient-to-br erix-from-primary erix-to-violet-500 erix-text-xs font-bold erix-text-white">
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
        "erix-flex erix-shrink-0 erix-flex-col erix-border-r erix-border-border erix-bg-card transition-all erix-duration-300",
        collapsed ? "erix-w-16" : "erix-w-56",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "erix-flex erix-h-14 erix-items-center erix-border-b erix-border-border px-4 erix-gap-2",
          collapsed && "erix-justify-center",
        )}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={appName}
            className="erix-size-7 erix-rounded-lg erix-object-contain"
          />
        ) : (
          <div className="erix-flex erix-size-7 erix-items-center erix-justify-center erix-rounded-lg erix-bg-gradient-to-br erix-from-primary erix-to-violet-500 erix-text-xs font-bold erix-text-white">
            {appName[0]?.toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <span className="erix-truncate erix-text-sm font-bold erix-tracking-tight erix-text-foreground">
            {appName}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="erix-flex-1 erix-overflow-y-auto erix-p-2 space-y-0.5">
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
                "erix-flex erix-w-full erix-items-center erix-rounded-xl px-2.5 py-2 erix-text-sm transition-all",
                collapsed ? "erix-justify-center" : "erix-gap-3",
                isActive
                  ? "erix-bg-primary/10 erix-text-primary font-semibold erix-border erix-border-primary/20"
                  : "erix-text-muted-foreground hover:erix-bg-muted hover:erix-text-foreground",
              )}
            >
              <Icon className="erix-size-4 erix-shrink-0" />
              {!collapsed && (
                <span className="erix-truncate">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && (
                <span className="ml-auto erix-rounded-full erix-bg-primary px-1.5 py-0.5 erix-text-[10px] font-bold erix-text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="erix-border-t erix-border-border erix-p-3">
          <p className="erix-text-[10px] erix-text-muted-foreground erix-text-center">
            Powered by{" "}
            <a
              href="https://ecodrix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:erix-underline"
            >
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
    <div className="erix-flex erix-flex-col erix-gap-6 erix-p-6">
      <div>
        <h2 className="erix-text-2xl font-bold">Welcome back 👋</h2>
        <p className="erix-text-muted-foreground erix-text-sm mt-1">
          {config.branding?.appName ?? config.clientCode} — platform overview
        </p>
      </div>

      {health && (
        <div className="erix-grid erix-gap-4 sm:erix-grid-cols-3">
          {Object.entries(health.services).map(([svc, status]) => (
            <div
              key={svc}
              className="erix-rounded-2xl erix-border erix-border-border erix-bg-card erix-p-4"
            >
              <div className="erix-flex erix-items-center erix-gap-2">
                <div
                  className={cn(
                    "erix-size-2 erix-rounded-full",
                    status === "connected" || status === "configured"
                      ? "erix-bg-emerald-400"
                      : "erix-bg-amber-400",
                  )}
                />
                <p className="erix-text-sm font-medium erix-capitalize">
                  {svc === "googleMeet" ? "Google Meet" : svc}
                </p>
              </div>
              <p
                className={cn(
                  "mt-1 erix-text-xs erix-capitalize",
                  status === "not_configured"
                    ? "erix-text-amber-400"
                    : "erix-text-emerald-400",
                )}
              >
                {status.replace(/_/g, " ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="erix-grid erix-gap-3 sm:erix-grid-cols-2 lg:erix-grid-cols-4">
        {(["crm", "analytics", "whatsapp", "meetings"] as ActiveView[]).map(
          (view) => {
            const item = ALL_NAV_ITEMS.find((n) => n.id === view)!;
            const Icon = item.icon;
            return (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                className="erix-flex erix-flex-col erix-gap-3 erix-rounded-2xl erix-border erix-border-border erix-bg-card erix-p-4 erix-text-left hover:erix-bg-muted/30 hover:erix-border-primary/20 transition-all erix-group"
              >
                <div className="erix-flex erix-size-9 erix-items-center erix-justify-center erix-rounded-xl erix-bg-primary/10 erix-text-primary group-hover:erix-bg-primary/20 transition-colors">
                  <Icon className="erix-size-4" />
                </div>
                <div>
                  <p className="erix-text-sm font-semibold erix-text-foreground">
                    {item.label}
                  </p>
                  <p className="erix-text-xs erix-text-muted-foreground mt-0.5">
                    Open module →
                  </p>
                </div>
              </button>
            );
          },
        )}
      </div>

      <div className="erix-rounded-2xl erix-border erix-border-border erix-bg-gradient-to-br erix-from-primary/10 erix-to-violet-500/10 erix-p-6">
        <div className="erix-flex erix-items-center erix-gap-3">
          <Activity className="erix-size-5 erix-text-primary" />
          <div>
            <p className="erix-text-sm font-semibold">Platform Active</p>
            <p className="erix-text-xs erix-text-muted-foreground">
              {health?.activeAutomations ?? 0} automations ·{" "}
              {health?.queueDepth ?? 0} pending jobs
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
    <div className="erix-flex erix-flex-1 erix-items-center erix-justify-center">
      <div className="erix-flex erix-flex-col erix-items-center erix-gap-3">
        <div className="erix-size-10 erix-animate-spin erix-rounded-full erix-border-2 erix-border-primary erix-border-t-transparent" />
        <p className="erix-text-sm erix-text-muted-foreground">Loading…</p>
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
  const [active, setActive] = React.useState<ActiveView>(defaultView);
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

  const activeItem =
    visibleItems.find((i) => i.id === active) ?? visibleItems[0];

  const renderPanel = () => (
    <React.Suspense fallback={<ModuleLoader />}>
      {active === "overview" && <Overview onNavigate={setActive} />}
      {active === "crm" && (
        <KanbanBoard pipelineId={pipelineId ?? ""} onLeadOpen={onLeadOpen} />
      )}
      {active === "analytics" && <AnalyticsDashboard pipelineId={pipelineId} />}
      {active === "whatsapp" && <WhatsAppInbox onLeadOpen={onLeadOpen} />}
      {active === "marketing" && (
        <div className="erix-flex erix-flex-col erix-gap-6 erix-p-6">
          <div>
            <h2 className="erix-text-2xl font-bold erix-tracking-tight">
              Marketing
            </h2>
            <p className="erix-text-sm erix-text-muted-foreground mt-1">
              Send WhatsApp broadcast campaigns to your lead segments
            </p>
          </div>
          <WhatsAppBroadcast onSuccess={onBroadcastSuccess} />
        </div>
      )}
      {active === "meetings" && <MeetingList />}
      {active === "editor" && (
        <div className="erix-flex erix-h-full erix-items-center erix-justify-center erix-text-muted-foreground">
          <div className="erix-text-center">
            <FileText className="mx-auto erix-size-10 mb-3 erix-opacity-30" />
            <p className="erix-text-sm font-medium">Rich Text Editor</p>
            <p className="erix-text-xs erix-opacity-60 mt-1">
              Use{" "}
              <code className="erix-rounded erix-bg-muted px-1 erix-text-xs">
                &lt;ErixEditor /&gt;
              </code>{" "}
              directly in your layout
            </p>
          </div>
        </div>
      )}
    </React.Suspense>
  );

  return (
    <div
      className={cn(
        "erix-flex erix-overflow-hidden erix-rounded-2xl erix-border erix-border-border erix-bg-background font-sans erix-antialiased",
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
      <div className="erix-flex min-w-0 erix-flex-1 erix-flex-col erix-overflow-hidden">
        <DashboardHeader
          collapsed={collapsed}
          toggle={() => setCollapsed((c) => !c)}
          activeLabel={activeItem?.label ?? "Overview"}
          onSearchOpen={() => setPaletteOpen(true)}
        />
        <main className="erix-flex-1 erix-overflow-auto erix-bg-background">
          {renderPanel()}
        </main>
      </div>

      {/* ⌘K Command Palette */}
      <React.Suspense fallback={null}>
        <ErixCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </React.Suspense>
    </div>
  );
}
