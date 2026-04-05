// src/context/editor.tsx
"use client";
import * as React from "react";
import { ErixChain } from "@/core/chain";
import { ErixEngine } from "@/core/engine";
import { cn } from "@/lib/utils";
import type {
  EditorLoader,
  ErixContextState,
  ErixEvents,
  ErixThemeTokens,
  SlashCommand,
} from "@/types/erix";

// ─── Default context ──────────────────────────────────────────────────────────
const DEFAULT_CTX: ErixContextState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  link: false,
  blockTag: "p",
  isHeading1: false,
  isHeading2: false,
  isHeading3: false,
  isHeading4: false,
  isHeading5: false,
  isHeading6: false,
  isParagraph: true,
  isBlockquote: false,
  isCodeBlock: false,
  isList: false,
  isOrderedList: false,
  isTaskList: false,
  textAlign: "left",
  foreColor: "",
  backColor: "",
  hasSelection: false,
  selectionRect: null,
  canUndo: false,
  canRedo: false,
  isIndented: false,
  isEmbed: false,
  isNonEditable: false,
  isInTable: false,
  fontSize: "",
  fontFamily: "",
  activeImage: null,
};

// ─── Shape ────────────────────────────────────────────────────────────────────
export type ErixEditorContextShape = {
  engine: ErixEngine | null;
  chain: () => ErixChain;
  ctx: ErixContextState;
  html: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  // Menus
  bubbleVisible: boolean;
  bubblePos: { x: number; y: number } | null;
  slashVisible: boolean;
  slashQuery: string;
  slashPos: { x: number; y: number } | null;
  closeSlash: () => void;
  linkPickerVisible: boolean;
  setLinkPickerVisible: (v: boolean) => void;
  imagePickerVisible: boolean;
  setImagePickerVisible: (v: boolean) => void;
  aiVisible: boolean;
  setAiVisible: (v: boolean) => void;
  closeAllMenus: () => void;
  // Position helpers
  bubbleSide: "top" | "bottom";
  menuContainerRef: React.RefObject<HTMLDivElement | null>;
  // Styling & Config
  style?: ErixEditorProviderProps["style"];
  theme?: ErixEditorProviderProps["theme"];
  apiUrl: string;
  clientCode: string;
  apiKey: string;
  shortcutsEnabled: boolean;
  isApiValid: boolean;
  isApiValidating: boolean;
};

export const useErixStyle = () => {
  const { style } = useErixEditor();

  const radius = style?.border?.radius ?? "md";
  const shadow = style?.shadow ?? "none";

  const radiusMap: Record<string, string> = {
    none: "erix-rounded-none",
    sm: "erix-rounded-sm",
    md: "erix-rounded-md",
    lg: "erix-rounded-lg",
    xl: "erix-rounded-xl",
    "2xl": "erix-rounded-2xl",
  };

  const shadowMap: Record<string, string> = {
    none: "erix-shadow-none",
    sm: "erix-shadow-sm",
    md: "erix-shadow-md",
    lg: "erix-shadow-lg",
    xl: "erix-shadow-xl",
  };

  // Optical adjustment for nested buttons (usually one step down)
  const buttonRadiusMap: Record<string, string> = {
    none: "erix-rounded-none",
    sm: "erix-rounded-none",
    md: "erix-rounded-sm",
    lg: "erix-rounded-md",
    xl: "erix-rounded-lg",
    "2xl": "erix-rounded-xl",
  };

  return {
    containerRadius: radiusMap[radius] ?? radiusMap.md,
    popoverRadius: radiusMap[radius] ?? radiusMap.md,
    buttonRadius: buttonRadiusMap[radius] ?? buttonRadiusMap.md,
    shadowClass: shadowMap[shadow] ?? shadowMap.none,
  };
};

const ErixContext = React.createContext<ErixEditorContextShape | null>(null);

export const useErixEditor = () => {
  const ctx = React.useContext(ErixContext);
  if (!ctx)
    throw new Error("useErixEditor must be inside <ErixEditorProvider>");
  return ctx;
};

