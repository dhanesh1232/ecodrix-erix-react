// src/core/engine.ts
// ErixEngine — host-side controller for the iframe editor

import { buildIframeHTML } from "@/core/iframe-template";
import { erixRuntimeInit } from "@/core/runtime/index";
import type { ErixContextState, ErixEngineConfig, ErixEvents } from "@/types/erix";

type Listener<T> = (data: T) => void;
type ListenerMap = { [K in keyof ErixEvents]?: Array<Listener<ErixEvents[K]>> };

export class ErixEngine {
  iframe: HTMLIFrameElement;
  private config: ErixEngineConfig;
  private iframeWin: Window | null = null;
  private listeners: ListenerMap = {};
  isReady = false;

  constructor(config: ErixEngineConfig) {
    this.iframe = config.iframe;
    this.config = config;

    // Explicitly bind all methods to ensure 'this' stability
    // and fix 'is not a function' errors during HMR/React context updates
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.bold = this.bold.bind(this);
    this.italic = this.italic.bind(this);
    this.underline = this.underline.bind(this);
    this.strike = this.strike.bind(this);
    this.inlineCode = this.inlineCode.bind(this);
    this.link = this.link.bind(this);
    this.unlink = this.unlink.bind(this);
    this.heading = this.heading.bind(this);
    this.paragraph = this.paragraph.bind(this);
    this.blockquote = this.blockquote.bind(this);
    this.codeBlock = this.codeBlock.bind(this);
    this.bulletList = this.bulletList.bind(this);
    this.orderedList = this.orderedList.bind(this);
    this.taskList = this.taskList.bind(this);
    this.align = this.align.bind(this);
    this.color = this.color.bind(this);
    this.highlight = this.highlight.bind(this);
    this.indent = this.indent.bind(this);
    this.outdent = this.outdent.bind(this);
    this.setFontSize = this.setFontSize.bind(this);
    this.setFontFamily = this.setFontFamily.bind(this);
    this.setReadOnly = this.setReadOnly.bind(this);
    this.tableAddRow = this.tableAddRow.bind(this);
    this.tableAddCol = this.tableAddCol.bind(this);
    this.tableDeleteRow = this.tableDeleteRow.bind(this);
    this.tableDeleteCol = this.tableDeleteCol.bind(this);
    this.deleteTable = this.deleteTable.bind(this);
    this.table = this.table.bind(this);
    this.image = this.image.bind(this);
    this.video = this.video.bind(this);
    this.callout = this.callout.bind(this);
    this.toggle = this.toggle.bind(this);
    this.horizontalRule = this.horizontalRule.bind(this);
    this.columns = this.columns.bind(this);
    this.clearFormatting = this.clearFormatting.bind(this);
  }

  // ─── Init ──────────────────────────────────────────────────────────────
  init() {
    const doc = this.iframe.contentDocument;
    if (!doc) throw new Error("[ErixEngine] No iframe document available");

    const html = buildIframeHTML(
      this.config.initialContent ?? "<p><br></p>",
      this.config.placeholder ?? "Type '/' for commands…",
      this.config.shortcuts ?? true,
    );

    doc.open();
    doc.write(html);
    doc.close();

    this.iframe.onload = () => {
      const iDoc = this.iframe.contentDocument;
      if (!iDoc?.body) return;

      this.iframeWin = this.iframe.contentWindow;

      // Inject runtime script
      const script = iDoc.createElement("script");
      script.id = "__ERIX_RUNTIME__";
      script.type = "text/javascript";
      script.textContent = `(${erixRuntimeInit.toString()})();`;
      iDoc.body.appendChild(script);
    };

    window.addEventListener("message", this.onMessage);
  }

  // ─── postMessage bridge ───────────────────────────────────────────────
  post(type: string, payload: Record<string, unknown> = {}) {
    this.iframeWin?.postMessage({ type, ...payload }, "*");
  }

