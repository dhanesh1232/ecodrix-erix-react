// src/core/runtime/index.ts
// This function is serialized (toString) and injected into the iframe as a script.
// Keep it self-contained — no external imports, no globals from the host bundle.
/* eslint-disable */

export function erixRuntimeInit() {
  // ─── State ──────────────────────────────────────────────────────────────
  let lastRange: Range | null = null;
  let inSlash = false;
  let slashQuery = "";

  type HistoryEntry = {
    html: string;
    sel: { path: number[]; offset: number } | null;
  };
  const undoStack: HistoryEntry[] = [];
  const redoStack: HistoryEntry[] = [];
  let historyTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── postMessage bridge ──────────────────────────────────────────────────
  function send(type: string, payload: Record<string, unknown> = {}) {
    parent.postMessage({ type, ...payload }, "*");
  }

  // ─── Selection helpers ────────────────────────────────────────────────────
  function getSel() {
    return window.getSelection();
  }

  function saveRange() {
    const s = getSel();
    if (s && s.rangeCount > 0) lastRange = s.getRangeAt(0).cloneRange();
  }

  function restoreRange(): boolean {
    if (!lastRange) return false;
    const s = getSel();
    if (!s) return false;
    try {
      s.removeAllRanges();
      s.addRange(lastRange.cloneRange());
      return true;
    } catch {
      return false;
    }
  }

  function getCaretPath(): { path: number[]; offset: number } | null {
    const s = getSel();
    if (!s || s.rangeCount === 0) return null;
    const r = s.getRangeAt(0);
    const path: number[] = [];
    let n: Node | null = r.startContainer;
    while (n && n !== document.body) {
      const p: Node | null = n.parentNode;
      if (!p) break;
      path.unshift(Array.from(p.childNodes).indexOf(n as ChildNode));
      n = p;
    }
    return { path, offset: r.startOffset };
  }

  function setCaretFromPath(pos: { path: number[]; offset: number } | null) {
    if (!pos) return;
    let n: Node | null = document.body;
    for (const idx of pos.path) {
      if (!n?.childNodes[idx]) break;
      n = n.childNodes[idx];
    }
    if (!n) return;
    try {
      const r = document.createRange();
      const max =
        n.nodeType === 3 ? (n.textContent?.length ?? 0) : n.childNodes.length;
      r.setStart(n, Math.min(pos.offset, max));
      r.collapse(true);
      const s = getSel();
      s?.removeAllRanges();
      s?.addRange(r);
    } catch {
      /* ignore */
    }
  }

  // ─── DOM helpers ─────────────────────────────────────────────────────────
  const BLOCK_TAGS = new Set([
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "BLOCKQUOTE",
    "PRE",
    "LI",
    "DIV",
    "UL",
    "OL",
    "FIGURE",
    "TABLE",
  ]);

  function closestBlock(node: Node | null): HTMLElement | null {
    let el: Node | null = node;
    while (el && el !== document.body) {
      if (el.nodeType === 1 && BLOCK_TAGS.has((el as HTMLElement).tagName))
        return el as HTMLElement;
      el = el.parentNode;
    }
    return null;
  }

  function closestTag(node: Node | null, tags: string[]): HTMLElement | null {
    let el: Node | null = node;
    while (el && el !== document.body) {
      if (
        el.nodeType === 1 &&
        tags.includes((el as HTMLElement).tagName.toLowerCase())
      )
        return el as HTMLElement;
      el = el.parentNode;
    }
    return null;
  }

  function anchorBlock(): HTMLElement | null {
    const s = getSel();
    if (!s || s.rangeCount === 0) return null;
    return closestBlock(s.anchorNode);
  }

  function moveTo(el: HTMLElement, toEnd = false) {
    const s = getSel();
    if (!s) return;
    const r = document.createRange();
    if (toEnd) {
      r.selectNodeContents(el);
      r.collapse(false);
    } else {
      r.setStart(el, 0);
      r.collapse(true);
    }
    s.removeAllRanges();
    s.addRange(r);
  }

  function unwrapEl(el: Element) {
    const p = el.parentNode;
    if (!p) return;
    while (el.firstChild) p.insertBefore(el.firstChild, el);
    p.removeChild(el);
  }

  // ─── Mark detection ───────────────────────────────────────────────────────
  function isMarkActive(tags: string[]): boolean {
    const s = getSel();
    if (!s) return false;
    let n: Node | null = s.anchorNode;
    while (n && n !== document.body) {
      if (
        n.nodeType === 1 &&
        tags.includes((n as HTMLElement).tagName.toLowerCase())
      )
        return true;
      n = n.parentNode;
    }
    return false;
  }

  // ─── Mark commands ────────────────────────────────────────────────────────
  function wrapWith(tag: string, attrs?: Record<string, string>) {
    const s = getSel();
    if (!s || s.rangeCount === 0 || s.isCollapsed) return;
    const r = s.getRangeAt(0);
    try {
      const wrapper = document.createElement(tag);
      if (attrs)
        for (const [k, v] of Object.entries(attrs)) wrapper.setAttribute(k, v);
      r.surroundContents(wrapper);
      r.selectNodeContents(wrapper);
      s.removeAllRanges();
      s.addRange(r);
    } catch {
      // surroundContents fails on partial selections across block — fallback
      const frag = r.extractContents();
      const wrapper = document.createElement(tag);
      if (attrs)
        for (const [k, v] of Object.entries(attrs)) wrapper.setAttribute(k, v);
      wrapper.appendChild(frag);
      r.insertNode(wrapper);
      r.selectNodeContents(wrapper);
      s.removeAllRanges();
      s.addRange(r);
    }
  }

  function toggleMark(
    tag: string,
    tags: string[],
    attrs?: Record<string, string>,
  ) {
    if (isMarkActive(tags)) {
      // unwrap all matching ancestors from anchor
      const s = getSel();
      if (s) {
        let n: Node | null = s.anchorNode;
        while (n && n !== document.body) {
          if (
            n.nodeType === 1 &&
            tags.includes((n as HTMLElement).tagName.toLowerCase())
          ) {
            unwrapEl(n as HTMLElement);
            break;
          }
          n = n.parentNode;
        }
        // also unwrap within selection range if needed
        if (s.rangeCount > 0) {
          const r = s.getRangeAt(0);
          const container = r.commonAncestorContainer;
          const root =
            container.nodeType === 1
              ? (container as HTMLElement)
              : container.parentElement!;
          root.querySelectorAll(tags.join(",")).forEach(unwrapEl);
        }
      }
    } else {
      wrapWith(tag, attrs);
    }
    emit();
  }

  function bold() {
    toggleMark("strong", ["strong", "b"]);
  }
  function italic() {
    toggleMark("em", ["em", "i"]);
  }
  function underline() {
    toggleMark("u", ["u"]);
  }
  function strike() {
    toggleMark("s", ["s", "strike", "del"]);
  }
  function inlineCode() {
    toggleMark("code", ["code"]);
  }
  function superscript() {
    toggleMark("sup", ["sup"]);
  }
  function subscript() {
    toggleMark("sub", ["sub"]);
  }

  function setColor(color: string) {
    restoreRange();
    const s = getSel();
    if (!s || s.isCollapsed) return;
    wrapWith("span", { style: `color:${color}` });
    emit();
  }

  function setHighlight(color: string) {
    restoreRange();
    const s = getSel();
    if (!s || s.isCollapsed) return;
    wrapWith("mark", { style: `background-color:${color}` });
    emit();
  }

  function setFontSize(size: string) {
    restoreRange();
    const s = getSel();
    if (!s || s.isCollapsed) return;
    wrapWith("span", { style: `font-size:${size}` });
    emit();
  }

  function setFontFamily(family: string) {
    restoreRange();
    const s = getSel();
    if (!s || s.isCollapsed) return;
    wrapWith("span", { style: `font-family:${family}` });
    emit();
  }

  function setLink(href: string) {
    restoreRange();
    const s = getSel();
    if (!s || s.rangeCount === 0) return;
    const existing = closestTag(s.anchorNode, ["a"]);
    if (existing) {
      (existing as HTMLAnchorElement).href = href;
    } else {
      wrapWith("a", { href, target: "_blank", rel: "noopener noreferrer" });
    }
    emit();
  }

  function unlink() {
    const s = getSel();
    if (!s) return;
    const a = closestTag(s.anchorNode, ["a"]);
    if (a) unwrapEl(a);
    emit();
  }

  function clearFormatting() {
    restoreRange();
    const s = getSel();
    if (!s || s.rangeCount === 0) return;

    if (!s.isCollapsed) {
      const r = s.getRangeAt(0);
      const frag = r.extractContents();
      const div = document.createElement("div");
      div.appendChild(frag);

      const INLINE_TAGS = [
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "del",
        "strike",
        "code",
        "mark",
        "span",
        "sup",
        "sub",
        "a",
        "font",
      ];
      INLINE_TAGS.forEach((tag) => {
        div.querySelectorAll(tag).forEach((el) => {
          const p = el.parentNode;
          if (!p) return;
          while (el.firstChild) p.insertBefore(el.firstChild, el);
          p.removeChild(el);
        });
      });
      div.querySelectorAll("[style]").forEach((el) => {
        el.removeAttribute("style");
      });
      div.querySelectorAll("[class]").forEach((el) => {
        el.removeAttribute("class");
      });

      const outFrag = document.createDocumentFragment();
      while (div.firstChild) outFrag.appendChild(div.firstChild);
      r.insertNode(outFrag);
    }
    formatBlock("p");
    emit();
  }

  // ─── Block commands ───────────────────────────────────────────────────────
  function formatBlock(tag: string) {
    const s = getSel();
    if (!s || s.rangeCount === 0) return;
    const block = anchorBlock();
    if (!block || block === document.body) {
      const el = document.createElement(tag);
      el.innerHTML = "<br>";
      document.body.appendChild(el);
      moveTo(el);
      emit();
      return;
    }
    if (block.tagName.toLowerCase() === tag.toLowerCase()) {
      // Toggle off → paragraph
      const p = document.createElement("p");
      p.innerHTML = block.innerHTML || "<br>";
      block.parentNode?.replaceChild(p, block);
      moveTo(p, true);
    } else {
      const newBlock = document.createElement(tag);
      newBlock.innerHTML = block.innerHTML || "<br>";
      block.parentNode?.replaceChild(newBlock, block);
      moveTo(newBlock, true);
    }
    emit();
  }

  function setAlign(align: string) {
    const block = anchorBlock();
    if (block) {
      block.style.textAlign = align;
      emit();
    }
  }

  function indent() {
    const block = anchorBlock();
    if (!block) return;
    const cur = parseFloat(block.style.paddingLeft || "0");
    block.style.paddingLeft = `${cur + 24}px`;
    emit();
  }

  function outdent() {
    const block = anchorBlock();
    if (!block) return;
    const cur = parseFloat(block.style.paddingLeft || "0");
    block.style.paddingLeft = `${Math.max(0, cur - 24)}px`;
    emit();
  }

  function toggleList(tag: "ul" | "ol") {
    const s = getSel();
    if (!s || s.rangeCount === 0) return;
    const block = anchorBlock();
    if (!block) return;
    const existing = closestTag(block, [tag]);
    if (existing) {
      // unwrap list
      const items = Array.from(existing.querySelectorAll("li"));
      items.forEach((li) => {
        const p = document.createElement("p");
        p.innerHTML = li.innerHTML || "<br>";
        existing.parentNode?.insertBefore(p, existing);
      });
      existing.remove();
    } else {
      const list = document.createElement(tag);
      const li = document.createElement("li");
      li.innerHTML = block.innerHTML || "<br>";
      list.appendChild(li);
      block.parentNode?.replaceChild(list, block);
      moveTo(li, true);
    }
    emit();
  }

  function insertHR() {
    const block = anchorBlock();
    const hr = document.createElement("hr");
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    if (block && block !== document.body) {
      block.parentNode?.insertBefore(hr, block.nextSibling);
      block.parentNode?.insertBefore(p, hr.nextSibling);
    } else {
      document.body.appendChild(hr);
      document.body.appendChild(p);
    }
    moveTo(p);
    emit();
  }

  function insertTaskList() {
    restoreRange();
    const ul = document.createElement("ul");
    ul.className="erix-task-list";
    ul.setAttribute("data-erix-task-list", "true");
    const li = document.createElement("li");
    li.className="erix-task-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.contentEditable = "false";
    const span = document.createElement("span");
    span.innerHTML = "<br>";
    li.appendChild(cb);
    li.appendChild(span);
    ul.appendChild(li);
    const block = anchorBlock();
    if (block && block !== document.body) {
      block.parentNode?.insertBefore(ul, block.nextSibling);
    } else {
      document.body.appendChild(ul);
    }
    moveTo(span);
    // checkbox toggle
    cb.addEventListener("change", () => {
      li.classList.toggle("done", cb.checked);
      emit();
    });
    emit();
  }

  function insertCallout(
    emoji = "💡",
    bgColor = "#fef3c7",
    borderColor = "#fcd34d",
  ) {
    restoreRange();
    const callout = document.createElement("div");
    callout.className="erix-callout";
    callout.setAttribute("data-erix-type", "callout");
    callout.style.cssText = `background:${bgColor};border-color:${borderColor};`;
    const emojiEl = document.createElement("span");
    emojiEl.className="erix-callout-emoji";
    emojiEl.contentEditable = "false";
    emojiEl.textContent = emoji;
    const content = document.createElement("div");
    content.className="erix-callout-content";
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    content.appendChild(p);
    callout.appendChild(emojiEl);
    callout.appendChild(content);
    const block = anchorBlock();
    if (block && block !== document.body)
      block.parentNode?.insertBefore(callout, block.nextSibling);
    else document.body.appendChild(callout);
    moveTo(p);
    emit();
  }

  function insertToggle() {
    restoreRange();
    const toggle = document.createElement("div");
    toggle.className="erix-toggle";
    toggle.setAttribute("data-erix-type", "toggle");
    const trigger = document.createElement("div");
    trigger.className="erix-toggle-trigger";
    trigger.contentEditable = "false";
    const arrow = document.createElement("span");
    arrow.className="erix-toggle-arrow";
    arrow.textContent = "▶";
    const label = document.createElement("span");
    label.contentEditable = "true";
    label.textContent = "Toggle";
    trigger.appendChild(arrow);
    trigger.appendChild(label);
    const content = document.createElement("div");
    content.className="erix-toggle-content";
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    content.appendChild(p);
    toggle.appendChild(trigger);
    toggle.appendChild(content);
    trigger.addEventListener("click", () => toggle.classList.toggle("open"));
    const block = anchorBlock();
    if (block && block !== document.body)
      block.parentNode?.insertBefore(toggle, block.nextSibling);
    else document.body.appendChild(toggle);
    moveTo(p);
    emit();
  }

  function insertTable(rows = 3, cols = 3) {
    restoreRange();
    const wrapper = document.createElement("div");
    wrapper.className="erix-table-wrapper";
    const table = document.createElement("table");
    table.style.width = "100%";
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) {
        const cell =
          r === 0 ? document.createElement("th") : document.createElement("td");
        cell.innerHTML = "<br>";
        tr.appendChild(cell);
      }
      table.appendChild(tr);
    }
    wrapper.appendChild(table);
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    const block = anchorBlock();
    if (block && block !== document.body) {
      block.parentNode?.insertBefore(wrapper, block.nextSibling);
      block.parentNode?.insertBefore(p, wrapper.nextSibling);
    } else {
      document.body.appendChild(wrapper);
      document.body.appendChild(p);
    }
    const first = table.querySelector("th, td") as HTMLElement;
    if (first) moveTo(first);
    emit();
  }

  // ─── Table editing ────────────────────────────────────────────────────────
  function getActiveCell(): HTMLTableCellElement | null {
    const s = getSel();
    if (!s) return null;
    return (
      (s.anchorNode?.parentElement?.closest(
        "td, th",
      ) as HTMLTableCellElement) ?? null
    );
  }

  function tableAddRow(position: "before" | "after" = "after") {
    const cell = getActiveCell();
    if (!cell) return;
    const row = cell.closest("tr") as HTMLTableRowElement;
    if (!row) return;
    const colCount = row.cells.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td");
      td.innerHTML = "<br>";
      newRow.appendChild(td);
    }
    if (position === "before") {
      row.parentNode?.insertBefore(newRow, row);
    } else {
      row.parentNode?.insertBefore(newRow, row.nextSibling);
    }
    emit();
  }

  function tableAddCol(position: "before" | "after" = "after") {
    const cell = getActiveCell();
    if (!cell) return;
    const table = cell.closest("table");
    if (!table) return;
    const colIndex = cell.cellIndex;
    table.querySelectorAll("tr").forEach((row) => {
      const refCell = row.cells[colIndex];
      const isHeader = refCell?.tagName === "TH";
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.innerHTML = "<br>";
      if (position === "before" && refCell) {
        row.insertBefore(newCell, refCell);
      } else if (refCell?.nextSibling) {
        row.insertBefore(newCell, refCell.nextSibling);
      } else {
        row.appendChild(newCell);
      }
    });
    emit();
  }

  function tableDeleteRow() {
    const cell = getActiveCell();
    if (!cell) return;
    const row = cell.closest("tr");
    if (!row) return;
    const table = row.closest("table");
    if (!table) return;
    // Don't delete if it's the last row
    if (table.querySelectorAll("tr").length <= 1) {
      deleteTable();
      return;
    }
    row.remove();
    emit();
  }

  function tableDeleteCol() {
    const cell = getActiveCell();
    if (!cell) return;
    const table = cell.closest("table");
    if (!table) return;
    const colIndex = cell.cellIndex;
    const rows = table.querySelectorAll("tr");
    // Don't delete if it's the last column
    if (rows[0]?.cells.length <= 1) {
      deleteTable();
      return;
    }
    rows.forEach((row) => {
      const c = row.cells[colIndex];
      if (c) c.remove();
    });
    emit();
  }

  function deleteTable() {
    const cell = getActiveCell();
    if (!cell) return;
    const wrapper =
      cell.closest(".erix-table-wrapper") ?? cell.closest("table");
    if (!wrapper) return;
    const replacement = document.createElement("p");
    replacement.innerHTML = "<br>";
    wrapper.parentNode?.insertBefore(replacement, wrapper);
    wrapper.remove();
    moveTo(replacement);
    emit();
  }

  function insertColumns(cols = 2) {
    restoreRange();
    const layout = document.createElement("div");
    layout.className="erix-columns";
    layout.setAttribute("data-cols", String(cols));
    for (let i = 0; i < cols; i++) {
      const col = document.createElement("div");
      col.className="erix-column";
      const p = document.createElement("p");
      p.innerHTML = "<br>";
      col.appendChild(p);
      layout.appendChild(col);
    }
    const p2 = document.createElement("p");
    p2.innerHTML = "<br>";
    const block = anchorBlock();
    if (block && block !== document.body) {
      block.parentNode?.insertBefore(layout, block.nextSibling);
      block.parentNode?.insertBefore(p2, layout.nextSibling);
    } else {
      document.body.appendChild(layout);
      document.body.appendChild(p2);
    }
    const firstCol = layout.querySelector(".erix-column p") as HTMLElement;
    if (firstCol) moveTo(firstCol);
    emit();
  }

  function insertVideo(url: string) {
    restoreRange();
    let embedUrl = url;
    // Convert YouTube watch URL to embed
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
    );
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch)
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    const wrapper = document.createElement("div");
    wrapper.className="erix-video-embed";
    wrapper.setAttribute("data-erix-type", "video");
    wrapper.setAttribute("data-src", url);
    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.allowFullscreen = true;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    wrapper.appendChild(iframe);
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    const block = anchorBlock();
    if (block && block !== document.body) {
      block.parentNode?.insertBefore(wrapper, block.nextSibling);
      block.parentNode?.insertBefore(p, wrapper.nextSibling);
    } else {
      document.body.appendChild(wrapper);
      document.body.appendChild(p);
    }
    moveTo(p);
    emit();
  }

  function insertImage(url: string, alt = "", link?: string) {
    restoreRange();
    const figure = document.createElement("figure");
    figure.setAttribute("data-erix-type", "image");
    figure.style.cssText =
      "margin:1.5em 0; position:relative; overflow:hidden;";

    const img = document.createElement("img");
    img.src = url;
    img.alt = alt;
    img.style.cssText =
      "max-width:100%; height:auto; display:block; border-radius:var(--erix-radius-md);";

    if (link) {
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.appendChild(img);
      figure.appendChild(a);
    } else {
      figure.appendChild(img);
    }
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    const block = anchorBlock();
    if (block && block !== document.body) {
      block.parentNode?.insertBefore(figure, block.nextSibling);
      block.parentNode?.insertBefore(p, figure.nextSibling);
    } else {
      document.body.appendChild(figure);
      document.body.appendChild(p);
    }
    moveTo(p);
    emit();
  }

  // ─── Input rules (markdown shortcuts) ───────────────────────────────────
  function checkInputRules() {
    const shortcutsEnabled = document.body.dataset.shortcuts === "true";
    if (!shortcutsEnabled) return;

    const s = getSel();
    if (!s || s.rangeCount === 0 || !s.isCollapsed) return;
    const block = anchorBlock();
    if (!block) return;
    const text = block.textContent || "";

    const rules: Array<[string, () => void]> = [
      [
        "# ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("h1");
        },
      ],
      [
        "## ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("h2");
        },
      ],
      [
        "### ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("h3");
        },
      ],
      [
        "#### ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("h4");
        },
      ],
      [
        "##### ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("h5");
        },
      ],
      [
        "###### ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("h6");
        },
      ],
      [
        "> ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("blockquote");
        },
      ],
      [
        "``` ",
        () => {
          block.innerHTML = "<br>";
          formatBlock("pre");
        },
      ],
      [
        "---",
        () => {
          block.innerHTML = "<br>";
          insertHR();
        },
      ],
      [
        "___",
        () => {
          block.innerHTML = "<br>";
          insertHR();
        },
      ],
      [
        "- ",
        () => {
          block.innerHTML = "<br>";
          toggleList("ul");
        },
      ],
      [
        "* ",
        () => {
          block.innerHTML = "<br>";
          toggleList("ul");
        },
      ],
      [
        "[ ] ",
        () => {
          block.innerHTML = "<br>";
          insertTaskList();
        },
      ],
      [
        "[x] ",
        () => {
          block.innerHTML = "<br>";
          insertTaskList();
        },
      ],
    ];

    // Ordered list: "1. " or "1) "
    if (/^\d+[.)]\s$/.test(text)) {
      block.innerHTML = "<br>";
      toggleList("ol");
      return;
    }

    for (const [prefix, action] of rules) {
      if (text === prefix) {
        action();
        return;
      }
    }
  }

  // ─── Slash command ────────────────────────────────────────────────────────
  function openSlash() {
    inSlash = true;
    slashQuery = "";
    const s = getSel();
    if (!s || s.rangeCount === 0) return;
    const rect = s.getRangeAt(0).getBoundingClientRect();
    send("ERIX_SLASH_OPEN", {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      query: "",
    });
  }

  function closeSlash() {
    inSlash = false;
    slashQuery = "";
    send("ERIX_SLASH_CLOSE", {});
  }

  function executeSlash(command: string, data?: Record<string, unknown>) {
    // Delete the slash trigger text from current block
    const block = anchorBlock();
    if (block) {
      const text = block.textContent || "";
      if (text.startsWith("/")) block.innerHTML = "<br>";
    }
    closeSlash();
    switch (command) {
      case "h1":
        formatBlock("h1");
        break;
      case "h2":
        formatBlock("h2");
        break;
      case "h3":
        formatBlock("h3");
        break;
      case "h4":
        formatBlock("h4");
        break;
      case "h5":
        formatBlock("h5");
        break;
      case "h6":
        formatBlock("h6");
        break;
      case "paragraph":
        formatBlock("p");
        break;
      case "blockquote":
        formatBlock("blockquote");
        break;
      case "code":
        formatBlock("pre");
        break;
      case "ul":
        toggleList("ul");
        break;
      case "ol":
        toggleList("ol");
        break;
      case "task":
        insertTaskList();
        break;
      case "callout":
        insertCallout(
          (data?.emoji as string) || "💡",
          (data?.bg as string) || "#fef3c7",
        );
        break;
      case "toggle":
        insertToggle();
        break;
      case "hr":
        insertHR();
        break;
      case "table":
        insertTable((data?.rows as number) || 3, (data?.cols as number) || 3);
        break;
      case "columns2":
        insertColumns(2);
        break;
      case "columns3":
        insertColumns(3);
        break;
      case "image":
        send("ERIX_IMAGE_OPEN", {});
        break;
      case "video":
        send("ERIX_VIDEO_OPEN", {});
        break;
    }
  }

  // ─── History ─────────────────────────────────────────────────────────────
  function snapshot(): HistoryEntry {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelector("#__ERIX_RUNTIME__")?.remove();
    return { html: clone.innerHTML.trim(), sel: getCaretPath() };
  }

  function pushHistory() {
    const entry = snapshot();
    const last = undoStack[undoStack.length - 1];
    if (last?.html === entry.html) return;
    undoStack.push(entry);
    if (undoStack.length > 200) undoStack.shift();
    redoStack.length = 0;
    send("ERIX_HISTORY", { canUndo: undoStack.length > 1, canRedo: false });
  }

  function schedulePush() {
    if (historyTimer) clearTimeout(historyTimer);
    historyTimer = setTimeout(pushHistory, 400);
  }

  function undo() {
    if (undoStack.length <= 1) return;
    const cur = undoStack.pop()!;
    redoStack.push(cur);
    const prev = undoStack[undoStack.length - 1];
    document.body.innerHTML = prev.html || "<p><br></p>";
    ensureContent();
    setCaretFromPath(prev.sel);
    send("ERIX_UPDATE", { html: prev.html });
    send("ERIX_HISTORY", {
      canUndo: undoStack.length > 1,
      canRedo: redoStack.length > 0,
    });
    sendContext();
  }

  function redo() {
    if (redoStack.length === 0) return;
    const next = redoStack.pop()!;
    undoStack.push(next);
    document.body.innerHTML = next.html || "<p><br></p>";
    ensureContent();
    setCaretFromPath(next.sel);
    send("ERIX_UPDATE", { html: next.html });
    send("ERIX_HISTORY", {
      canUndo: undoStack.length > 1,
      canRedo: redoStack.length > 0,
    });
    sendContext();
  }

  // ─── Context ──────────────────────────────────────────────────────────────
  let activeImage: HTMLImageElement | null = null;

  function sendContext() {
    const s = getSel();
    if (!s) return;

    function inside(tags: string[]): boolean {
      let n: Node | null | undefined = s?.anchorNode;
      while (n && n !== document.body) {
        if (
          n.nodeType === 1 &&
          tags.includes((n as HTMLElement).tagName.toLowerCase())
        )
          return true;
        n = n.parentNode;
      }
      return false;
    }

    const block = anchorBlock();
    const blockTag = block?.tagName.toLowerCase() || "p";
    const textAlign = block
      ? (window.getComputedStyle(block).textAlign as string)
      : "left";
    const hasSelection = !s.isCollapsed && s.toString().length > 0;

    let selRect: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null = null;
    if (hasSelection && s.rangeCount > 0) {
      const rr = s.getRangeAt(0).getBoundingClientRect();
      if (rr.width > 0)
        selRect = { x: rr.left, y: rr.top, width: rr.width, height: rr.height };
    }

    // Indent detection
    const isIndented = block
      ? parseFloat(block.style.paddingLeft || "0") > 5
      : false;

    send("ERIX_CONTEXT", {
      bold: inside(["strong", "b"]),
      italic: inside(["em", "i"]),
      underline: inside(["u"]),
      strike: inside(["s", "strike", "del"]),
      code: inside(["code"]),
      link: inside(["a"]),
      blockTag,
      isHeading1: blockTag === "h1",
      isHeading2: blockTag === "h2",
      isHeading3: blockTag === "h3",
      isHeading4: blockTag === "h4",
      isHeading5: blockTag === "h5",
      isHeading6: blockTag === "h6",
      isParagraph: blockTag === "p",
      isBlockquote: blockTag === "blockquote",
      isCodeBlock: blockTag === "pre",
      isList: inside(["ul", "ol"]),
      isOrderedList: inside(["ol"]),
      isTaskList: !!block?.closest("[data-erix-task-list]"),
      textAlign,
      foreColor: (() => {
        let n: Node | null = s.anchorNode;
        while (n && n !== document.body) {
          if (n.nodeType === 1) {
            const color =
              (n as HTMLElement).style.color ||
              window.getComputedStyle(n as HTMLElement).color;
            if (
              color &&
              !color.includes("rgba(0, 0, 0, 0)") &&
              color !== "rgb(0, 0, 0)"
            )
              return color;
          }
          n = n.parentNode;
        }
        return "";
      })(),
      backColor: (() => {
        let n: Node | null = s.anchorNode;
        while (n && n !== document.body) {
          if (n.nodeType === 1) {
            const bg =
              (n as HTMLElement).style.backgroundColor ||
              window.getComputedStyle(n as HTMLElement).backgroundColor;
            if (bg && !bg.includes("rgba(0, 0, 0, 0)")) return bg;
          }
          n = n.parentNode;
        }
        return "";
      })(),
      hasSelection,
      selectionRect: selRect,
      isIndented,
      isEmbed: !!block?.closest("figure, .erix-video-embed"),
      isNonEditable: !!block?.closest('[contenteditable="false"]'),
      isInTable: !!s.anchorNode?.parentElement?.closest("td, th"),
      fontSize: (() => {
        let n: Node | null = s.anchorNode;
        while (n && n !== document.body) {
          if (n.nodeType === 1) {
            const fs = (n as HTMLElement).style.fontSize;
            if (fs) return fs;
          }
          n = n.parentNode;
        }
        const el =
          s.anchorNode?.nodeType === 3
            ? s.anchorNode.parentElement
            : (s.anchorNode as HTMLElement | null);
        return el ? window.getComputedStyle(el).fontSize : "";
      })(),
      fontFamily: (() => {
        let n: Node | null = s.anchorNode;
        while (n && n !== document.body) {
          if (n.nodeType === 1) {
            const ff = (n as HTMLElement).style.fontFamily;
            if (ff) return ff;
          }
          n = n.parentNode;
        }
        return "";
      })(),
      activeImage: activeImage
        ? {
            x: activeImage.getBoundingClientRect().left,
            y: activeImage.getBoundingClientRect().top,
            width: activeImage.getBoundingClientRect().width,
            height: activeImage.getBoundingClientRect().height,
            src: activeImage.src,
          }
        : null,
    });

    saveRange();
  }

  // ─── Placeholder ──────────────────────────────────────────────────────────
  function checkPlaceholder() {
    const isEmpty =
      !document.body.textContent?.trim() &&
      !document.body.querySelector(
        "img,table,.erix-callout,.erix-task-list,.erix-video-embed",
      );
    document.body.classList.toggle("erix-empty", isEmpty);
  }

  // ─── Initial content ──────────────────────────────────────────────────────
  function ensureContent() {
    if (
      !document.body.innerHTML.trim() ||
      document.body.innerHTML.trim() === "<br>"
    ) {
      document.body.innerHTML = "<p><br></p>";
    }
  }

  // ─── Emit update ─────────────────────────────────────────────────────────
  function emit() {
    checkPlaceholder();
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelector("#__ERIX_RUNTIME__")?.remove();
    const rawText = clone.textContent || "";
    send("ERIX_UPDATE", {
      html: clone.innerHTML.trim(),
      text: rawText,
      charCount: rawText.length,
      wordCount: rawText.trim() ? rawText.trim().split(/\s+/).length : 0,
    });
    sendContext();
    schedulePush();
  }

  // ─── Paste ───────────────────────────────────────────────────────────────
  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const cd = e.clipboardData;
    if (!cd) return;
    const htmlData = cd.getData("text/html");
    const textData = cd.getData("text/plain");

    if (htmlData) {
      const clean = sanitizeHTML(htmlData);
      const r = getSel()?.getRangeAt(0);
      if (!r) return;
      r.deleteContents();
      r.insertNode(document.createRange().createContextualFragment(clean));
      r.collapse(false);
    } else if (textData) {
      const lines = textData.split("\n");
      const frag = document.createDocumentFragment();
      lines.forEach((line, i) => {
        const p = document.createElement("p");
        p.textContent = line || "";
        if (!p.textContent) p.innerHTML = "<br>";
        frag.appendChild(p);
        if (i < lines.length - 1) frag.appendChild(document.createTextNode(""));
      });
      const r = getSel()?.getRangeAt(0);
      if (!r) return;
      r.deleteContents();
      r.insertNode(frag);
      r.collapse(false);
    }
    emit();
  }

  function sanitizeHTML(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    // Remove dangerous elements
    div
      .querySelectorAll("script,style,iframe,object,embed,meta,link")
      .forEach((el) => {
        el.remove();
      });
    // Clean attributes
    const allowed = [
      "href",
      "src",
      "alt",
      "type",
      "checked",
      "colspan",
      "rowspan",
      "target",
      "rel",
    ];
    div.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes)
        .filter((a) => !allowed.includes(a.name))
        .forEach((a) => {
          el.removeAttribute(a.name);
        });
    });
    // Collapse empty wrappers
    div.querySelectorAll("span, font").forEach((el) => {
      if (!el.attributes.length) {
        const p = el.parentNode;
        if (p) {
          while (el.firstChild) p.insertBefore(el.firstChild, el);
          p.removeChild(el);
        }
      }
    });
    return div.innerHTML;
  }

  // ─── Keyboard ────────────────────────────────────────────────────────────
  function handleKeydown(e: KeyboardEvent) {
    const shortcutsEnabled = document.body.dataset.shortcuts === "true";
    const ctrl = e.ctrlKey || e.metaKey;

    // Block formatting shortcuts if disabled
    if (ctrl && !shortcutsEnabled) {
      const formattingKeys = ["b", "i", "u", "k", "s", "z", "y"];
      if (formattingKeys.includes(e.key.toLowerCase())) {
        e.preventDefault(); // Stop native browser behavior + editor behavior
        return;
      }
    }

    if (ctrl && !e.shiftKey && e.key === "z") {
      e.preventDefault();
      undo();
      return;
    }
    if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
      e.preventDefault();
      redo();
      return;
    }
    if (ctrl && e.key === "b") {
      e.preventDefault();
      bold();
      return;
    }
    if (ctrl && e.key === "i") {
      e.preventDefault();
      italic();
      return;
    }
    if (ctrl && e.key === "u") {
      e.preventDefault();
      underline();
      return;
    }
    if (ctrl && e.key === "k") {
      e.preventDefault();
      restoreRange();
      send("ERIX_LINK_OPEN", {});
      return;
    }

    // Heading shortcuts (Ctrl+Alt+1-6)
    if (ctrl && e.altKey && /^[1-6]$/.test(e.key)) {
      e.preventDefault();
      formatBlock(`h${e.key}`);
      return;
    }
    // Paragraph shortcut (Ctrl+Alt+0)
    if (ctrl && e.altKey && e.key === "0") {
      e.preventDefault();
      formatBlock("p");
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) outdent();
      else indent();
      return;
    }

    if (e.key === "Escape") {
      if (inSlash) {
        closeSlash();
        return;
      }
    }

    if (e.key === "Enter") {
      const block = anchorBlock();
      if (block?.tagName === "PRE") {
        e.preventDefault();
        const s = getSel();
        if (!s || s.rangeCount === 0) return;
        const r = s.getRangeAt(0);
        r.deleteContents();
        const nl = document.createTextNode("\n");
        r.insertNode(nl);
        r.setStartAfter(nl);
        r.collapse(true);
        s.removeAllRanges();
        s.addRange(r);
        emit();
        return;
      }
      // Heading → new paragraph on Enter
      if (block && /^H[1-6]$/.test(block.tagName)) {
        e.preventDefault();
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        block.parentNode?.insertBefore(p, block.nextSibling);
        moveTo(p);
        emit();
        return;
      }
      if (inSlash) closeSlash();
    }
  }

  // ─── Message handler ─────────────────────────────────────────────────────
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data || {};
    switch (d.type) {
      case "ERIX_BOLD":
        bold();
        break;
      case "ERIX_ITALIC":
        italic();
        break;
      case "ERIX_UNDERLINE":
        underline();
        break;
      case "ERIX_STRIKE":
        strike();
        break;
      case "ERIX_CODE":
        inlineCode();
        break;
      case "ERIX_SUPERSCRIPT":
        superscript();
        break;
      case "ERIX_SUBSCRIPT":
        subscript();
        break;
      case "ERIX_FORMAT_BLOCK":
        formatBlock(d.tag);
        break;
      case "ERIX_ALIGN":
        setAlign(d.align);
        break;
      case "ERIX_INDENT":
        indent();
        break;
      case "ERIX_OUTDENT":
        outdent();
        break;
      case "ERIX_COLOR":
        setColor(d.color);
        break;
      case "ERIX_HIGHLIGHT":
        setHighlight(d.color);
        break;
      case "ERIX_FONT_SIZE":
        setFontSize(d.size);
        break;
      case "ERIX_FONT_FAMILY":
        setFontFamily(d.family);
        break;
      case "ERIX_LINK":
        setLink(d.url);
        break;
      case "ERIX_UNLINK":
        unlink();
        break;
      case "ERIX_LIST_UL":
        toggleList("ul");
        break;
      case "ERIX_LIST_OL":
        toggleList("ol");
        break;
      case "ERIX_TASK_LIST":
        insertTaskList();
        break;
      case "ERIX_CALLOUT":
        insertCallout(d.emoji, d.bg, d.border);
        break;
      case "ERIX_TOGGLE":
        insertToggle();
        break;
      case "ERIX_HR":
        insertHR();
        break;
      case "ERIX_TABLE":
        insertTable(d.rows, d.cols);
        break;
      case "ERIX_COLUMNS":
        insertColumns(d.cols);
        break;
      case "ERIX_IMAGE":
        insertImage(d.url, d.alt, d.link);
        break;
      case "ERIX_RESIZE_IMAGE":
        if (activeImage && typeof d.width === "number") {
          activeImage.style.width = `${d.width}px`;
          if (d.height) activeImage.style.height = `${d.height}px`;
          else activeImage.style.height = "auto";
          sendContext(); // update rect
        }
        break;
      case "ERIX_VIDEO":
        insertVideo(d.url);
        break;
      case "ERIX_CLEAR_FORMAT":
        clearFormatting();
        break;
      case "ERIX_INSERT_HTML":
        restoreRange();
        {
          const r = getSel()?.getRangeAt(0);
          if (r) {
            r.deleteContents();
            r.insertNode(
              document.createRange().createContextualFragment(d.html),
            );
          }
          emit();
          break;
        }
      case "ERIX_SET_HTML":
        document.body.innerHTML = d.html || "<p><br></p>";
        ensureContent();
        checkPlaceholder();
        send("ERIX_UPDATE", { html: document.body.innerHTML });
        sendContext();
        break;
      case "ERIX_UNDO":
        undo();
        break;
      case "ERIX_REDO":
        redo();
        break;
      case "ERIX_SLASH_EXEC":
        executeSlash(d.command, d);
        break;
      case "ERIX_FOCUS":
        document.body.focus();
        break;
      case "ERIX_GET_CTX":
        sendContext();
        break;
      case "ERIX_THEME":
        // Apply theme tokens directly as CSS vars to :root in iframe
        if (d.tokens && typeof d.tokens === "object") {
          const style =
            document.getElementById("__ERIX_THEME__") ||
            document.createElement("style");
          style.id = "__ERIX_THEME__";
          const vars = Object.entries(d.tokens as Record<string, string>)
            .map(([k, v]) => `--erix-${k}:${v};`)
            .join("");
          style.textContent = `:root{${vars}}`;
          if (!document.getElementById("__ERIX_THEME__"))
            document.head.appendChild(style);
        }
        break;
      // ── Table controls ──
      case "ERIX_TABLE_ADD_ROW":
        tableAddRow(d.pos as "before" | "after");
        break;
      case "ERIX_TABLE_ADD_COL":
        tableAddCol(d.pos as "before" | "after");
        break;
      case "ERIX_TABLE_DEL_ROW":
        tableDeleteRow();
        break;
      case "ERIX_TABLE_DEL_COL":
        tableDeleteCol();
        break;
      case "ERIX_TABLE_DELETE":
        deleteTable();
        break;
      // ── Read-Only ──
      case "ERIX_SET_READONLY":
        document.body.contentEditable = d.readonly ? "false" : "true";
        document.body.dataset.readonly = String(d.readonly);
        break;
    }
  });

  // ─── Input listener ──────────────────────────────────────────────────────
  document.body.addEventListener("input", (e: Event) => {
    checkInputRules();
    // Slash command detection
    const ie = e as InputEvent;
    if (ie.data === "/") {
      const block = anchorBlock();
      const text = block?.textContent?.trim() || "";
      if (text === "/") {
        openSlash();
        return;
      }
    }
    if (inSlash) {
      if (ie.inputType === "deleteContentBackward") {
        if (slashQuery.length > 0) {
          slashQuery = slashQuery.slice(0, -1);
          send("ERIX_SLASH_QUERY", { query: slashQuery });
        } else {
          closeSlash();
        }
      } else if (ie.data) {
        slashQuery += ie.data;
        send("ERIX_SLASH_QUERY", { query: slashQuery });
      }
    }
    emit();
  });

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("paste", handlePaste as EventListener);
  document.addEventListener("selectionchange", () => {
    sendContext();
    saveRange();
  });
  const handleOutsideClick = () => send("ERIX_CLICK_OUTSIDE");
  document.addEventListener("pointerdown", handleOutsideClick, true);
  document.addEventListener("mousedown", handleOutsideClick, true);

  // Active image tracking
  document.addEventListener("mousedown", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      activeImage = target as HTMLImageElement;
      // Slight delay to allow selection to settle
      setTimeout(sendContext, 10);
    } else if (activeImage) {
      activeImage = null;
      setTimeout(sendContext, 10);
    }
  });

  // ─── Drag & Drop ────────────────────────────────────────────────────────
  document.body.addEventListener("dragover", (e) => e.preventDefault());
  document.body.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;
        // Insert immediately as preview
        insertImage(dataUrl, file.name);
        // Also notify the host — host can upload, get a real URL, and call engine.image() to replace
        send("ERIX_DROP_IMAGE", { dataUrl, name: file.name });
      };
      reader.readAsDataURL(file);
    });
  });

  document.body.addEventListener("focusin", () => send("ERIX_FOCUS_IN"));
  document.body.addEventListener("focusout", () => send("ERIX_FOCUS_OUT"));

  // Checkbox toggle inside task lists
  document.body.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" &&
      target.getAttribute("type") === "checkbox"
    ) {
      const li = target.closest(".erix-task-item");
      if (li) {
        li.classList.toggle("done", (target as HTMLInputElement).checked);
        emit();
      }
    }
  });

  // ─── Boot ────────────────────────────────────────────────────────────────
  checkPlaceholder();
  ensureContent();
  pushHistory();

  const announce = () => {
    if (document.body?.isContentEditable) send("ERIX_READY", {});
    else setTimeout(announce, 50);
  };
  announce();
}
