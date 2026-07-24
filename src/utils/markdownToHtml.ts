/**
 * markdownToHtml.ts
 * 轻量 Markdown → HTML 转换器（零运行时依赖）。
 *
 * 支持语法：
 *   # / ## / ### 标题，> 引用（连续行自动合并），
 *   - / * 无序列表，1. 有序列表（连续项自动合并），
 *   --- 分隔线，``` 围栏代码块（输出 GitHub 风格结构），
 *   行内：`code` **粗体** *斜体* ~~删除线~~ [链接](url) ![图片](url)
 *
 * 所有文本默认经 HTML 转义，防止 XSS 注入。
 */

export interface MarkdownOptions {
  /**
   * 可选语法高亮器（如 highlight.js）。
   * 接收原始代码与语言名，返回仅含 <span> 标签的 HTML；
   * 语言不支持时返回 null / undefined，将回退为纯文本转义。
   */
  highlighter?: (code: string, language: string) => string | null | undefined;
  /** 代码行数超过该值时折叠；默认 20，传 Infinity 可禁用折叠 */
  collapseAfter?: number;
}

const DEFAULT_COLLAPSE_AFTER = 20;

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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

/**
 * 行内格式管道：
 * 1. 先提取 `行内代码`（转义后保护起来，不参与后续格式化）
 * 2. 转义剩余文本
 * 3. 应用 粗体 / 斜体 / 删除线 / 图片 / 链接
 * 4. 回填代码片段
 */
function inlineFormat(text: string): string {
  const codeSpans: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_m, code: string) => {
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return `\x00${codeSpans.length - 1}\x00`;
  });

  out = escapeHtml(out);

  out = out
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // 图片必须在链接之前匹配，否则 ![alt](url) 会被链接规则吞掉
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  return out.replace(/\x00(\d+)\x00/g, (_m, i: string) => codeSpans[Number(i)]);
}

/**
 * 将高亮后的 HTML 按行拆分：行尾自动闭合未关闭的 <span>，
 * 下一行行首重新打开，保证多行注释 / 字符串跨行时标签不断裂。
 */
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
      if (tag.startsWith("</")) {
        openTags.pop();
      } else if (!tag.endsWith("/>")) {
        openTags.push(tag);
      }
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

/* ============================================================
   代码自动格式化（仅对单行长代码生效）
   支持：css, scss, less, json, sql
   ============================================================ */

const FORMAT_LANGUAGES = new Set([
  "css", "scss", "less", "style",
  "json",
  "sql",
]);

function shouldFormat(lang: string): boolean {
  return FORMAT_LANGUAGES.has(lang.toLowerCase());
}

function hasRealNewlines(code: string): boolean {
  const trimmed = code.trim();
  const newlineCount = (trimmed.match(/\n/g) || []).length;
  return newlineCount > 2;
}

function formatCode(code: string, language: string): string {
  const lang = language.toLowerCase();

  if (lang === "json") {
    return formatJson(code);
  }
  if (lang === "sql") {
    return formatSql(code);
  }
  if (lang === "css" || lang === "scss" || lang === "less" || lang === "style") {
    return formatCssLike(code);
  }
  return code;
}

function formatJson(code: string): string {
  try {
    const obj = JSON.parse(code);
    return JSON.stringify(obj, null, 2);
  } catch {
    return code;
  }
}