// ─── Provider Props ───────────────────────────────────────────────────────────
export interface ErixEditorProviderProps {
  initialContent?: string;
  placeholder?: string;
  theme?: "light" | "dark" | Record<string, string>;
  tokens?: ErixThemeTokens;
  onChange?: (html: string) => void;
  onContext?: (ctx: ErixContextState) => void;
  slashCommands?: SlashCommand[];
  shortcutsEnabled?: boolean;
  readonly?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  apiKey?: string;
  apiUrl?: string;
  clientCode?: string;
  style?: {
    height?: string | number;
    border?: { width?: number; radius?: string; color?: string };
    shadow?: "none" | "sm" | "md" | "lg" | "xl";
    bg?: string;
    fg?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export const ErixEditorProvider: React.FC<ErixEditorProviderProps> = ({
  initialContent = "",
  placeholder = "Type '/' for commands…",
  theme = "light",
  tokens,
  onChange,
  onContext,
  onFocus,
  onBlur,
  readonly = false,
  style,
  className,
  shortcutsEnabled = true,
  apiKey = "",
  apiUrl = "https://api.ecodrix.com",
  clientCode = "default",
  children,
}) => {
  const [isApiValid, setIsApiValid] = React.useState(true);
  const [isApiValidating, setIsApiValidating] = React.useState(false);

  // Simple validation logic
  React.useEffect(() => {
    if (!apiKey) return;
    setIsApiValidating(true);
    const timer = setTimeout(() => {
      // In dev, we accept ERIX-DEV-KEY or any 32+ char string
      const isValid = apiKey === "ERIX-DEV-KEY" || apiKey.length >= 32;
      setIsApiValid(isValid);
      setIsApiValidating(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [apiKey]);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const engineRef = React.useRef<ErixEngine | null>(null);
  const [engine, setEngine] = React.useState<ErixEngine | null>(null);
  const [ctx, setCtx] = React.useState<ErixContextState>(DEFAULT_CTX);
  const [html, setHtml] = React.useState(initialContent);
  const [isFocused, setIsFocused] = React.useState(false);

  // ─── Theme Synchronization Bridge ──────────────────────────────────────────
  React.useEffect(() => {
    if (!engine) return;

    const syncTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      const rootStyle = getComputedStyle(root);

      // Mapping: Editor Token Key -> [Preferred Host CSS Variable Names]
      const mappings: Record<string, string[]> = {
        background: [
          "--background",
          "--erxi-bg-background",
          "--editor-bg",
          "--bg-background",
        ],
        foreground: [
          "--foreground",
          "--erxi-text-foreground",
          "--editor-fg",
          "--text-foreground",
        ],
        muted: ["--muted", "--erxi-bg-muted", "--bg-muted"],
        "muted-foreground": [
          "--muted-foreground",
          "--erxi-text-muted-foreground",
          "--text-muted-foreground",
        ],
        popover: ["--popover", "--erxi-bg-popover", "--bg-popover"],
        border: ["--border", "--erxi-border-color", "--border-input"],
        primary: ["--primary", "--erxi-color-primary", "--brand-primary"],
        "primary-foreground": [
          "--primary-foreground",
          "--erxi-color-primary-foreground",
        ],
      };

      const base: Record<string, string> = {};
      Object.entries(mappings).forEach(([target, sources]) => {
        for (const src of sources) {
          const val = rootStyle.getPropertyValue(src).trim();
          if (val) {
            base[target] = val;
            break;
          }
        }
      });

      if (Object.keys(base).length > 0) {
        engine.applyTokens({ base });
      }

      // Detect dark mode from common patterns
      const isDark =
        root.classList.contains("dark") ||
        body.classList.contains("dark") ||
        root.getAttribute("data-theme") === "dark" ||
        root.getAttribute("data-erix-theme") === "dark";

      engine.setTheme(isDark ? "dark" : "light");
    };

    // Initial sync
    syncTheme();

    // Observe root for theme changes (classes or data-attributes)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (
          m.type === "attributes" &&
          (m.attributeName === "class" ||
            m.attributeName === "data-theme" ||
            m.attributeName === "data-erix-theme")
        ) {
          syncTheme();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-erix-theme"],
    });

    return () => observer.disconnect();
  }, [engine]);

  // Bubble menu
  const [bubblePos, setBubblePos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const bubbleVisible = !!(ctx.hasSelection && bubblePos);

  // Slash command menu
  const [slashVisible, setSlashVisible] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState("");
  const [slashPos, setSlashPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  // Link / Image pickers
  const [linkPickerVisible, setLinkPickerVisible] = React.useState(false);
  const [imagePickerVisible, setImagePickerVisible] = React.useState(false);
  const [aiVisible, setAiVisible] = React.useState(false);
  const [bubbleSide, setBubbleSide] = React.useState<"top" | "bottom">("top");
  const menuContainerRef = React.useRef<HTMLDivElement>(null);

  const closeAllMenus = React.useCallback(() => {
    setSlashVisible(false);
    setLinkPickerVisible(false);
    setImagePickerVisible(false);
    setAiVisible(false);
    // Any other global popovers managed here
  }, []);

  const stableOnChange = React.useRef(onChange);
  const stableOnContext = React.useRef(onContext);
  React.useEffect(() => {
    stableOnChange.current = onChange;
  }, [onChange]);
  React.useEffect(() => {
    stableOnContext.current = onContext;
  }, [onContext]);

  // ── Init engine ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!iframeRef.current || engineRef.current) return;

    const eng = new ErixEngine({
      iframe: iframeRef.current,
      initialContent: initialContent || "<p><br></p>",
      placeholder,
      theme,
      shortcuts: shortcutsEnabled,
      apiKey,
      onUpdate: (h) => {
        setHtml(h);
        stableOnChange.current?.(h);
      },
      onContext: (c) => {
        setCtx(c);
        stableOnContext.current?.(c);
        // Bubble menu visibility & Smart Positioning
        if (c.hasSelection && c.selectionRect) {
          const iframe = iframeRef.current;
          if (!iframe) return;

          // Selection is at top if y < 40 (approx bubble height)
          // We use selectionRect.y which is relative to iframe top
          const isAtTop = (c.selectionRect.y || 0) < 50;
          setBubbleSide(isAtTop ? "bottom" : "top");

          // Position relative to the internal wrapper (starts at iframe top)
          setBubblePos({
            x: c.selectionRect.x + c.selectionRect.width / 2,
            y: isAtTop
              ? c.selectionRect.y + c.selectionRect.height + 8 // Below selection
              : c.selectionRect.y - 8, // Above selection
          });
        } else {
          setBubblePos(null);
        }
      },
    });

    eng.on("slashOpen", (d) => {
      setSlashVisible(true);
      setSlashQuery(d.query);
      // Position relative to internal wrapper (starts at iframe top)
      setSlashPos({
        x: d.x,
        y: d.y + 24,
      });
    });

    eng.on("slashQuery", (d) => setSlashQuery(d.query));
    eng.on("slashClose", () => {
      setSlashVisible(false);
      setSlashQuery("");
    });
    eng.on("linkOpen", () => setLinkPickerVisible(true));
    eng.on("imageOpen", () => setImagePickerVisible(true));
    eng.on("clickOutside", () => closeAllMenus());
    eng.on("focusIn", () => onFocus?.());
    eng.on("focusOut", () => onBlur?.());
    eng.on("dropImage", ({ dataUrl, name }) => {
      // If API available, upload and replace; otherwise the preview is already inserted
      if (apiUrl && apiKey) {
        const _formData = new FormData();
        fetch(`data:${name}`, { mode: "no-cors" }); // no-op, just a hook for host override
        // Emit a custom event so the host's ImagePickerNative can intercept and upload
        window.dispatchEvent(
          new CustomEvent("erix:drop-image", {
            detail: { dataUrl, name, engine: eng },
          }),
        );
      }
    });

    if (readonly) eng.setReadOnly(true);

    eng.init();
    engineRef.current = eng;
    setEngine(eng);

    return () => {
      eng.destroy();
      engineRef.current = null;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    theme,
    shortcutsEnabled,
    onFocus,
    readonly,
    onBlur,
    apiUrl,
    placeholder,
    initialContent,
    closeAllMenus,
    apiKey,
  ]);

  // ── Sync initialContent changes ──────────────────────────────────────
  React.useEffect(() => {
    if (engineRef.current && initialContent !== undefined) {
      engineRef.current.setHTML(initialContent || "<p><br></p>");
    }
  }, [initialContent]);

  // ── Apply token overrides when they change ───────────────────────────
  React.useEffect(() => {
    if (tokens && engineRef.current) {
      engineRef.current.applyTokens(tokens);
    }
  }, [tokens]);

  // ── Focus & Global Dismissal ──────────────────────────────────────────
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onEnter = () =>
      window.dispatchEvent(new CustomEvent("erix:iframe-enter"));

    // Host-side dismissal
    const handleHostClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // If clicking inside a menu/picker or a toolbar button, don't dismiss everything
      // We'll use a data-attribute for this
      if (target.closest('[data-erix-ignore-dismiss="true"]')) return;

      // If we have active menus, close them
      closeAllMenus();
    };

    iframe.addEventListener("mouseenter", onEnter);
    window.addEventListener("pointerdown", handleHostClick, true);

    return () => {
      iframe.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("pointerdown", handleHostClick, true);
    };
  }, [closeAllMenus]);

  // ── Styles ────────────────────────────────────────────────────────────
  const h = style?.height ?? "400px";
  const heightStr = typeof h === "number" ? `${h}px` : h;
  const borderWidth = style?.border?.width ?? 1;
  const borderRadius = style?.border?.radius ?? "md";
  const shadow = style?.shadow ?? "none";

  const radiusMap: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };
  const shadowMap: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  // Toolbar height to subtract from iframe (42px default)
  const toolbarH = 42;
  const _iframeH = (() => {
    if (heightStr.includes("%")) return `calc(${heightStr} - ${toolbarH}px)`;
    if (heightStr.includes("px"))
      return `${parseFloat(heightStr) - toolbarH}px`;
    return `calc(${heightStr} - ${toolbarH}px)`;
  })();