  private onMessage = (e: MessageEvent) => {
    const d = e.data || {};
    switch (d.type) {
      case "ERIX_READY":
        this.isReady = true;
        // Apply initial theme right after ready
        // We default to light if no theme is provided, to ensure sync with host
        this.setTheme(this.config.theme || "light");
        this.emit("ready", undefined as undefined);
        break;

      case "ERIX_UPDATE":
        this.emit("update", {
          html: d.html,
          text: d.text,
          charCount: d.charCount,
          wordCount: d.wordCount,
        });
        this.config.onUpdate?.(d.html);
        break;

      case "ERIX_CONTEXT":
        this.emit("context", d as ErixContextState);
        this.config.onContext?.(d as ErixContextState);
        break;

      case "ERIX_HISTORY":
        this.emit("history", { canUndo: d.canUndo, canRedo: d.canRedo });
        break;

      case "ERIX_SLASH_OPEN":
        this.emit("slashOpen", { x: d.x, y: d.y, query: d.query });
        break;

      case "ERIX_SLASH_QUERY":
        this.emit("slashQuery", { query: d.query });
        break;

      case "ERIX_SLASH_CLOSE":
        this.emit("slashClose", undefined as undefined);
        break;

      case "ERIX_LINK_OPEN":
        this.emit("linkOpen", undefined as undefined);
        break;

      case "ERIX_IMAGE_OPEN":
        this.emit("imageOpen", undefined as undefined);
        break;

      case "ERIX_CLICK_OUTSIDE": {
        this.emit("clickOutside", undefined as undefined);
        // Dispatch a global window event for components that don't have access to the engine
        window.dispatchEvent(new CustomEvent("erix:dismiss-all"));

        // Dispatch native events to host to trigger Radix UI's dismissals
        // some components look for pointerdown, others mousedown/mouseup
        const common = { bubbles: true, cancelable: true, view: window };
        document.dispatchEvent(new PointerEvent("pointerdown", common));
        document.dispatchEvent(new MouseEvent("mousedown", common));
        document.dispatchEvent(new MouseEvent("mouseup", common));
        document.dispatchEvent(new MouseEvent("click", common));
        break;
      }

      case "ERIX_FOCUS_IN":
        this.emit("focusIn", undefined as undefined);
        break;

      case "ERIX_FOCUS_OUT":
        this.emit("focusOut", undefined as undefined);
        break;

      case "ERIX_DROP_IMAGE":
        this.emit("dropImage", {
          dataUrl: d.dataUrl as string,
          name: d.name as string,
        });
        break;
    }
  };

  // ─── Event emitter ────────────────────────────────────────────────────
  on<K extends keyof ErixEvents>(type: K, fn: Listener<ErixEvents[K]>) {
    if (!this.listeners[type]) this.listeners[type] = [];
    (this.listeners[type] as Listener<ErixEvents[K]>[]).push(fn);
    return () => this.off(type, fn);
  }

  off<K extends keyof ErixEvents>(type: K, fn: Listener<ErixEvents[K]>) {
    const arr = this.listeners[type] as Listener<ErixEvents[K]>[] | undefined;
    if (arr) {
      const idx = arr.indexOf(fn);
      if (idx !== -1) arr.splice(idx, 1);
    }
  }

  private emit<K extends keyof ErixEvents>(type: K, data: ErixEvents[K]) {
    const arr = this.listeners[type] as Listener<ErixEvents[K]>[] | undefined;
    arr?.forEach((fn) => {
      fn(data);
    });
  }

  // ─── Commands ─────────────────────────────────────────────────────────
  bold() {
    this.post("ERIX_BOLD");
  }
  italic() {
    this.post("ERIX_ITALIC");
  }
  underline() {
    this.post("ERIX_UNDERLINE");
  }
  strike() {
    this.post("ERIX_STRIKE");
  }
  inlineCode() {
    this.post("ERIX_CODE");
  }
  superscript() {
    this.post("ERIX_SUPERSCRIPT");
  }
  subscript() {
    this.post("ERIX_SUBSCRIPT");
  }
  undo() {
    this.post("ERIX_UNDO");
  }
  redo() {
    this.post("ERIX_REDO");
  }
  focus() {
    this.post("ERIX_FOCUS");
  }

  heading(level: 1 | 2 | 3 | 4 | 5 | 6) {
    this.post("ERIX_FORMAT_BLOCK", { tag: `h${level}` });
  }
  paragraph() {
    this.post("ERIX_FORMAT_BLOCK", { tag: "p" });
  }
  blockquote() {
    this.post("ERIX_FORMAT_BLOCK", { tag: "blockquote" });
  }
  codeBlock() {
    this.post("ERIX_FORMAT_BLOCK", { tag: "pre" });
  }

  bulletList() {
    this.post("ERIX_LIST_UL");
  }
  orderedList() {
    this.post("ERIX_LIST_OL");
  }
  taskList() {
    this.post("ERIX_TASK_LIST");
  }
  callout(emoji = "💡", bg = "#fef3c7") {
    this.post("ERIX_CALLOUT", { emoji, bg });
  }
  toggle() {
    this.post("ERIX_TOGGLE");
  }
  horizontalRule() {
    this.post("ERIX_HR");
  }
  table(rows = 3, cols = 3) {
    this.post("ERIX_TABLE", { rows, cols });
  }
  columns(cols = 2) {
    this.post("ERIX_COLUMNS", { cols });
  }
  clearFormatting() {
    this.post("ERIX_CLEAR_FORMAT");
  }

