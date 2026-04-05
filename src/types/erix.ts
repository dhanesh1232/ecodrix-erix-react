// src/types/erix.ts — Core SDK type definitions

/** Loader variants for the editor initialization state */
export type EditorLoader = "skeleton" | "dots" | "shine" | "spinner";

/** Heading levels 1-6 */
export type Heading = 1 | 2 | 3 | 4 | 5 | 6;

/** Toolbar button size presets */
export type ToolbarButtonSize = "sm" | "md" | "xs";

/** Border width values in pixels */
export type BorderWith = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Corner radius presets */
export type BorderRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/** Shadow intensity presets */
export type BoxShadow = "none" | "sm" | "md" | "lg" | "xl";

/** Design tokens for layout and box styling */
export interface DesignProps {
  height?: string | number;
  border?: {
    width?: BorderWith;
    radius?: BorderRadius;
    color?: string;
  };
  ring?: {
    width?: number;
    color?: string;
  };
  shadow?: BoxShadow;
  bg?: string;
  fg?: string;
}

/** Core block types supported by the Erix engine */
export type ErixBlockType =
  | "paragraph"
  | "heading"
  | "blockquote"
  | "code_block"
  | "bullet_list"
  | "ordered_list"
  | "task_list"
  | "list_item"
  | "task_item"
  | "table"
  | "table_row"
  | "table_cell"
  | "table_header"
  | "image"
  | "video"
  | "callout"
  | "toggle"
  | "divider"
  | "column_layout"
  | "column"
  | "text";

/** Inline formatting mark types */
export type ErixMarkType =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "link"
  | "color"
  | "highlight"
  | "font_size"
  | "font_family"
  | "superscript"
  | "subscript";

/** A single formatting mark applied to text */
export interface ErixMark {
  type: ErixMarkType;
  attrs?: Record<string, string | number | boolean | null>;
}

/** The structural unit of the Erix document model */
export interface ErixNode {
  type: ErixBlockType;
  attrs?: Record<string, string | number | boolean | null>;
  marks?: ErixMark[];
  content?: string;
  children?: ErixNode[];
}

/** Represents a path to a specific position in the document tree */
export interface ErixCaretPath {
  path: number[];
  offset: number;
}

/** Coordinates and dimensions of a selection or element */
export interface ErixSelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Current state of the editor, used for syncing toolbar and UI menus */
export interface ErixContextState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  link: boolean;
  blockTag: string;
  isHeading1: boolean;
  isHeading2: boolean;
  isHeading3: boolean;
  isHeading4: boolean;
  isHeading5: boolean;
  isHeading6: boolean;
  isParagraph: boolean;
  isBlockquote: boolean;
  isCodeBlock: boolean;
  isList: boolean;
  isOrderedList: boolean;
  isTaskList: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  foreColor: string;
  backColor: string;
  hasSelection: boolean;
  selectionRect: ErixSelectionRect | null;
  canUndo: boolean;
  canRedo: boolean;
  isIndented: boolean;
  isEmbed: boolean;
  isNonEditable: boolean;
  isInTable: boolean;
  fontSize: string;
  fontFamily: string;
  activeImage: {
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
  } | null;
}

/** Extension definition for extending engine functionality */
export interface ErixExtension {
  name: string;
  type: "mark" | "node" | "behavior";
  commands?: Record<string, (args?: Record<string, unknown>) => void>;
  inputRules?: Array<{
    pattern: RegExp;
    handler: (match: RegExpMatchArray) => void;
  }>;
  keymap?: Record<string, string>;
}

/** Internal engine configuration options */
export interface ErixEngineConfig {
  iframe: HTMLIFrameElement;
  initialContent?: string;
  placeholder?: string;
  theme?: "light" | "dark" | Record<string, string>;
  extensions?: ErixExtension[];
  shortcuts?: boolean;
  apiKey?: string;
  onReady?: () => void;
  onUpdate?: (html: string) => void;
  onContext?: (ctx: ErixContextState) => void;
}

/** Event map for listener subscriptions */
export type ErixEvents = {
  ready: undefined;
  update: {
    html: string;
    text?: string;
    charCount?: number;
    wordCount?: number;
  };
  context: ErixContextState;
  history: { canUndo: boolean; canRedo: boolean };
  error: string;
  slashOpen: { x: number; y: number; query: string };
  slashQuery: { query: string };
  slashClose: undefined;
  linkOpen: undefined;
  imageOpen: undefined;
  clickOutside: undefined;
  focusIn: undefined;
  focusOut: undefined;
  dropImage: { dataUrl: string; name: string };
};

/** Definition for a single command in the slash (/) menu */
export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: any; // biome-ignore lint/suspicious/noExplicitAny: ReactNode
  keywords: string[];
  group: string;
}

/** Supported AI operations */
export type AiAction =
  | "improve"
  | "continue"
  | "summarize"
  | "translate"
  | "fix_grammar"
  | "make_shorter"
  | "make_longer"
  | "custom";

/** Interface for providing AI-powered text transformations */
export interface AiProvider {
  name: string;
  enhance: (
    text: string,
    action: AiAction,
    context?: string,
  ) => Promise<string>;
}

/** Design tokens for theming the editor UI */
export interface ErixThemeTokens {
  "color-primary"?: string;
  "color-bg"?: string;
  "color-fg"?: string;
  "color-surface"?: string;
  "color-border"?: string;
  "color-placeholder"?: string;
  "font-body"?: string;
  "font-mono"?: string;
  "radius-sm"?: string;
  "radius-md"?: string;
  "radius-lg"?: string;
  [key: string]: string | undefined;
}

/** Properties for the main ErixEditor React component */
export interface ErixEditorProps {
  initialContent?: string;
  placeholder?: string;
  theme?: "light" | "dark" | Record<string, string>;
  toolbar?: {
    basic?: boolean;
    advance?: boolean;
    colors?: boolean;
    ai?: boolean;
    textFormat?: boolean;
  };
  bubbleMenu?: boolean;
  slashMenu?: boolean;
  slashCommands?: SlashCommand[];
  aiProvider?: AiProvider;
  loader?: EditorLoader;
  onChange?: (html: string) => void;
  onReady?: () => void;
  onContext?: (ctx: ErixContextState) => void;
  style?: DesignProps;
  apiKey?: string;
  apiUrl?: string;
  clientCode?: string;
  shortcutsEnabled?: boolean;
  readonly?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  tokens?: ErixThemeTokens;
}

/** Formal metadata for images manipulated by the SDK */
export interface ImageFormat {
  id?: string;
  key?: string;
  url: string;
  fileName?: string;
  name?: string;
  size?: number;
  type?: string;
  mimeType?: string;
  folder?: string;
  createdAt?: string;
  updatedAt?: string;
}