function formatCssLike(code: string): string {
  let result = "";
  let indent = 0;
  let inComment = false;
  let inString = false;
  let stringChar = "";
  let i = 0;

  const ind = (n: number) => "  ".repeat(n);

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1] || "";

    if (inComment) {
      result += ch;
      if (ch === "*" && next === "/") {
        inComment = false;
        result += next;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (inString) {
      result += ch;
      if (ch === stringChar && code[i - 1] !== "\\") {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      inComment = true;
      result += ch + next;
      i += 2;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      result += ch;
      i++;
      continue;
    }

    if (ch === "{") {
      result += " {\n" + ind(indent + 1);
      indent++;
      i++;
      continue;
    }

    if (ch === "}") {
      indent = Math.max(0, indent - 1);
      if (result.endsWith("\n" + ind(indent + 1))) {
        result = result.slice(0, -(indent + 1) * 2 - 1);
      }
      result += "\n" + ind(indent) + "}";
      if (next && next !== "}") {
        result += "\n" + ind(indent);
      }
      i++;
      continue;
    }

    if (ch === ";") {
      result += ";\n" + ind(indent);
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result.replace(/\n\s*\n\s*\n/g, "\n\n").trim();
}

function formatSql(code: string): string {
  const keywords = [
    "SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY", "GROUP BY",
    "HAVING", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN",
    "OUTER JOIN", "ON", "INSERT INTO", "VALUES", "UPDATE", "SET",
    "DELETE FROM", "CREATE TABLE", "DROP TABLE", "ALTER TABLE",
    "LIMIT", "OFFSET", "UNION", "UNION ALL",
  ];

  let result = code;

  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw.replace(" ", "\\s+")}\\b`, "gi");
    result = result.replace(regex, "\n" + kw + " ");
  });

  result = result.replace(/,\s*/g, ",\n  ");
  result = result.replace(/\n\s*\n/g, "\n");

  return result.trim();
}

/** 渲染 GitHub 风格代码块：头部（语言 + 复制）/ 行号列 / 代码区 / 可选折叠 */
function renderCodeBlock(
  rawCode: string,
  language: string,
  options: MarkdownOptions,
): string {
  const collapseAfter = options.collapseAfter ?? DEFAULT_COLLAPSE_AFTER;

  let normalizedCode = normalizeNewlines(rawCode);

  if (shouldFormat(language) && !hasRealNewlines(normalizedCode)) {
    normalizedCode = formatCode(normalizedCode, language);
  }

  const highlighted = options.highlighter?.(normalizedCode, language);
  const lines = highlighted
    ? splitHighlightedByLine(highlighted)
    : normalizedCode.split("\n").map(escapeHtml);

  // ★ 逐行布局：每行一个 .code-row，行号 + 代码行绑定，折行时自然对齐
  const codeRows = lines
    .map(
      (line, idx) =>
        `<div class="code-row"><span class="code-block-line-number">${idx + 1}</span><span class="code-line">${line === "" ? " " : line}</span></div>`,
    )
    .join("");

  const isCollapsed = lines.length > collapseAfter;

  return [
    `<div class="code-block-container">`,
    `<div class="code-block-header">`,
    `<span class="code-block-lang">${escapeHtml(language.toLowerCase())}</span>`,
    `<button type="button" class="code-block-copy" aria-label="复制代码">` +
      `<svg class="copy-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path fill="currentColor" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>` +
      `<svg class="check-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0L3.22 8.28a.75.75 0 0 1 1.06-1.06L6 8.94l5.72-5.72a.75.75 0 0 1 1.06 0Z"/></svg>` +
      `<span class="copy-text">复制</span>` +
      `</button>`,
    `</div>`,
    `<div class="code-block-body${isCollapsed ? " collapsed" : ""}">`,
    `<div class="code-block-code-area"><code class="language-${escapeHtml(language)} hljs">${codeRows}</code></div>`,
    `</div>`,
    isCollapsed
      ? `<button type="button" class="code-block-expand" aria-label="展开代码块">` +
          `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/></svg>` +
          `<span>展开</span>` +
          `</button>`
      : "",
    `</div>`,
  ].join("");
}

function upgradeHtmlCodeBlocks(html: string, options: MarkdownOptions): string {
  const preCodeRegex = /<pre\b[^>]*>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi;

  return html.replace(preCodeRegex, (_match, codeAttrs: string, codeContent: string) => {
    let language = "plaintext";

    const langMatch = codeAttrs.match(/data-language="([^"]*)"/i);
    if (langMatch) {
      language = langMatch[1].trim().toLowerCase() || "plaintext";
    } else {
      const classMatch = codeAttrs.match(/class="[^"]*\blanguage-([\w+-]+)/i);
      if (classMatch) {
        language = classMatch[1].toLowerCase();
      }
    }

    let lines: string[] = [];

    if (/<div\b/i.test(codeContent)) {
      const divMatches = codeContent.match(/<div\b[^>]*>([\s\S]*?)<\/div>/gi);
      if (divMatches && divMatches.length > 0) {
        lines = divMatches.map((div) => {
          const inner = div.replace(/<div\b[^>]*>/i, "").replace(/<\/div>/i, "");
          return decodeHtmlContent(inner);
        });
      }
    }

    if (lines.length === 0) {
      const normalized = codeContent
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
      lines = normalized.split("\n").map(decodeHtmlContent);
    }

    const decoded = lines.join("\n");

    return renderCodeBlock(decoded, language, options);
  });
}

