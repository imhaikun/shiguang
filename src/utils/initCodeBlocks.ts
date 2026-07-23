/**
 * 代码块增强：把"编辑器透传的裸 <pre><code data-language>" 和
 * "markdown 渲染的 <pre><code class=language-x>" 两种来源，
 * 统一升级成 GitHub 风格容器（header + 行号 + 高亮 + 复制 + 折叠）。
 *
 * 结构由本函数在 DOM 层造（因为 marked 对原始 HTML 是透传，renderCodeBlock 钩子不触发）；
 * 交互用 document 事件委托，无论容器由谁造都能点。
 * 幂等：已包裹的 pre 跳过。
 * @returns 解绑函数，移除 document 委托监听。
 */

const COLLAPSE_LINE_THRESHOLD = 16;

/** 从 code 元素上读语言：优先 data-language，其次 class="language-x" / "hljs" 旁证。 */
function detectLanguage(codeEl: HTMLElement): string {
  const fromAttr = codeEl.getAttribute("data-language");
  if (fromAttr) return fromAttr.trim().toLowerCase();
  const langClass = Array.from(codeEl.classList).find((c) => c.startsWith("language-"));
  if (langClass) return langClass.slice("language-".length);
  return "plaintext";
}

/** 懒加载 hljs 单例 + 语言包，与 markdownToHtml 共用同一份模块（bundler 去重）。 */
let hljsPromise: Promise<any> | null = null;
function loadHljs() {
  if (hljsPromise) return hljsPromise;
  hljsPromise = (async () => {
    const hljs = (await import("highlight.js")).default;
    const langs: Record<string, () => Promise<any>> = {
      javascript: () => import("highlight.js/lib/languages/javascript"),
      typescript: () => import("highlight.js/lib/languages/typescript"),
      python: () => import("highlight.js/lib/languages/python"),
      bash: () => import("highlight.js/lib/languages/bash"),
      json: () => import("highlight.js/lib/languages/json"),
      sql: () => import("highlight.js/lib/languages/sql"),
      go: () => import("highlight.js/lib/languages/go"),
      rust: () => import("highlight.js/lib/languages/rust"),
      java: () => import("highlight.js/lib/languages/java"),
      css: () => import("highlight.js/lib/languages/css"),
      xml: () => import("highlight.js/lib/languages/xml"),
      markdown: () => import("highlight.js/lib/languages/markdown"),
      yaml: () => import("highlight.js/lib/languages/yaml"),
      dockerfile: () => import("highlight.js/lib/languages/dockerfile"),
    };
    await Promise.all(
      Object.entries(langs).map(async ([name, loader]) => {
        if (hljs.getLanguage(name)) return;
        try {
          const mod = await loader();
          hljs.registerLanguage(name, mod.default);
        } catch {
          /* 单个语言失败不影响整体 */
        }
      }),
    );
    return hljs;
  })();
  return hljsPromise;
}

/** 用 hljs 高亮纯文本，返回带 span 的 HTML；失败则回退转义纯文本。 */
function highlightText(hljs: any, text: string, lang: string): string {
  try {
    if (lang && lang !== "plaintext" && hljs.getLanguage(lang)) {
      return hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
    }
    const auto = hljs.highlightAuto(text);
    return auto.value;
  } catch {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

/** 把一个裸 pre 升级成完整容器。hljs 为 null 时先纯文本占位，后续重跑补高亮。 */
function upgrade(pre: HTMLPreElement, hljs: any | null): void {
  const codeEl = pre.querySelector("code") as HTMLElement | null;
  if (!codeEl) return;

  const lang = detectLanguage(codeEl);
  // textContent 已自动把 &gt; 解回 >，拿到的是干净源码
  const rawText = codeEl.textContent ?? "";
  const lines = rawText.replace(/\n$/, "").split("\n");
  const lineCount = lines.length;
  const isCollapsible = lineCount > COLLAPSE_LINE_THRESHOLD;

  // 高亮 HTML（无 hljs 时回退转义文本，保证结构先出来）
  const highlightedHtml = hljs
    ? highlightText(hljs, rawText, lang)
    : rawText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .split("\n")
        .map((l) => (l === "" ? " " : l))
        .join("\n");

  // 抹掉编辑器留下的内联 style / data-* 噪声，交给 CSS 接管
  pre.removeAttribute("style");

  // ── 容器 ──
  const container = document.createElement("div");
  container.className = "code-block-container";

  // ── header ──
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

  // ── body：行号 + 代码 ──
  const body = document.createElement("div");
  body.className = "code-block-body";

  const lineNumbers = document.createElement("div");
  lineNumbers.className = "code-block-line-numbers";
  lineNumbers.setAttribute("aria-hidden", "true");
  for (let i = 1; i <= lineCount; i++) {
    const n = document.createElement("span");
    n.className = "code-block-line-number";
    n.textContent = String(i);
    lineNumbers.appendChild(n);
  }

  // 把高亮 HTML 写回 code，并加 hljs 类供主题色生效
  codeEl.innerHTML = highlightedHtml;
  codeEl.classList.add("hljs");
  if (lang && lang !== "plaintext") codeEl.classList.add(`language-${lang}`);
  pre.classList.add("hljs-pre");

  body.appendChild(lineNumbers);
  body.appendChild(pre);

  container.appendChild(header);
  container.appendChild(body);

  // 折叠态展开按钮
  let expandBtn: HTMLButtonElement | null = null;
  if (isCollapsible) {
    expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "code-block-expand";
    expandBtn.textContent = `展开全部 ${lineCount} 行`;
    expandBtn.setAttribute("aria-label", "展开代码");
    container.appendChild(expandBtn);
    body.classList.add("collapsed");
    expandBtn.style.display = "inline-flex";
    if (collapseBtn) collapseBtn.textContent = "展开";
  }

  // 替换原 pre 位置（pre 已被 appendChild 移入 body）
  pre.parentNode?.insertBefore(container, pre);
}

export function initCodeBlocks(): () => void {
  // 选两种来源：编辑器的 data-language，和 markdown 的 language-x（且未被容器包裹）
  const targets = document.querySelectorAll(
    ".prose-editorial pre > code[data-language], .prose-editorial pre > code[class*='language-']",
  );

  // 同步先造结构（hljs 可能还没好，先纯文本占位，保证 header/行号/复制按钮立刻出现）
  targets.forEach((codeEl) => {
    const pre = codeEl.parentElement as HTMLPreElement | null;
    if (!pre || pre.closest(".code-block-container")) return; // 幂等
    upgrade(pre, null);
  });

  // 异步补高亮：hljs 就绪后，对刚造好的容器回填高亮 innerHTML
  loadHljs().then((hljs) => {
    document.querySelectorAll(".code-block-container pre > code").forEach((codeEl) => {
      const c = codeEl as HTMLElement;
      // 已经有 hljs 高亮 span 的就跳过，避免重复高亮
      if (c.querySelector(".hljs-keyword, .hljs-string, .hljs-comment")) return;
      const lang = detectLanguage(c);
      // 此时 c.textContent 仍是干净源码（占位阶段写的是转义文本，textContent 会解回）
      const raw = c.textContent ?? "";
      c.innerHTML = highlightText(hljs, raw, lang);
    });
  });

  // ── 事件委托：复制 + 折叠/展开，挂一次在 document 上 ──
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const copyBtn = target.closest(".code-block-copy") as HTMLElement | null;
    if (copyBtn) {
      const container = copyBtn.closest(".code-block-container");
      const codeEl = container?.querySelector("pre > code");
      const text = codeEl?.textContent ?? "";
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