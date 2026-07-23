/**
 * 代码块增强：把"编辑器透传的裸 <pre><code data-language>" 与
 * "markdown 渲染的 <pre><code class=language-x>" 两种来源，
 * 统一升级成 GitHub 风格容器（header + 行号 + 高亮 + 复制 + 折叠）。
 *
 * 高亮器由调用方传入，不再自行加载 highlight.js，避免重复加载。
 * @returns 解绑函数。
 */

const COLLAPSE_LINE_THRESHOLD = 16;

/** 高亮器类型：接收原始代码与语言名，返回 HTML 或 null。 */
type Highlighter = (code: string, language: string) => string | null | undefined;

/* ============================================================
   工具：语言 / 解码 / 换行归一
   ============================================================ */

function detectLanguage(codeEl: HTMLElement): string {
  const fromAttr = codeEl.getAttribute("data-language");
  if (fromAttr) return fromAttr.trim().toLowerCase();
  const langClass = Array.from(codeEl.classList).find((c) => c.startsWith("language-"));
  if (langClass) return langClass.slice("language-".length);
  return "plaintext";
}

function decodeHtml(html: string): string {
  const tmp = document.createElement("textarea");
  tmp.innerHTML = html.replace(/<[^>]+>/g, "");
  return tmp.value;
}

/** 把任意形态的换行归一成真换行 0x0A。 */
function normalizeNewlines(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

/** 从 code 元素还原"真实行"的纯文本数组。 */
function extractRawLines(codeEl: HTMLElement): string[] {
  const html = codeEl.innerHTML;

  if (/<(div|p|li)\b/i.test(html)) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const blocks = tmp.querySelectorAll(
      ":scope > div, :scope > p, :scope > li, :scope > span.code-line",
    );
    if (blocks.length > 1) {
      return Array.from(blocks).map((b) => decodeHtml(b.innerHTML));
    }
  }

  const text = normalizeNewlines(codeEl.textContent ?? "");
  return text.replace(/\n$/, "").split("\n");
}

/* ============================================================
   按行拆分高亮 HTML
   ============================================================ */

function splitHighlightedByLine(highlighted: string): string[] {
  const lines: string[] = [];
  const openTags: string[] = [];
  let current = "";
  let i = 0;
  while (i < highlighted.length) {
    const ch = highlighted[i];
    if (ch === "\n") {
      lines.push(current + "</span>".repeat(openTags.length));
      current = openTags.join("");
      i += 1;
    } else if (ch === "<") {
      const end = highlighted.indexOf(">", i);
      if (end === -1) { current += ch; i += 1; continue; }
      const tag = highlighted.slice(i, end + 1);
      if (tag.startsWith("</")) openTags.pop();
      else if (!tag.endsWith("/>")) openTags.push(tag);
      current += tag;
      i = end + 1;
    } else {
      current += ch;
      i += 1;
    }
  }
  lines.push(current);
  return lines;
}

function padLines(lines: string[], target: number): string[] {
  if (lines.length === target) return lines;
  if (lines.length < target) return [...lines, ...Array(target - lines.length).fill("")];
  return lines.slice(0, target);
}

function escLine(l: string): string {
  const e = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return e === "" ? " " : e;
}

/** 渲染代码行 HTML（新布局：.code-row 包含行号 + 代码行）。 */
function buildCodeLinesHtml(
  highlighter: Highlighter | null,
  rawLines: string[],
  lang: string,
): string {
  const rawText = rawLines.join("\n");
  if (highlighter) {
    const highlighted = highlighter(rawText, lang);
    if (highlighted) {
      const hlLines = splitHighlightedByLine(highlighted);
      return padLines(hlLines, rawLines.length)
        .map(
          (line, idx) =>
            `<div class="code-row"><span class="code-block-line-number">${idx + 1}</span><span class="code-line">${line === "" ? " " : line}</span></div>`,
        )
        .join("");
    }
  }
  return rawLines
    .map(
      (l, idx) =>
        `<div class="code-row"><span class="code-block-line-number">${idx + 1}</span><span class="code-line">${escLine(l)}</span></div>`,
    )
    .join("");
}

/* ============================================================
   upgrade：把一个裸 pre 升级成完整容器（三阶段 DOM 法）
   ============================================================ */