  align(dir: "left" | "center" | "right" | "justify") {
    this.post("ERIX_ALIGN", { align: dir });
  }
  indent() {
    this.post("ERIX_INDENT");
  }
  outdent() {
    this.post("ERIX_OUTDENT");
  }

  color(value: string) {
    this.post("ERIX_COLOR", { color: value });
  }
  highlight(value: string) {
    this.post("ERIX_HIGHLIGHT", { color: value });
  }

  setFontSize(size: string) {
    this.post("ERIX_FONT_SIZE", { size });
  }
  setFontFamily(family: string) {
    this.post("ERIX_FONT_FAMILY", { family });
  }

  setReadOnly(readonly: boolean) {
    this.post("ERIX_SET_READONLY", { readonly });
  }

  tableAddRow(pos: "before" | "after" = "after") {
    this.post("ERIX_TABLE_ADD_ROW", { pos });
  }
  tableAddCol(pos: "before" | "after" = "after") {
    this.post("ERIX_TABLE_ADD_COL", { pos });
  }
  tableDeleteRow() {
    this.post("ERIX_TABLE_DEL_ROW");
  }
  tableDeleteCol() {
    this.post("ERIX_TABLE_DEL_COL");
  }
  deleteTable() {
    this.post("ERIX_TABLE_DELETE");
  }

  link(url: string) {
    this.post("ERIX_LINK", { url });
  }
  unlink() {
    this.post("ERIX_UNLINK");
  }

  image(url: string, alt = "", link?: string) {
    this.post("ERIX_IMAGE", { url, alt, link });
  }
  resizeImage(width: number, height: number) {
    this.post("ERIX_RESIZE_IMAGE", { width, height });
  }
  video(url: string) {
    this.post("ERIX_VIDEO", { url });
  }

  insertHTML(html: string) {
    this.post("ERIX_INSERT_HTML", { html });
  }

  setHTML(html: string) {
    this.post("ERIX_SET_HTML", { html });
  }

  getHTML(): string {
    // Read directly from iframe DOM (synchronous)
    const body = this.iframe.contentDocument?.body;
    if (!body) return "";
    const clone = body.cloneNode(true) as HTMLElement;
    clone.querySelector("#__ERIX_RUNTIME__")?.remove();
    return clone.innerHTML.trim();
  }

  executeSlash(command: string, data?: Record<string, unknown>) {
    this.post("ERIX_SLASH_EXEC", { command, ...data });
  }

  // ─── Theme ────────────────────────────────────────────────────────────
  setTheme(theme: "light" | "dark" | Record<string, string>) {
    const doc = this.iframe.contentDocument;
    if (!doc) return;

    const htmlEl = doc.documentElement;

    if (theme === "light") {
      htmlEl.removeAttribute("data-erix-theme");
    } else if (theme === "dark") {
      htmlEl.setAttribute("data-erix-theme", "dark");
    } else {
      htmlEl.removeAttribute("data-erix-theme");
      // Apply as CSS vars via message
      this.post("ERIX_THEME", { tokens: theme });
    }
  }

  private autoThemeMql?: MediaQueryList;
  private autoThemeHandler = (e: MediaQueryListEvent) => {
    this.setTheme(e.matches ? "dark" : "light");
  };

  enableAutoTheme() {
    this.autoThemeMql?.removeEventListener("change", this.autoThemeHandler);
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    this.autoThemeMql = mql;
    this.setTheme(mql.matches ? "dark" : "light");
    mql.addEventListener("change", this.autoThemeHandler);
  }

  applyTokens(tokens: any) {
    const vars: Record<string, string> = {};
    if (tokens.colors) {
      Object.entries(tokens.colors).forEach(([k, v]) => {
        vars[`color-${k}`] = v as string;
      });
    }
    if (tokens.base) {
      Object.entries(tokens.base).forEach(([k, v]) => {
        // Base tokens are passed as-is (e.g. background -> --erix-background)
        // Note: Runtime prepends --erix- automatically.
        vars[k] = v as string;
      });
    }
    if (tokens.fontFamily) {
      vars["font-family"] = tokens.fontFamily;
    }
    if (tokens.borderRadius) {
      vars.radius = tokens.borderRadius;
    }

    this.post("ERIX_THEME", { tokens: vars });
  }

  // ─── Destroy ──────────────────────────────────────────────────────────
  destroy() {
    window.removeEventListener("message", this.onMessage);
    this.autoThemeMql?.removeEventListener("change", this.autoThemeHandler);
    this.listeners = {};
    this.isReady = false;
    this.iframeWin = null;
  }
}
