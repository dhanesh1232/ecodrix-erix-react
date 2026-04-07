"use client";
/**
 * ToolbarChain.tsx — Compact, overflow-aware Erix toolbar
 *
 * Selection-preservation contract:
 *   Every interactive element in the toolbar that is NOT a contenteditable
 *   must call `e.preventDefault()` on its `onMouseDown` handler. This stops
 *   the browser from moving focus off the editor iframe, which would destroy
 *   the text selection needed for formatting commands.
 *
 *   ToolbarBtn already does this. For plain <button> elements (BlockDropdown
 *   trigger, MiniDropdown trigger, sub-popover trigger buttons, etc.) we add
 *   `onMouseDown={(e) => e.preventDefault()}` directly.
 *
 *   PopoverContent / DropdownMenuContent set:
 *     onOpenAutoFocus={(e) => e.preventDefault()}
 *     onCloseAutoFocus={(e) => e.preventDefault()}
 *   so Radix doesn't move focus into / back from the floating panel.
 *
 * Overflow strategy (ghost-layer, zero first-frame flash):
 *   A ghost row (visibility:hidden, position:absolute) always renders ALL
 *   sections. ResizeObserver reads section widths from the ghost and computes
 *   the cutoff before the visible row paints.
 */

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  ChevronRightSquare,
  Code,
  Code2,
  Columns2,
  Columns3,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ImagePlus,
  Indent,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  MoreHorizontal,
  Outdent,
  Palette,
  Plus,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Table2,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import * as React from "react";
import { useErixEditor, useErixStyle } from "@/context/editor";
import { cn } from "@/lib/utils";
import { ColorPickerNative } from "../ui/ColorPickerNative";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ImagePickerNative } from "../ui/ImagePickerNative";
import { LinkInsertNative } from "../ui/LinkInsertNative";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ToolbarBtn, ToolbarGroup } from "./Toolbar";

// ─── Config ──────────────────────────────────────────────────────────────────
export interface ToolbarChainConfig {
  history?: boolean;
  textFormat?: boolean;
  headings?: boolean;
  lists?: boolean;
  alignment?: boolean;
  indent?: boolean;
  colors?: boolean;
  link?: boolean;
  image?: boolean;
  table?: boolean;
  blocks?: boolean;
  fonts?: boolean;
  ai?: boolean;
}

const DEFAULTS: Required<ToolbarChainConfig> = {
  history: true,
  textFormat: true,
  headings: true,
  lists: true,
  alignment: true,
  indent: true,
  colors: true,
  link: true,
  image: true,
  table: true,
  blocks: true,
  fonts: true,
  ai: false,
};

// ─── Measurement budget ───────────────────────────────────────────────────────
const GAP_PX = 2; // erix-gap-0.5 → 2px
const MORE_PX = 30; // "…" button width + 1 sep
const PAD_PX = 16; // px-2 × 2 sides

// ─── Block options ────────────────────────────────────────────────────────────
const BLOCK_OPTIONS = [
  {
    label: "Paragraph",
    short: "P",
    tag: "p",
    kbd: "⌘⌥0",
    icon: <Type size={12} />,
  },
  {
    label: "Heading 1",
    short: "H1",
    tag: "h1",
    kbd: "⌘⌥1",
    icon: <Heading1 size={12} />,
  },
  {
    label: "Heading 2",
    short: "H2",
    tag: "h2",
    kbd: "⌘⌥2",
    icon: <Heading2 size={12} />,
  },
  {
    label: "Heading 3",
    short: "H3",
    tag: "h3",
    kbd: "⌘⌥3",
    icon: <Heading3 size={12} />,
  },
  {
    label: "Heading 4",
    short: "H4",
    tag: "h4",
    kbd: "⌘⌥4",
    icon: <Heading4 size={12} />,
  },
  {
    label: "Heading 5",
    short: "H5",
    tag: "h5",
    kbd: "⌘⌥5",
    icon: <Heading5 size={12} />,
  },
  {
    label: "Heading 6",
    short: "H6",
    tag: "h6",
    kbd: "⌘⌥6",
    icon: <Heading6 size={12} />,
  },
  {
    label: "Quote",
    short: "Q",
    tag: "blockquote",
    kbd: "⌘⌥Q",
    icon: <Quote size={12} />,
  },
  {
    label: "Code Block",
    short: "{ }",
    tag: "pre",
    kbd: "⌘⌥C",
    icon: <Code2 size={12} />,
  },
] as const;

