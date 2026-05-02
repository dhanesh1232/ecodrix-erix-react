// src/core/chain.ts
// Fluent command chain — queue multiple commands and fire in one postMessage batch.

import type { ErixEngine } from "@/core/engine";
import type { Heading } from "@/types/erix";

export class ErixChain {
  private engine: ErixEngine;
  private queue: Array<() => void> = [];

  constructor(engine: ErixEngine) {
    this.engine = engine;
  }

  private q(fn: () => void): this {
    this.queue.push(fn);
    return this;
  }

  // ─── Marks ────────────────────────────────────────────────────────────
  bold() {
    return this.q(() => this.engine.bold());
  }
  italic() {
    return this.q(() => this.engine.italic());
  }
  underline() {
    return this.q(() => this.engine.underline());
  }
  strike() {
    return this.q(() => this.engine.strike());
  }
  inlineCode() {
    return this.q(() => this.engine.inlineCode());
  }
  superscript() {
    return this.q(() => this.engine.superscript());
  }
  subscript() {
    return this.q(() => this.engine.subscript());
  }
  color(v: string) {
    return this.q(() => this.engine.color(v));
  }
  highlight(v: string) {
    return this.q(() => this.engine.highlight(v));
  }
  link(url: string) {
    return this.q(() => this.engine.link(url));
  }
  unlink() {
    return this.q(() => this.engine.unlink());
  }

  // ─── Blocks ───────────────────────────────────────────────────────────
  heading(level: Heading) {
    return this.q(() => this.engine.heading(level));
  }
  paragraph() {
    return this.q(() => this.engine.paragraph());
  }
  blockquote() {
    return this.q(() => this.engine.blockquote());
  }
  codeBlock() {
    return this.q(() => this.engine.codeBlock());
  }
  bulletList() {
    return this.q(() => this.engine.bulletList());
  }
  orderedList() {
    return this.q(() => this.engine.orderedList());
  }
  taskList() {
    return this.q(() => this.engine.taskList());
  }
  callout(emoji = "💡", bg?: string) {
    return this.q(() => this.engine.callout(emoji, bg));
  }
  toggle() {
    return this.q(() => this.engine.toggle());
  }
  hr() {
    return this.q(() => this.engine.horizontalRule());
  }
  table(rows = 3, cols = 3) {
    return this.q(() => this.engine.table(rows, cols));
  }
  columns(n = 2) {
    return this.q(() => this.engine.columns(n));
  }
  image(url: string, alt?: string, link?: string) {
    return this.q(() => this.engine.image(url, alt ?? "", link));
  }
  video(url: string) {
    return this.q(() => this.engine.video(url));
  }

  // ─── Alignment ────────────────────────────────────────────────────────
  alignLeft() {
    return this.q(() => this.engine.align("left"));
  }
  alignCenter() {
    return this.q(() => this.engine.align("center"));
  }
  alignRight() {
    return this.q(() => this.engine.align("right"));
  }
  alignJustify() {
    return this.q(() => this.engine.align("justify"));
  }

  // ─── Font ───────────────────────────────────────────────────────────────
  setFontSize(size: string) {
    return this.q(() => this.engine.setFontSize(size));
  }
  setFontFamily(family: string) {
    return this.q(() => this.engine.setFontFamily(family));
  }

  // ─── Indent ───────────────────────────────────────────────────────────
  indent() {
    return this.q(() => this.engine.indent());
  }
  outdent() {
    return this.q(() => this.engine.outdent());
  }

  // ─── History ──────────────────────────────────────────────────────────
  undo() {
    return this.q(() => this.engine.undo());
  }
  redo() {
    return this.q(() => this.engine.redo());
  }

  // ─── Raw content ──────────────────────────────────────────────────────
  insertHTML(html: string) {
    return this.q(() => this.engine.insertHTML(html));
  }
  setHTML(html: string) {
    return this.q(() => this.engine.setHTML(html));
  }

  /** Execute all queued commands */
  run() {
    for (const fn of this.queue) fn();
    this.queue = [];
  }
}