  const chain = React.useCallback(
    () =>
      engine
        ? new ErixChain(engine)
        : new ErixChain(new Proxy({} as ErixEngine, { get: () => () => {} })),
    [engine],
  );

  return (
    <ErixContext.Provider
      value={{
        engine,
        chain,
        ctx,
        html,
        iframeRef,
        bubbleVisible,
        bubblePos,
        slashVisible,
        slashQuery,
        slashPos,
        closeSlash: () => {
          setSlashVisible(false);
          setSlashQuery("");
        },
        linkPickerVisible,
        setLinkPickerVisible,
        imagePickerVisible,
        setImagePickerVisible,
        aiVisible,
        setAiVisible,
        closeAllMenus,
        bubbleSide,
        menuContainerRef,
        style,
        theme,
        apiUrl,
        clientCode,
        apiKey,
        shortcutsEnabled,
        isApiValid,
        isApiValidating,
      }}
    >
      <div
        role="presentation"
        data-erix-editor
        data-focused={isFocused}
        style={{ height: heightStr, borderWidth: `${borderWidth}px` }}
        className={cn(
          "erix-relative erix-w-full erix-max-w-full erix-overflow-hidden",
          "erix-border erix-border-border erix-transition-all erix-duration-200",
          "erix-ring-0 data-[focused=true]:erix-ring-2 erix-ring-primary/60",
          "hover:erix-border-primary/60",
          radiusMap[borderRadius] ?? "erix-rounded-md",
          shadowMap[shadow] ?? "erix-shadow-none",
          theme === "dark" ? "erix-dark dark" : "erix-light",
          className,
        )}
        onMouseEnter={() => setIsFocused(true)}
        onMouseLeave={() => setIsFocused(false)}
      >
        <div className="erix-flex erix-flex-col erix-w-full erix-h-full erix-overflow-hidden">
          {/* Toolbar slot */}
          <div className="erix-shrink-0 erix-w-full">{children}</div>

          {/* Iframe & Menu Container */}
          <div
            ref={menuContainerRef}
            className="erix-relative erix-flex-1 erix-w-full erix-h-full erix-overflow-hidden"
          >
            <iframe
              ref={iframeRef}
              style={{ height: "100%" }} // Now fills the relative container
              className="erix-block erix-w-full erix-border-0 erix-bg-background erix-min-h-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              title="Erix rich text editor"
            />
          </div>
        </div>
      </div>
    </ErixContext.Provider>
  );
};