// ─── Shared button base for non-ToolbarBtn triggers ───────────────────────────
// These are <button> elements that need to prevent focus loss via onMouseDown.
const triggerBase = cn(
  "erix-inline-flex erix-items-center erix-gap-0.5",
  "erix-rounded erix-transition-all erix-duration-100",
  "erix-border erix-border-transparent",
  "hover:erix-bg-accent hover:erix-border-border/50",
  "focus-visible:erix-outline-none erix-select-none erix-cursor-default",
);

// ─── Block dropdown ───────────────────────────────────────────────────────────
const BlockDropdown: React.FC<{
  label: string;
  short: string;
  currentTag: string;
  onSelect: (tag: string) => void;
}> = ({ label, short, currentTag, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const { buttonRadius, popoverRadius, shadowClass } = useErixStyle();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label={`Block type: ${label}`}
          className={cn(
            triggerBase,
            "erix-h-[26px] erix-px-1.5",
            open && "erix-bg-accent erix-border-border/50",
            buttonRadius,
          )}
        >
          <span
            className={cn(
              "erix-inline-flex erix-items-center erix-justify-center",
              "erix-rounded-[3px] erix-px-1 erix-min-w-[20px] erix-h-[18px]",
              "erix-text-[10px] erix-font-bold erix-uppercase erix-tracking-wide erix-leading-none erix-shrink-0",
              open
                ? "erix-bg-primary erix-text-primary-foreground"
                : "erix-bg-muted/80 erix-text-foreground/55",
            )}
          >
            {short}
          </span>
          <ChevronDown
            size={9}
            className={cn(
              "erix-opacity-35 erix-shrink-0 erix-transition-transform erix-duration-150",
              open && "erix-rotate-180 erix-opacity-70",
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={5}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn("erix-w-52 erix-p-1", popoverRadius, shadowClass)}
      >
        {BLOCK_OPTIONS.map((opt) => {
          const isActive = currentTag === opt.tag;
          return (
            <DropdownMenuItem
              key={opt.tag}
              onMouseDown={(e) => e.preventDefault()}
              onSelect={() => onSelect(opt.tag)}
              className={cn(
                "erix-gap-2 erix-py-1.5 erix-cursor-pointer erix-rounded-md",
                isActive && "erix-bg-primary/8 erix-text-primary",
              )}
            >
              <span className="erix-w-5 erix-h-5 erix-flex erix-items-center erix-justify-center erix-rounded erix-bg-muted erix-opacity-60 erix-shrink-0">
                {opt.icon}
              </span>
              <span
                className={cn(
                  "erix-flex-1 erix-text-[12px]",
                  isActive && "erix-font-semibold",
                )}
              >
                {opt.label}
              </span>
              <DropdownMenuShortcut className="erix-text-[10px] erix-opacity-30">
                {opt.kbd}
              </DropdownMenuShortcut>
              {isActive && (
                <Check className="erix-h-3 erix-w-3 erix-text-primary erix-shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─── Mini select (font family / size) ────────────────────────────────────────
const FONT_FAMILIES = [
  { label: "Default", abbr: "Aa", value: "" },
  { label: "Inter", abbr: "Int", value: "Inter" },
  { label: "Roboto", abbr: "Rob", value: "Roboto" },
  { label: "Serif", abbr: "Ser", value: "serif" },
  { label: "Monospace", abbr: "Mono", value: "monospace" },
];

const FONT_SIZES = [
  { label: "Default", abbr: "−", value: "" },
  { label: "12px", abbr: "12", value: "12px" },
  { label: "14px", abbr: "14", value: "14px" },
  { label: "16px", abbr: "16", value: "16px" },
  { label: "18px", abbr: "18", value: "18px" },
  { label: "24px", abbr: "24", value: "24px" },
  { label: "32px", abbr: "32", value: "32px" },
];

const MiniDropdown: React.FC<{
  currentValue: string;
  options: { label: string; abbr: string; value: string }[];
  onSelect: (v: string) => void;
  ariaLabel: string;
  fixedWidth: number;
}> = ({ currentValue, options, onSelect, ariaLabel, fixedWidth }) => {
  const [open, setOpen] = React.useState(false);
  const { buttonRadius, popoverRadius, shadowClass } = useErixStyle();

  const matchValue = currentValue.replace(/['"]/g, "");
  const active =
    options.find((o) =>
      o.value ? matchValue.includes(o.value) : !matchValue,
    ) ?? options[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label={ariaLabel}
          style={{ width: fixedWidth }}
          className={cn(
            triggerBase,
            "erix-justify-between erix-h-[26px] erix-px-1.5",
            "erix-text-[11px] erix-font-medium erix-text-foreground/55 hover:erix-text-foreground",
            open && "erix-bg-accent erix-border-border/50 erix-text-foreground",
            buttonRadius,
          )}
        >
          <span className="erix-truncate erix-leading-none">
            {active?.abbr ?? "−"}
          </span>
          <ChevronDown
            size={9}
            className={cn(
              "erix-shrink-0 erix-opacity-35 erix-transition-transform erix-duration-150",
              open && "erix-rotate-180",
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={5}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "erix-min-w-[130px] erix-p-1",
          popoverRadius,
          shadowClass,
        )}
      >
        {options.map((opt) => {
          const isActive = active?.value === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value || "__default"}
              onMouseDown={(e) => e.preventDefault()}
              onSelect={() => onSelect(opt.value)}
              className="erix-py-1.5 erix-cursor-pointer erix-rounded-md"
            >
              <span
                className={cn(
                  "erix-flex-1 erix-text-[12px]",
                  isActive && "erix-font-semibold",
                )}
              >
                {opt.label}
              </span>
              {isActive && (
                <Check className="erix-h-3 erix-w-3 erix-text-primary erix-ml-2 erix-shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─── Shared small popover container ──────────────────────────────────────────
const SubPopoverContent: React.FC<{
  children: React.ReactNode;
  align?: "start" | "end" | "center";
}> = ({ children, align = "start" }) => (
  <PopoverContent
    side="bottom"
    align={align}
    sideOffset={5}
    onOpenAutoFocus={(e) => e.preventDefault()}
    onCloseAutoFocus={(e) => e.preventDefault()}
    className="erix-p-1 erix-flex erix-gap-px erix-w-auto"
  >
    {children}
  </PopoverContent>
);

// ─── Lists group ──────────────────────────────────────────────────────────────
const ListsGroup: React.FC<{ engine: any; ctx: any }> = ({ engine, ctx }) => (
  <Popover>
    <PopoverTrigger asChild>
      <ToolbarBtn
        tooltip="Lists"
        active={ctx.isList || ctx.isOrderedList || ctx.isTaskList}
      >
        <List size={14} />
      </ToolbarBtn>
    </PopoverTrigger>
    <SubPopoverContent>
      <ToolbarBtn
        tooltip="Bullet list"
        active={ctx.isList && !ctx.isOrderedList && !ctx.isTaskList}
        onClick={() => engine?.bulletList()}
      >
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        tooltip="Numbered list"
        active={ctx.isOrderedList}
        onClick={() => engine?.orderedList()}
      >
        <ListOrdered size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        tooltip="Task list"
        active={ctx.isTaskList}
        onClick={() => engine?.taskList()}
      >
        <ListTodo size={14} />
      </ToolbarBtn>
    </SubPopoverContent>
  </Popover>
);

// ─── Alignment group ──────────────────────────────────────────────────────────
const AlignGroup: React.FC<{ engine: any; ctx: any }> = ({ engine, ctx }) => {
  const Icon =
    ctx.textAlign === "center"
      ? AlignCenter
      : ctx.textAlign === "right"
        ? AlignRight
        : ctx.textAlign === "justify"
          ? AlignJustify
          : AlignLeft;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ToolbarBtn
          tooltip="Alignment"
          active={!!ctx.textAlign && ctx.textAlign !== "left"}
        >
          <Icon size={14} />
        </ToolbarBtn>
      </PopoverTrigger>
      <SubPopoverContent>
        <ToolbarBtn
          tooltip="Left"
          active={!ctx.textAlign || ctx.textAlign === "left"}
          onClick={() => engine?.align("left")}
        >
          <AlignLeft size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          tooltip="Center"
          active={ctx.textAlign === "center"}
          onClick={() => engine?.align("center")}
        >
          <AlignCenter size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          tooltip="Right"
          active={ctx.textAlign === "right"}
          onClick={() => engine?.align("right")}
        >
          <AlignRight size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          tooltip="Justify"
          active={ctx.textAlign === "justify"}
          onClick={() => engine?.align("justify")}
        >
          <AlignJustify size={14} />
        </ToolbarBtn>
      </SubPopoverContent>
    </Popover>
  );
};

// ─── Indent group ─────────────────────────────────────────────────────────────
const IndentGroup: React.FC<{ engine: any }> = ({ engine }) => (
  <Popover>
    <PopoverTrigger asChild>
      <ToolbarBtn tooltip="Indent / Outdent">
        <Indent size={14} />
      </ToolbarBtn>
    </PopoverTrigger>
    <SubPopoverContent>
      <ToolbarBtn tooltip="Outdent" onClick={() => engine?.outdent()}>
        <Outdent size={14} />
      </ToolbarBtn>
      <ToolbarBtn tooltip="Indent" onClick={() => engine?.indent()}>
        <Indent size={14} />
      </ToolbarBtn>
    </SubPopoverContent>
  </Popover>
);

// ─── Insert dropdown ──────────────────────────────────────────────────────────
const INSERT_ITEMS = [
  { label: "Table", icon: <Table2 size={13} />, fn: (e: any) => e?.table() },
  {
    label: "2 Columns",
    icon: <Columns2 size={13} />,
    fn: (e: any) => e?.columns(2),
  },
  {
    label: "3 Columns",
    icon: <Columns3 size={13} />,
    fn: (e: any) => e?.columns(3),
  },
  { label: "Callout", icon: <Info size={13} />, fn: (e: any) => e?.callout() },
  {
    label: "Toggle",
    icon: <ChevronRightSquare size={13} />,
    fn: (e: any) => e?.toggle(),
  },
  {
    label: "Divider",
    icon: <Minus size={13} />,
    fn: (e: any) => e?.horizontalRule(),
    sep: true,
  },
];

const InsertDropdown: React.FC<{ engine: any }> = ({ engine }) => {
  const { popoverRadius, shadowClass } = useErixStyle();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ToolbarBtn tooltip="Insert block">
          <Plus size={14} />
        </ToolbarBtn>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "erix-p-1 erix-w-[170px] erix-flex erix-flex-col erix-gap-px",
          popoverRadius,
          shadowClass,
        )}
      >
        {INSERT_ITEMS.map(({ label, icon, fn, sep }) => (
          <React.Fragment key={label}>
            {sep && <div className="erix-h-px erix-bg-border erix-my-0.5" />}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => fn(engine)}
              className="erix-flex erix-items-center erix-gap-2 erix-px-2 erix-py-1.5 erix-rounded-md erix-text-[12px] erix-text-left erix-w-full erix-text-foreground/60 hover:erix-bg-accent hover:erix-text-foreground erix-transition-colors erix-duration-100"
            >
              <span className="erix-opacity-60 erix-shrink-0">{icon}</span>
              <span>{label}</span>
            </button>
          </React.Fragment>
        ))}
      </PopoverContent>
    </Popover>
  );
};

// ─── Overflow "…" button ──────────────────────────────────────────────────────
interface OverflowSection {
  id: string;
  label: string;
  node: React.ReactNode;
}

const OverflowBtn: React.FC<{
  sections: OverflowSection[];
  btnClass: string;
  popoverRadius: string;
  shadowClass: string;
}> = ({ sections, btnClass, popoverRadius, shadowClass }) => {
  const [open, setOpen] = React.useState(false);
  if (!sections.length) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TooltipProvider delayDuration={600}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="More formatting options"
                aria-expanded={open}
                onMouseDown={(e) => e.preventDefault()}
                className={cn(
                  "erix-inline-flex erix-items-center erix-justify-center erix-shrink-0",
                  "erix-h-[26px] erix-w-[26px]",
                  "erix-text-foreground/40 hover:erix-text-foreground hover:erix-bg-accent",
                  "erix-border erix-border-transparent hover:erix-border-border/50",
                  open &&
                    "erix-bg-accent erix-text-foreground erix-border-border/50",
                  "erix-transition-all erix-duration-100 erix-outline-none erix-rounded",
                  btnClass,
                )}
              >
                <MoreHorizontal size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={6}
              className="erix-text-[11px]"
            >
              More
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={7}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "erix-p-2 erix-flex erix-flex-col erix-gap-2",
          "erix-min-w-[180px] erix-max-w-[320px]",
          "erix-bg-popover/97 erix-backdrop-blur-xl",
          popoverRadius,
          shadowClass,
        )}
      >
        {sections.map((s, i) => (
          <div key={s.id}>
            {i > 0 && (
              <div className="erix-h-px erix-bg-border/60 erix-mb-1.5" />
            )}
            <p className="erix-px-0.5 erix-pb-1 erix-text-[10px] erix-font-semibold erix-uppercase erix-tracking-wider erix-text-muted-foreground/50 erix-select-none">
              {s.label}
            </p>
            <div className="erix-flex erix-items-center erix-flex-wrap erix-gap-px">
              {s.node}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};

// ─── Compact separator ────────────────────────────────────────────────────────
const Sep: React.FC = () => (
  <div
    aria-hidden="true"
    className="erix-w-px erix-h-3.5 erix-bg-border/70 erix-mx-1 erix-shrink-0"
  />
);

// ─── Section type ─────────────────────────────────────────────────────────────
interface Section {
  id: string;
  label: string;
  hasSep: boolean;
  node: React.ReactNode;
}

// ─── Main component ───────────────────────────────────────────────────────────
export const ToolbarChain: React.FC<
  ToolbarChainConfig & { onAiClick?: () => void }
> = (rawProps) => {
  const { onAiClick, ...configProps } = rawProps;
  const cfg = { ...DEFAULTS, ...configProps };
  const { engine, ctx } = useErixEditor();
  const { containerRadius, shadowClass, popoverRadius, buttonRadius } =
    useErixStyle();

  // ── Derived block state ──────────────────────────────────────────────────
  const blockLabel = React.useMemo(() => {
    if (ctx.isHeading1) return "Heading 1";
    if (ctx.isHeading2) return "Heading 2";
    if (ctx.isHeading3) return "Heading 3";
    if (ctx.isHeading4) return "Heading 4";
    if (ctx.isHeading5) return "Heading 5";
    if (ctx.isHeading6) return "Heading 6";
    if (ctx.isBlockquote) return "Quote";
    if (ctx.isCodeBlock) return "Code Block";
    return "Paragraph";
  }, [ctx]);

  const blockShort = React.useMemo(() => {
    if (ctx.isHeading1) return "H1";
    if (ctx.isHeading2) return "H2";
    if (ctx.isHeading3) return "H3";
    if (ctx.isHeading4) return "H4";
    if (ctx.isHeading5) return "H5";
    if (ctx.isHeading6) return "H6";
    if (ctx.isBlockquote) return "Q";
    if (ctx.isCodeBlock) return "{ }";
    return "P";
  }, [ctx]);

  const blockTag = React.useMemo(() => {
    if (ctx.isHeading1) return "h1";
    if (ctx.isHeading2) return "h2";
    if (ctx.isHeading3) return "h3";
    if (ctx.isHeading4) return "h4";
    if (ctx.isHeading5) return "h5";
    if (ctx.isHeading6) return "h6";
    if (ctx.isBlockquote) return "blockquote";
    if (ctx.isCodeBlock) return "pre";
    return "p";
  }, [ctx]);

  // ── Build sections ───────────────────────────────────────────────────────
  const sections = React.useMemo<Section[]>(() => {
    const s: Section[] = [];

    if (cfg.history) {
      s.push({
        id: "history",
        label: "History",
        hasSep: true,
        node: (
          <ToolbarGroup>
            <ToolbarBtn
              tooltip="Undo  ⌘Z"
              disabled={!ctx.canUndo}
              onClick={() => engine?.undo()}
            >
              <Undo2 size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              tooltip="Redo  ⌘⇧Z"
              disabled={!ctx.canRedo}
              onClick={() => engine?.redo()}
            >
              <Redo2 size={14} />
            </ToolbarBtn>
          </ToolbarGroup>
        ),
      });
    }

    if (cfg.headings) {
      s.push({
        id: "blockType",
        label: "Block type",
        hasSep: true,
        node: (
          <BlockDropdown
            label={blockLabel}
            short={blockShort}
            currentTag={blockTag}
            onSelect={(tag) => engine?.post("ERIX_FORMAT_BLOCK", { tag })}
          />
        ),
      });
    }

    if (cfg.fonts) {
      s.push({
        id: "fonts",
        label: "Font",
        hasSep: true,
        node: (
          <ToolbarGroup>
            <MiniDropdown
              ariaLabel="Font family"
              currentValue={ctx.fontFamily || ""}
              options={FONT_FAMILIES}
              onSelect={(v) => engine?.setFontFamily(v)}
              fixedWidth={46}
            />
            <div className="erix-w-px erix-h-3 erix-bg-border/60 erix-mx-0.5 erix-shrink-0" />
            <MiniDropdown
              ariaLabel="Font size"
              currentValue={ctx.fontSize || ""}
              options={FONT_SIZES}
              onSelect={(v) => engine?.setFontSize(v)}
              fixedWidth={36}
            />
          </ToolbarGroup>
        ),
      });
    }

    if (cfg.textFormat) {
      s.push({
        id: "format",
        label: "Format",
        hasSep: true,
        node: (
          <ToolbarGroup>
            <ToolbarBtn
              tooltip="Bold  ⌘B"
              active={ctx.bold}
              onClick={() => engine?.bold()}
            >
              <Bold size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              tooltip="Italic  ⌘I"
              active={ctx.italic}
              onClick={() => engine?.italic()}
            >
              <Italic size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              tooltip="Underline  ⌘U"
              active={ctx.underline}
              onClick={() => engine?.underline()}
            >
              <Underline size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              tooltip="Strikethrough"
              active={ctx.strike}
              onClick={() => engine?.strike()}
            >
              <Strikethrough size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              tooltip="Inline code"
              active={ctx.code}
              onClick={() => engine?.inlineCode()}
            >
              <Code size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              tooltip="Clear formatting"
              onClick={() => engine?.clearFormatting()}
            >
              <Eraser size={14} />
            </ToolbarBtn>
          </ToolbarGroup>
        ),
      });
    }

    if (cfg.colors) {
      s.push({
        id: "colors",
        label: "Color",
        hasSep: true,
        node: (
          <ColorPickerNative>
            <ToolbarBtn
              tooltip="Text & highlight color"
              active={!!(ctx.foreColor || ctx.backColor)}
            >
              <Palette size={14} />
            </ToolbarBtn>
          </ColorPickerNative>
        ),
      });
    }

    if (cfg.lists) {
      s.push({
        id: "lists",
        label: "Lists",
        hasSep: true,
        node: <ListsGroup engine={engine} ctx={ctx} />,
      });
    }
    if (cfg.alignment) {
      s.push({
        id: "alignment",
        label: "Alignment",
        hasSep: true,
        node: <AlignGroup engine={engine} ctx={ctx} />,
      });
    }
    if (cfg.indent) {
      s.push({
        id: "indent",
        label: "Indent",
        hasSep: !!(cfg.link || cfg.image || cfg.table || cfg.ai),
        node: <IndentGroup engine={engine} />,
      });
    }

    if (cfg.link || cfg.image || cfg.table) {
      s.push({
        id: "insert",
        label: "Insert",
        hasSep: !!cfg.ai,
        node: (
          <ToolbarGroup>
            {cfg.link && (
              <LinkInsertNative>
                <ToolbarBtn
                  tooltip={ctx.link ? "Edit link  ⌘K" : "Insert link  ⌘K"}
                  active={ctx.link}
                  disabled={
                    (!ctx.hasSelection && !ctx.link) ||
                    ctx.isEmbed ||
                    ctx.isNonEditable
                  }
                >
                  <Link2 size={14} />
                </ToolbarBtn>
              </LinkInsertNative>
            )}
            {cfg.image && (
              <ImagePickerNative>
                <ToolbarBtn tooltip="Insert image">
                  <ImagePlus size={14} />
                </ToolbarBtn>
              </ImagePickerNative>
            )}
            {cfg.table && <InsertDropdown engine={engine} />}
          </ToolbarGroup>
        ),
      });
    }

    if (cfg.ai) {
      s.push({
        id: "ai",
        label: "AI",
        hasSep: false,
        node: (
          <ToolbarBtn
            tooltip="AI enhance"
            onClick={onAiClick}
            className="erix-text-violet-500 hover:!erix-text-violet-600 hover:!erix-bg-violet-50 dark:hover:!erix-bg-violet-950/30"
          >
            <Sparkles size={14} />
          </ToolbarBtn>
        ),
      });
    }

    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cfg.history,
    cfg.headings,
    cfg.fonts,
    cfg.textFormat,
    cfg.colors,
    cfg.lists,
    cfg.alignment,
    cfg.indent,
    cfg.link,
    cfg.image,
    cfg.table,
    cfg.ai,
    blockLabel,
    blockShort,
    blockTag,
    ctx.canUndo,
    ctx.canRedo,
    ctx.bold,
    ctx.italic,
    ctx.underline,
    ctx.strike,
    ctx.code,
    ctx.isList,
    ctx.isOrderedList,
    ctx.isTaskList,
    ctx.textAlign,
    ctx.foreColor,
    ctx.backColor,
    ctx.link,
    ctx.hasSelection,
    ctx.isEmbed,
    ctx.isNonEditable,
    ctx.fontFamily,
    ctx.fontSize,
  ]);

  // ── Overflow measurement ─────────────────────────────────────────────────
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const ghostRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const [hiddenFrom, setHiddenFrom] = React.useState(-1);

  const measure = React.useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const wrap = wrapRef.current;
      const ghost = ghostRef.current;
      if (!wrap || !ghost) return;

      const avail = wrap.offsetWidth - PAD_PX;
      if (avail <= 0) return;

      const nodes = Array.from(
        ghost.querySelectorAll<HTMLElement>("[data-ghost-idx]"),
      ).sort((a, b) => Number(a.dataset.ghostIdx) - Number(b.dataset.ghostIdx));

      if (!nodes.length) return;

      const widths = nodes.map((n) => n.getBoundingClientRect().width + GAP_PX);
      const total = widths.reduce((a, b) => a + b, 0);

      if (total <= avail) {
        setHiddenFrom(sections.length);
        return;
      }

      let used = 0;
      for (let i = 0; i < widths.length; i++) {
        const needMore = i < widths.length - 1;
        if (used + widths[i] + (needMore ? MORE_PX : 0) > avail) {
          setHiddenFrom(Math.max(i, 1));
          return;
        }
        used += widths[i];
      }
      setHiddenFrom(sections.length);
    });
  }, [sections.length]);

  React.useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    measure();
    return () => {
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  React.useLayoutEffect(() => {
    measure();
  }, [sections.length, measure]);

  // ── Derive visible / overflow ────────────────────────────────────────────
  const notMeasured = hiddenFrom < 0;
  const cutoff = notMeasured ? sections.length : hiddenFrom;
  const visible = sections.slice(0, cutoff);
  const overflow = sections.slice(cutoff);
  const isOverflowing = overflow.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      className={cn(
        "erix-relative erix-w-full erix-select-none",
        "erix-bg-background erix-border-b erix-border-border",
        notMeasured ? "erix-invisible" : "erix-visible",
        containerRadius,
      )}
    >
      {/* Ghost row — measurement only */}
      <div
        ref={ghostRef}
        aria-hidden="true"
        style={{ visibility: "hidden", pointerEvents: "none" }}
        className="erix-absolute erix-inset-x-0 erix-top-0 erix-flex erix-items-center erix-gap-0.5 erix-px-2 erix-py-1.5 erix-overflow-hidden"
      >
        {sections.map((s, i) => (
          <div
            key={s.id}
            data-ghost-idx={i}
            className="erix-flex erix-items-center erix-gap-0.5 erix-shrink-0"
          >
            {s.node}
            {s.hasSep && (
              <div className="erix-w-px erix-h-3.5 erix-mx-1 erix-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Visible row */}
      <div
        role="toolbar"
        aria-label="Text editor toolbar"
        className="erix-flex erix-items-center erix-gap-0.5 erix-px-2 erix-py-1.5 erix-overflow-hidden erix-min-h-[42px]"
      >
        {visible.map((s, i) => {
          const isLast = i === visible.length - 1;
          const showSep = s.hasSep && !isLast;
          return (
            <React.Fragment key={s.id}>
              <div className="erix-flex erix-items-center erix-gap-0.5 erix-shrink-0">
                {s.node}
              </div>
              {showSep && <Sep />}
            </React.Fragment>
          );
        })}

        {isOverflowing && (
          <>
            <Sep />
            <OverflowBtn
              sections={overflow.map((s) => ({
                id: s.id,
                label: s.label,
                node: s.node,
              }))}
              btnClass={buttonRadius}
              popoverRadius={popoverRadius}
              shadowClass={shadowClass}
            />
          </>
        )}
      </div>
    </div>
  );
};
