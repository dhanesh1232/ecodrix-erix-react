// src/components/richtext/editor.tsx
"use client";
import * as React from "react";
import {
  ErixEditorProvider,
  type ErixEditorProviderProps,
  useErixEditor,
} from "@/context/editor";
import { AiMenu } from "./menus/AiMenu";
import { BubbleMenu } from "./menus/BubbleMenu";
import { ImageResizer } from "./menus/ImageResizer";
import { DEFAULT_SLASH_COMMANDS, SlashMenu } from "./menus/SlashMenu";
import { TableMenu } from "./menus/TableMenu";
import { ToolbarChain, type ToolbarChainConfig } from "./toolbar/ToolbarChain";
import type { AiProvider, SlashCommand } from "@/types/erix";

// ─── Loader components ────────────────────────────────────────────────────────

/**
 * Full-editor skeleton: mimics the toolbar strip + content lines so the
 * layout shift on first render is invisible to the user.
 */
const EditorSkeleton: React.FC<{ height?: string }> = ({
  height = "400px",
}) => (
  <div
    className="erix-w-full erix-rounded-xl erix-border erix-border-border erix-bg-background erix-overflow-hidden"
    style={{ height }}
    aria-hidden="true"
  >
    {/* Toolbar placeholder */}
    <div className="erix-flex erix-items-center erix-gap-1.5 erix-px-3 erix-h-[42px] erix-border-b erix-border-border erix-bg-muted/20 erix-shrink-0">
      {/* History group */}
      <div className="erix-flex erix-gap-1">
        <div className="erix-h-[26px] erix-w-[26px] erix-rounded erix-bg-muted/60 erix-animate-pulse" />
        <div className="erix-h-[26px] erix-w-[26px] erix-rounded erix-bg-muted/60 erix-animate-pulse" />
      </div>
      <div className="erix-w-px erix-h-3.5 erix-bg-border/50 erix-mx-1" />
      {/* Block type */}
      <div className="erix-h-[26px] erix-w-[56px] erix-rounded erix-bg-muted/60 erix-animate-pulse" />
      <div className="erix-w-px erix-h-3.5 erix-bg-border/50 erix-mx-1" />
      {/* Font group */}
      <div className="erix-h-[26px] erix-w-[46px] erix-rounded erix-bg-muted/60 erix-animate-pulse" />
      <div className="erix-h-[26px] erix-w-[36px] erix-rounded erix-bg-muted/60 erix-animate-pulse" />
      <div className="erix-w-px erix-h-3.5 erix-bg-border/50 erix-mx-1" />
      {/* Format group */}
      {[...Array(5)].map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <div
          key={i}
          className="erix-h-[26px] erix-w-[26px] erix-rounded erix-bg-muted/60 erix-animate-pulse"
        />
      ))}
      <div className="erix-flex-1" />
      {/* Right side overflow btn */}
      <div className="erix-h-[26px] erix-w-[26px] erix-rounded erix-bg-muted/60 erix-animate-pulse" />
    </div>

    {/* Content placeholder */}
    <div className="erix-flex-1 erix-p-5 erix-space-y-3">
      {[92, 78, 88, 55, 82, 68, 75].map((w, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          key={i}
          className="erix-h-[14px] erix-rounded-full erix-bg-muted/50 erix-animate-pulse"
          style={{ width: `${w}%`, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  </div>
);

/**
 * Full-editor spinner overlay: shows on top of the actual editor shell
 * (which has already rendered) while the API key is being validated.
 */
const EditorSpinnerOverlay: React.FC = () => (
  <div className="erix-absolute erix-inset-0 erix-z-50 erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-3 erix-bg-background/85 erix-backdrop-blur-sm erix-rounded-[inherit]">
    <div className="erix-relative erix-flex erix-items-center erix-justify-center">
      {/* Outer ring */}
      <div className="erix-w-9 erix-h-9 erix-rounded-full erix-border-2 erix-border-primary/20" />
      {/* Spinning arc */}
      <div className="erix-absolute erix-w-9 erix-h-9 erix-rounded-full erix-border-2 erix-border-transparent erix-border-t-primary erix-animate-spin" />
    </div>
    <span className="erix-text-[11px] erix-font-medium erix-text-muted-foreground erix-tracking-wide erix-select-none">
      Validating…
    </span>
  </div>
);

/**
 * Blocked-content skeleton used while apiValidating to keep toolbar visible
 * but replace content area with a breathing skeleton.
 */
const ContentSkeleton: React.FC = () => (
  <div className="erix-flex-1 erix-p-5 erix-space-y-3">
    {[88, 72, 84, 50, 79, 64, 91].map((w, i) => (
      <div
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        key={i}
        className="erix-h-[14px] erix-rounded-full erix-bg-muted/50 erix-animate-pulse"
        style={{ width: `${w}%`, animationDelay: `${i * 70}ms` }}
      />
    ))}
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ErixEditorProps extends Omit<
  ErixEditorProviderProps,
  "children" | "className" | "toolbarClassName"
> {
  /** Toolbar feature flags */
  toolbar?: ToolbarChainConfig;
  /** Whether to show the bubble menu on selection */
  bubbleMenu?: boolean;
  /** Whether to enable slash command menu */
  slashMenu?: boolean;
  /** Custom slash commands to inject */
  slashCommands?: SlashCommand[];
  /** AI provider for the AI menu */
  aiProvider?: AiProvider;
  /**
   * Loading state indicator shown while the editor is mounting or the API key
   * is being validated.
   *
   * - `"skeleton"` (default) — full-editor skeleton that matches the toolbar +
   *   content proportions, zero layout-shift.
   * - `"spinner"` — translucent overlay with a centered spinner; the editor
   *   shell is still visible in the background.
   * - `"none"` — no loader at all; render the editor immediately.
   */
  loader?: "skeleton" | "spinner" | "none";
  /**
   * CSS injected directly into the editor's iframe `<body>` document.
   *
   * Use this to customise fonts, colours, line-height, or any other visual
   * property of the editable content area — completely isolated from your
   * app's global stylesheet.
   *
   * @example
   * ```tsx
   * contentStyles={`
   *   body { font-family: 'Georgia', serif; font-size: 17px; line-height: 1.9; }
   *   h1, h2 { color: #1a1a2e; }
   *   blockquote { border-left-color: #f59e0b; }
   * `}
   * ```
   */
  contentStyles?: string;
  /** Theme: 'light' | 'dark' */
  theme?: "light" | "dark";
  /** Style overrides */
  style?: {
    height?: string | number;
    border?: { width?: number; radius?: string; color?: string };
    shadow?: "none" | "sm" | "md" | "lg" | "xl";
    bg?: string;
    fg?: string;
  };
  /** API Base URL for media and other services */
  apiUrl?: string;
  /** Unique client identifier */
  clientCode?: string;
  /** Whether to enable markdown shortcuts (# , * , etc) */
  shortcutsEnabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export interface ErixEditorRef {
  engine: any; // ErixEngine | null
  insertContent: (content: string) => void;
  focus: () => void;
}

export const ErixEditor = React.forwardRef<ErixEditorRef, ErixEditorProps>(
  (
    {
      toolbar,
      bubbleMenu = true,
      slashMenu = true,
      slashCommands = DEFAULT_SLASH_COMMANDS,
      aiProvider,
      loader = "none",
      apiKey,
      shortcutsEnabled = true,
      style,
      apiUrl,
      clientCode,
      contentStyles = "",
      ...providerProps
    },
    ref,
  ) => {
    const [mounted, setMounted] = React.useState(false);
    const engineRef = React.useRef<any>(null);

    React.useImperativeHandle(ref, () => ({
      engine: engineRef.current,
      insertContent: (content: string) => {
        engineRef.current?.insertHTML(content);
      },
      focus: () => {
        engineRef.current?.focus();
      },
    }));

    // Give the first paint a single microtask to flush so hydration completes
    // before we swap in the real editor; avoids SSR mismatch warnings.
    React.useEffect(() => {
      const t = setTimeout(() => setMounted(true), 30);
      return () => clearTimeout(t);
    }, []);

    // Derive height string once for the skeleton so it matches the real editor.
    const h = style?.height ?? "400px";
    const heightStr = typeof h === "number" ? `${h}px` : h;

    if (!mounted && loader === "skeleton") {
      return <EditorSkeleton height={heightStr} />;
    }

    // For "none" or already mounted — render the full editor.
    return (
      <ErixEditorProvider
        apiKey={apiKey}
        apiUrl={apiUrl}
        clientCode={clientCode}
        shortcutsEnabled={shortcutsEnabled}
        style={style}
        contentStyles={contentStyles}
        onContext={(ctx) => {
          // Internal synchronization — we don't store the engine here
          // as it's already in the provider's ref, but we could if needed.
          providerProps.onContext?.(ctx);
        }}
        {...providerProps}
      >
        <EditorContent
          toolbar={toolbar}
          bubbleMenu={bubbleMenu}
          slashMenu={slashMenu}
          slashCommands={slashCommands}
          aiProvider={aiProvider}
          loader={loader}
          onEngineReady={(eng) => {
            engineRef.current = eng;
          }}
        />
      </ErixEditorProvider>
    );
  },
);

ErixEditor.displayName = "ErixEditor";

// ─── Inner content (needs context) ───────────────────────────────────────────
interface EditorContentProps {
  toolbar?: ToolbarChainConfig;
  bubbleMenu?: boolean;
  slashMenu?: boolean;
  slashCommands?: SlashCommand[];
  aiProvider?: AiProvider;
  loader?: ErixEditorProps["loader"];
  onEngineReady?: (engine: any) => void;
}

const EditorContent: React.FC<EditorContentProps> = ({
  toolbar,
  bubbleMenu,
  slashMenu,
  slashCommands,
  aiProvider,
  loader,
  onEngineReady,
}) => {
  const { aiVisible, setAiVisible, isApiValid, isApiValidating, engine } =
    useErixEditor();

  React.useEffect(() => {
    if (engine) {
      onEngineReady?.(engine);
    }
  }, [engine, onEngineReady]);

  // API key is invalid — hard block with a clear error state
  if (!isApiValidating && !isApiValid) {
    return (
      <div className="erix-flex-1 erix-flex erix-flex-col erix-items-center erix-justify-center erix-gap-2 erix-bg-destructive/5 erix-text-destructive erix-p-8 erix-text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3 className="erix-font-bold erix-text-base erix-mt-1">
          Invalid API Key
        </h3>
        <p className="erix-text-sm erix-opacity-80 erix-max-w-xs">
          Your Erix API key is invalid or has expired. Check your credentials at{" "}
          <span className="erix-font-medium">console.ecodrix.com</span>.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar — always rendered so layout stays stable during validation */}
      <ToolbarChain
        {...toolbar}
        ai={!!(toolbar?.ai ?? !!aiProvider)}
        onAiClick={() => setAiVisible(true)}
      />

      {/*
       * Content area — when validating, replace the iframe with a skeleton.
       * The spinner overlay (for loader="spinner") sits on top of the real
       * content via absolute positioning inside the outer relative container.
       */}
      {isApiValidating && loader === "skeleton" ? (
        <ContentSkeleton />
      ) : (
        <>
          {isApiValidating && loader === "spinner" && <EditorSpinnerOverlay />}
          {bubbleMenu && <BubbleMenu />}
          <TableMenu />
          <ImageResizer />
          {slashMenu && <SlashMenu commands={slashCommands} />}
          {aiProvider && (
            <AiMenu
              provider={aiProvider}
              visible={aiVisible}
              onClose={() => setAiVisible(false)}
            />
          )}
        </>
      )}
    </>
  );
};

// Legacy compat alias
export const RichtextEditor = ErixEditor;
