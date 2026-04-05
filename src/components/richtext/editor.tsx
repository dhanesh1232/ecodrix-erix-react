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

// ─── Loader ───────────────────────────────────────────────────────────────────
const EditorSkeleton: React.FC = () => (
  <div className="erix-w-full erix-h-full erix-rounded-xl erix-border erix-border-border erix-bg-background erix-animate-pulse erix-overflow-hidden">
    <div className="erix-h-10 erix-border-b erix-border-border erix-bg-muted/30" />
    <div className="erix-p-4 erix-space-y-3">
      {[100, 80, 95, 60, 85].map((w, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton heights
          key={`skel-${index}`}
          className="erix-h-3 erix-rounded-full erix-bg-muted"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ErixEditorProps
  extends Omit<ErixEditorProviderProps, "children"> {
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
  /** Loading state indicator */
  loader?: "skeleton" | "none";
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
export const ErixEditor: React.FC<ErixEditorProps> = ({
  toolbar,
  bubbleMenu = true,
  slashMenu = true,
  slashCommands = DEFAULT_SLASH_COMMANDS,
  aiProvider,
  loader = "skeleton",
  apiKey,
  shortcutsEnabled = true,
  style,
  apiUrl,
  clientCode,
  ...providerProps
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [_isValidated, _setIsValidated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!mounted && loader === "skeleton") return <EditorSkeleton />;

  return (
    <ErixEditorProvider
      apiKey={apiKey}
      apiUrl={apiUrl}
      clientCode={clientCode}
      shortcutsEnabled={shortcutsEnabled}
      style={style}
      {...providerProps}
    >
      <EditorContent
        toolbar={toolbar}
        bubbleMenu={bubbleMenu}
        slashMenu={slashMenu}
        slashCommands={slashCommands}
        aiProvider={aiProvider}
      />
    </ErixEditorProvider>
  );
};

const EditorContent: React.FC<Omit<ErixEditorProps, "loader">> = ({
  toolbar,
  bubbleMenu,
  slashMenu,
  slashCommands,
  aiProvider,
}) => {
  const { aiVisible, setAiVisible, isApiValid, isApiValidating } =
    useErixEditor();

  if (isApiValidating) {
    return (
      <div className="erix-w-full erix-h-full erix-flex erix-items-center erix-justify-center erix-bg-background/80 erix-backdrop-blur-sm erix-z-50">
        <div className="erix-flex erix-flex-col erix-items-center erix-gap-2">
          <div className="erix-w-6 erix-h-6 erix-border-2 erix-border-primary erix-border-t-transparent erix-rounded-full erix-animate-spin" />
          <span className="erix-text-xs erix-font-medium erix-text-muted-foreground">
            Validating SDK...
          </span>
        </div>
      </div>
    );
  }

  if (!isApiValid) {
    return (
      <div className="erix-w-full erix-h-full erix-flex erix-flex-col erix-items-center erix-justify-center erix-bg-destructive/5 erix-text-destructive erix-p-8 erix-text-center">
        <h3 className="erix-font-bold erix-text-lg">Invalid API Key</h3>
        <p className="erix-text-sm erix-opacity-80">
          Your Erix API key is invalid or has expired. Please check your
          credentials at console.ecodrix.com.
        </p>
      </div>
    );
  }

  return (
    <>
      <ToolbarChain
        {...toolbar}
        ai={!!(toolbar?.ai ?? !!aiProvider)}
        onAiClick={() => setAiVisible(true)}
      />

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
  );
};

// Legacy compat alias
export const RichtextEditor = ErixEditor;
