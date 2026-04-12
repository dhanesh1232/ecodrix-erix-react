// src/components/richtext/menus/SlashMenu.tsx
"use client";
import {
  ChevronRightSquare,
  Code,
  Columns2,
  Columns3,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image as ImageIcon,
  Info,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Sparkles,
  Table2,
  Type,
  Video as VideoIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";
import type { AiProvider, SlashCommand } from "@/types/erix";

// ─── Default slash commands ────────────────────────────────────────────────────
export const DEFAULT_SLASH_COMMANDS: SlashCommand[] = [
  // Text
  {
    id: "paragraph",
    label: "Text",
    description: "Plain paragraph",
    icon: <Type size={18} />,
    keywords: ["text", "para", "p"],
    group: "basic",
  },
  {
    id: "h1",
    label: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 size={18} />,
    keywords: ["heading", "h1", "title"],
    group: "basic",
  },
  {
    id: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 size={18} />,
    keywords: ["heading", "h2", "section"],
    group: "basic",
  },
  {
    id: "h3",
    label: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 size={18} />,
    keywords: ["heading", "h3"],
    group: "basic",
  },
  {
    id: "h4",
    label: "Heading 4",
    description: "Extra small heading",
    icon: <Heading4 size={18} />,
    keywords: ["heading", "h4"],
    group: "basic",
  },
  {
    id: "h5",
    label: "Heading 5",
    description: "Tiny heading",
    icon: <Heading5 size={18} />,
    keywords: ["heading", "h5"],
    group: "basic",
  },
  {
    id: "h6",
    label: "Heading 6",
    description: "Subtitle heading",
    icon: <Heading6 size={18} />,
    keywords: ["heading", "h6"],
    group: "basic",
  },
  {
    id: "blockquote",
    label: "Quote",
    description: "Capture a quote",
    icon: <Quote size={18} />,
    keywords: ["quote", "blockquote"],
    group: "basic",
  },
  {
    id: "code",
    label: "Code Block",
    description: "Code with syntax colors",
    icon: <Code size={18} />,
    keywords: ["code", "pre", "block"],
    group: "basic",
  },
  // Structure
  {
    id: "ul",
    label: "Bullet List",
    description: "Unordered list",
    icon: <List size={18} />,
    keywords: ["bullet", "list", "ul"],
    group: "basic",
  },
  {
    id: "ol",
    label: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered size={18} />,
    keywords: ["numbered", "ordered", "list"],
    group: "basic",
  },
  {
    id: "task",
    label: "To-do List",
    description: "Checkable task items",
    icon: <ListTodo size={18} />,
    keywords: ["todo", "task", "check"],
    group: "basic",
  },
  {
    id: "hr",
    label: "Divider",
    description: "Horizontal rule",
    icon: <Minus size={18} />,
    keywords: ["divider", "rule", "hr"],
    group: "basic",
  },
  // Media
  {
    id: "image",
    label: "Image",
    description: "Upload or paste an image",
    icon: <ImageIcon size={18} />,
    keywords: ["image", "photo", "img"],
    group: "media",
  },
  {
    id: "video",
    label: "Video",
    description: "Embed a YouTube/Vimeo",
    icon: <VideoIcon size={18} />,
    keywords: ["video", "youtube", "vimeo", "embed"],
    group: "media",
  },
  // Advanced
  {
    id: "table",
    label: "Table",
    description: "Insert a flexible table",
    icon: <Table2 size={18} />,
    keywords: ["table", "grid"],
    group: "advanced",
  },
  {
    id: "columns2",
    label: "2 Columns",
    description: "Two-column layout",
    icon: <Columns2 size={18} />,
    keywords: ["columns", "layout", "2col"],
    group: "advanced",
  },
  {
    id: "columns3",
    label: "3 Columns",
    description: "Three-column layout",
    icon: <Columns3 size={18} />,
    keywords: ["columns", "layout", "3col"],
    group: "advanced",
  },
  {
    id: "callout",
    label: "Callout",
    description: "Highlight important info",
    icon: <Info size={18} />,
    keywords: ["callout", "note", "info", "warning"],
    group: "advanced",
  },
  {
    id: "toggle",
    label: "Toggle",
    description: "Collapsible block",
    icon: <ChevronRightSquare size={18} />,
    keywords: ["toggle", "collapse", "accordion"],
    group: "advanced",
  },
  // AI
  {
    id: "ai",
    label: "AI Assistant",
    description: "Magic writing with AI",
    icon: <Sparkles size={18} />,
    keywords: ["ai", "gpt", "assistant", "magic"],
    group: "ai",
  },
];

const GROUP_LABELS: Record<string, string> = {
  basic: "Basic Blocks",
  media: "Media",
  advanced: "Advanced",
  ai: "AI Magic",
};

// ─── Component ────────────────────────────────────────────────────────────────
export interface SlashMenuProps {
  commands?: SlashCommand[];
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  commands = DEFAULT_SLASH_COMMANDS,
}) => {
  const {
    slashVisible,
    slashQuery,
    slashPos,
    engine,
    closeSlash,
    setAiVisible,
    menuContainerRef,
    iframeRef,
  } = useErixEditor();
  const { buttonRadius, popoverRadius, shadowClass } = useErixStyle();
  const [activeIdx, setActiveIdx] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [adjustedX, setAdjustedX] = React.useState(slashPos?.x || 0);

  // Sync adjustedX when slashPos changes
  React.useEffect(() => {
    if (slashPos) setAdjustedX(slashPos.x);
  }, [slashPos?.x, slashPos]);

  // Horizontal Clamping Logic
  React.useLayoutEffect(() => {
    if (
      !slashVisible ||
      !listRef.current ||
      !menuContainerRef.current ||
      !slashPos
    )
      return;

    const menuRect = listRef.current.getBoundingClientRect();
    const containerRect = menuContainerRef.current.getBoundingClientRect();
    const padding = 12;

    let newX = slashPos.x;

    // Clamp Right
    if (newX + menuRect.width > containerRect.width - padding) {
      newX = containerRect.width - menuRect.width - padding;
    }
    // Clamp Left
    if (newX < padding) {
      newX = padding;
    }

    if (newX !== adjustedX) {
      setAdjustedX(newX);
    }
  }, [slashVisible, slashPos, adjustedX, menuContainerRef]);

  const filtered = React.useMemo(() => {
    if (!slashQuery) return commands;
    const q = slashQuery.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.id.includes(q) ||
        c.keywords.some((k) => k.includes(q)),
    );
  }, [commands, slashQuery]);

  // Reset index on filter change
  React.useEffect(() => setActiveIdx(0), []);

  // Keyboard nav inside menu
  React.useEffect(() => {
    if (!slashVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[activeIdx];
        if (cmd) select(cmd);
      } else if (e.key === "Escape") {
        closeSlash();
      }
    };

    // Listen on both host window AND iframe window to ensure coverage
    window.addEventListener("keydown", handler, { capture: true });
    const iframeWin = iframeRef.current?.contentWindow;
    iframeWin?.addEventListener("keydown", handler, { capture: true });

    return () => {
      window.removeEventListener("keydown", handler, { capture: true });
      iframeWin?.removeEventListener("keydown", handler, { capture: true });
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: select is stable
  }, [slashVisible, filtered, activeIdx, select, closeSlash, iframeRef]);

  // Scroll active item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-slash-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  function select(cmd: SlashCommand) {
    if (cmd.id === "ai") {
      setAiVisible(true);
    } else {
      engine?.executeSlash(cmd.id);
    }
    closeSlash();
  }

  if (!slashVisible || !slashPos || !menuContainerRef.current) return null;

  // Group items
  const groups = new Map<string, SlashCommand[]>();
  for (const cmd of filtered) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)?.push(cmd);
  }

  let globalIdx = 0;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {slashVisible && (
        <motion.div
          ref={listRef}
          key="slash-menu"
          initial={{ opacity: 0, y: 15, scale: 0.92, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 15, scale: 0.92, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 350,
          }}
          role="presentation"
          className={cn(
            "erix-absolute erix-z-100 erix-w-72 erix-max-h-80 erix-overflow-y-auto",
            "erix-bg-popover/90 erix-border erix-border-border erix-py-2 erix-backdrop-blur-xl",
            "erix-scrollbar-thin erix-scrollbar-thumb-border/60",
            popoverRadius,
            shadowClass,
          )}
          style={{ left: adjustedX, top: slashPos.y }}
          data-erix-ignore-dismiss="true"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.length === 0 && (
            <div className="erix-px-4 erix-py-3 erix-text-sm erix-text-muted-foreground">
              No results for &quot;{slashQuery}&quot;
            </div>
          )}

          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group}>
              <div className="erix-px-4 erix-py-2 erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-widest erix-text-muted-foreground/50">
                {GROUP_LABELS[group] ?? group}
              </div>
              {items.map((cmd) => {
                const idx = globalIdx++;
                const isActive = idx === activeIdx;
                return (
                  <button
                    type="button"
                    key={cmd.id}
                    data-slash-idx={idx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(cmd);
                    }}
                    className={cn(
                      "erix-relative erix-w-full erix-flex erix-items-center erix-gap-3 erix-px-3 erix-py-2 erix-text-left erix-transition-colors erix-duration-200",
                      isActive
                        ? "erix-text-primary-foreground"
                        : "hover:erix-bg-accent/40 erix-text-foreground/90",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-bg"
                        className="erix-absolute erix-inset-1 erix-bg-primary -erix-z-10"
                        style={{ borderRadius: "calc(var(--erix-radius) - 2px)" }}
                        transition={{
                          type: "spring",
                          damping: 30,
                          stiffness: 400,
                        }}
                      />
                    )}
                    <motion.span
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        rotate: isActive ? 5 : 0,
                      }}
                      className={cn(
                        "erix-w-9 erix-h-9 erix-flex erix-items-center erix-justify-center erix-text-lg erix-shrink-0 erix-font-mono erix-transition-colors",
                        buttonRadius,
                        isActive
                          ? "erix-bg-white/20"
                          : "erix-bg-muted erix-text-muted-foreground",
                      )}
                    >
                      {cmd.icon}
                    </motion.span>
                    <span className="erix-flex erix-flex-col erix-min-w-0">
                      <span className="erix-text-sm erix-font-semibold erix-leading-snug">
                        {cmd.label}
                      </span>
                      <span
                        className={cn(
                          "erix-text-xs erix-truncate erix-leading-relaxed erix-transition-colors",
                          isActive
                            ? "erix-text-primary-foreground/80"
                            : "erix-text-muted-foreground",
                        )}
                      >
                        {cmd.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    menuContainerRef.current,
  );
};