function upgrade(pre: HTMLPreElement, highlighter: Highlighter | null): void {
  const codeEl = pre.querySelector("code") as HTMLElement | null;
  if (!codeEl) return;

  const lang = detectLanguage(codeEl);
  const rawLines = extractRawLines(codeEl);
  const lineCount = rawLines.length;
  const isCollapsible = lineCount > COLLAPSE_LINE_THRESHOLD;

  // 阶段 0：记下 pre 原位置
  const originalParent = pre.parentNode;
  const placeholder = document.createComment("code-block-placeholder");
  if (originalParent) {
    originalParent.insertBefore(placeholder, pre);
  }

  // 阶段 1：摘成游离节点
  pre.remove();
  pre.removeAttribute("style");

  // 阶段 2：组装容器
  const container = document.createElement("div");
  container.className = "code-block-container";

  const header = document.createElement("div");
  header.className = "code-block-header";

  const langLabel = document.createElement("span");
  langLabel.className = "code-block-lang";
  langLabel.textContent = lang;

  const actions = document.createElement("div");
  actions.className = "code-block-actions";

  let collapseBtn: HTMLButtonElement | null = null;
  if (isCollapsible) {
    collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "code-block-collapse-btn";
    collapseBtn.textContent = "折叠";
    collapseBtn.setAttribute("aria-label", "折叠代码");
    actions.appendChild(collapseBtn);
  }

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "code-block-copy";
  copyBtn.setAttribute("aria-label", "复制代码");
  copyBtn.innerHTML = `
    <svg class="copy-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
    </svg>
    <svg class="check-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
    </svg>
    <span class="copy-text">复制</span>
  `;
  actions.appendChild(copyBtn);

  header.appendChild(langLabel);
  header.appendChild(actions);

  const body = document.createElement("div");
  body.className = "code-block-body";

  const codeArea = document.createElement("div");
  codeArea.className = "code-block-code-area";

  codeEl.innerHTML = buildCodeLinesHtml(highlighter, rawLines, lang);
  codeEl.classList.add("hljs");
  if (lang && lang !== "plaintext") codeEl.classList.add(`language-${lang}`);
  pre.replaceWith(codeArea); // 用 codeArea 替换旧 pre

  body.appendChild(codeArea);
  container.appendChild(header);
  container.appendChild(body);

  if (isCollapsible) {
    const expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "code-block-expand";
    expandBtn.textContent = `展开全部 ${lineCount} 行`;
    expandBtn.setAttribute("aria-label", "展开代码");
    expandBtn.style.display = "inline-flex";
    container.appendChild(expandBtn);
    body.classList.add("collapsed");
    if (collapseBtn) collapseBtn.textContent = "展开";
  }

  // 阶段 3：插入到占位符位置
  if (placeholder.parentNode) {
    placeholder.parentNode.insertBefore(container, placeholder);
    placeholder.parentNode.removeChild(placeholder);
  } else if (originalParent) {
    originalParent.appendChild(container);
  }
}

/* ============================================================
   入口
   ============================================================ */

export function initCodeBlocks(highlighter?: Highlighter): () => void {
  const hl: Highlighter | null = highlighter ?? null;

  // 1. 同步升级裸 pre（编辑器 HTML 透传的内容）
  const targets = document.querySelectorAll(
    ".prose-editorial pre > code[data-language], .prose-editorial pre > code[class*='language-']",
  );
  targets.forEach((codeEl) => {
    const pre = codeEl.parentElement as HTMLPreElement | null;
    if (!pre || pre.closest(".code-block-container")) return; // 幂等
    upgrade(pre, hl);
  });

  // 2. 若高亮器可用，补高亮已存在但未高亮的代码块
  if (hl) {
    document
      .querySelectorAll(".code-block-container .code-block-code-area code")
      .forEach((codeEl) => {
        const c = codeEl as HTMLElement;
        if (c.querySelector(".hljs-keyword, .hljs-string, .hljs-comment, .hljs-title")) return;

        const lang = detectLanguage(c);
        const rawLines = extractRawLines(c);

        c.innerHTML = buildCodeLinesHtml(hl, rawLines, lang);
      });
  }

  // 3. 事件委托：复制 + 折叠/展开
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const copyBtn = target.closest(".code-block-copy") as HTMLElement | null;
    if (copyBtn) {
      const container = copyBtn.closest(".code-block-container");
      // 从 .code-line 收集代码文本，每行用 \n 连接
      const lines: string[] = [];
      container?.querySelectorAll(".code-line").forEach((el) => {
        lines.push((el as HTMLElement).textContent ?? "");
      });
      const text = normalizeNewlines(lines.join("\n"));
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add("copied");
        const label = copyBtn.querySelector(".copy-text");
        if (label) label.textContent = "已复制";
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          if (label) label.textContent = "复制";
        }, 2000);
      });
      return;
    }

    const toggle =
      (target.closest(".code-block-collapse-btn") as HTMLElement | null) ||
      (target.closest(".code-block-expand") as HTMLElement | null);
    if (toggle) {
      const container = toggle.closest(".code-block-container");
      const body = container?.querySelector(".code-block-body");
      const collapseBtn = container?.querySelector(".code-block-collapse-btn") as HTMLElement | null;
      const expandBtn = container?.querySelector(".code-block-expand") as HTMLElement | null;
      if (!body) return;
      const willCollapse = !body.classList.contains("collapsed");
      body.classList.toggle("collapsed", willCollapse);
      if (expandBtn) expandBtn.style.display = willCollapse ? "inline-flex" : "none";
      if (collapseBtn) collapseBtn.textContent = willCollapse ? "展开" : "折叠";
    }
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