function decodeHtmlContent(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "");
}

export function markdownToHtml(
  text: string,
  options: MarkdownOptions = {},
): string {
  if (!text) return "<p></p>";
  const trimmed = text.trim();

  if (trimmed.startsWith("<")) {
    return upgradeHtmlCodeBlocks(text, options);
  }

  const lines = text.split("\n");
  const html: string[] = [];
  let currentParagraph: string[] = [];

  // 列表状态：连续同类型条目合并为一个列表
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  // 引用状态：连续 > 行合并为一个 blockquote
  let quoteLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      html.push(`<p>${inlineFormat(currentParagraph.join(" "))}</p>`);
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listType && listItems.length > 0) {
      html.push(
        `<${listType}>${listItems.map((li) => `<li>${li}</li>`).join("")}</${listType}>`,
      );
    }
    listType = null;
    listItems = [];
  };

  const flushQuote = () => {
    if (quoteLines.length > 0) {
      html.push(`<blockquote>${quoteLines.join(" ")}</blockquote>`);
      quoteLines = [];
    }
  };

  /** 代码块之外的块级状态统一冲刷 */
  const flushBlocks = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  let inCodeBlock = false;
  let codeLang = "";
  let codeContent: string[] = [];

  for (const line of lines) {
    // ── 代码围栏：优先级最高，内部内容原样保留 ──
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push(renderCodeBlock(codeContent.join("\n"), codeLang || "plaintext", options));
        inCodeBlock = false;
        codeLang = "";
        codeContent = [];
      } else {
        flushBlocks();
        inCodeBlock = true;
        codeLang = line.substring(3).trim();
      }
      continue;
    }
    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // ── 标题 ──
    const heading = line.match(/^(#{1,3}) (.+)$/);
    if (heading) {
      flushBlocks();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      continue;
    }

    // ── 引用（连续行合并，软换行以空格拼接） ──
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quoteLines.push(inlineFormat(line.substring(2)));
      continue;
    }
    if (quoteLines.length > 0) flushQuote();

    // ── 无序列表（连续项合并） ──
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(inlineFormat(line.substring(2)));
      continue;
    }

    // ── 有序列表（连续项合并） ──
    const ordered = line.match(/^\d+\. (.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(inlineFormat(ordered[1]));
      continue;
    }

    // 本行不再是列表项：遇到正文时闭合列表，保证输出顺序正确
    if (listType && line.trim() !== "") flushList();

    // ── 分隔线 ──
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushBlocks();
      html.push("<hr>");
      continue;
    }

    // ── 空行：段落分隔（不打断列表，符合松散列表语义） ──
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    // ── 正文：累积为段落 ──
    currentParagraph.push(line);
  }

  flushBlocks();

  // 兜底：文末代码块未闭合时仍渲染，避免内容丢失
  if (inCodeBlock && codeContent.length > 0) {
    html.push(renderCodeBlock(codeContent.join("\n"), codeLang || "plaintext", options));
  }

  return html.join("");
}
