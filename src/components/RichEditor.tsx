import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Code2,
  Link,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Plus,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getApiBase(): string {
  if (import.meta.env.DEV) return "";
  return "https://api.202616.xyz";
}

const API_BASE = /* @__NOINLINE */ getApiBase();

function parseMarkdown(text: string): string {
  if (!text) return "<p></p>";

  const lines = text.split("\n");
  const html: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(" ");
      let processed = paragraphText
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/~~(.*?)~~/g, "<del>$1</del>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      html.push(`<p>${processed}</p>`);
      currentParagraph = [];
    }
  };

  let inCodeBlock = false;
  let codeLang = "";
  let codeContent: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (listType && listItems.length > 0) {
      html.push(`<${listType}>${listItems.map(li => `<li>${li}</li>`).join("")}</${listType}>`);
      listType = null;
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const language = codeLang || "plaintext";
        const escapedContent = codeContent.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html.push(`<pre><code data-language="${language}">${escapedContent}</code></pre>`);
        inCodeBlock = false;
        codeLang = "";
        codeContent = [];
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
        codeLang = line.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      html.push(`<h1>${line.substring(2)}</h1>`);
    } else if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      html.push(`<h2>${line.substring(3)}</h2>`);
    } else if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      html.push(`<h3>${line.substring(4)}</h3>`);
    } else if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${line.substring(2)}</blockquote>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(line.substring(2));
    } else if (/^\d+\. /.test(line)) {
      flushParagraph();
      const match = line.match(/^\d+\. (.*)$/);
      if (match) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        listItems.push(match[1]);
      }
    } else if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else {
      currentParagraph.push(line);
    }
  }

  flushParagraph();
  flushList();

  return html.join("");
}

export function getRawCodeText(codeEl: Element): string {
  let result = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      result += "<" + el.tagName.toLowerCase();
      Array.from(el.attributes).forEach((attr) => {
        result += ` ${attr.name}="${attr.value}"`;
      });
      const childText = el.textContent || "";
      const hasChildren = el.children.length > 0 || (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE && childText.trim() !== "");
      if (node.childNodes.length === 0 || (!hasChildren && childText === "")) {
        result += " /";
      } else {
        result += ">";
        Array.from(node.childNodes).forEach(walk);
        result += "</" + el.tagName.toLowerCase() + ">";
      }
    }
  };
  Array.from(codeEl.childNodes).forEach(walk);
  return result;
}

function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  tempDiv.querySelectorAll(".code-lang-selector").forEach((s) => s.remove());
  tempDiv.querySelectorAll(".code-block-wrapper").forEach((wrapper) => {
    const pre = wrapper.querySelector("pre");
    if (pre) {
      wrapper.parentNode?.insertBefore(pre, wrapper);
    }
    wrapper.remove();
  });

  const codeBlocks: { lang: string; code: string }[] = [];
  tempDiv.querySelectorAll("pre > code").forEach((codeEl) => {
    const lang = codeEl.getAttribute("data-language") || "";
    const code = getRawCodeText(codeEl);
    codeBlocks.push({ lang, code });
    const placeholder = document.createComment(`CODEBLOCK_${codeBlocks.length - 1}`);
    codeEl.replaceWith(placeholder);
  });

  let md = tempDiv.innerHTML;

  md = md.replace(/<!--CODEBLOCK_(\d+)-->/g, (_, idx) => {
    const { lang, code } = codeBlocks[parseInt(idx, 10)];
    return "```" + lang + "\n" + code.trim() + "\n```";
  });

  md = md.replace(/<code[^>]*>(.*?)<\/code>/g, "`$1`");

  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/g, "# $1");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/g, "## $1");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/g, "### $1");

  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/g, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/g, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/g, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/g, "*$1*");
  md = md.replace(/<del[^>]*>(.*?)<\/del>/g, "~~$1~~");
  md = md.replace(/<s[^>]*>(.*?)<\/s>/g, "~~$1~~");
  md = md.replace(/<strike[^>]*>(.*?)<\/strike>/g, "~~$1~~");

  md = md.replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, "[$2]($1)");

  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, "> $1");

  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/g, "- $1");
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (match, content) => {
    let i = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/g, () => `${i++}. ` + "$1");
  });

  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, "$1\n");

  md = md.replace(/<br\s*\/?>/g, "\n");
  md = md.replace(/<br>/g, "\n");

  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");

  md = md.replace(/^\n+/g, "");
  md = md.replace(/\n+$/g, "");

  return md;
}

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: "rich" | "markdown";
  onModeChange?: (mode: "rich" | "markdown") => void;
}

type ToolbarButton = {
  icon: React.ComponentType<{ className?: string }>;
  command: string;
  value?: string;
  title: string;
};

const basicButtons: ToolbarButton[] = [
  { icon: Bold, command: "bold", title: "加粗" },
  { icon: Italic, command: "italic", title: "斜体" },
  { icon: Strikethrough, command: "strikeThrough", title: "删除线" },
  { icon: Code2, command: "inlineCode", title: "行内代码" },
  { icon: Code, command: "formatBlock", value: "pre", title: "代码块" },
  { icon: Link, command: "createLink", title: "插入链接" },
  { icon: Heading2, command: "formatBlock", value: "h2", title: "标题" },
  { icon: Quote, command: "formatBlock", value: "blockquote", title: "引用" },
  { icon: List, command: "insertUnorderedList", title: "无序列表" },
  { icon: ListOrdered, command: "insertOrderedList", title: "有序列表" },
];

const codeLanguages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain Text" },
];

export default function RichEditor({
  value,
  onChange,
  placeholder = "",
  mode: externalMode,
  onModeChange,
}: RichEditorProps) {
  const [mode, setMode] = useState<"rich" | "markdown">(externalMode || "rich");
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const historyRef = useRef<{ stack: string[]; index: number }>({ stack: [""], index: 0 });
  const isHistoryActionRef = useRef(false);
  const switchTimestampRef = useRef(0);

  const pushHistory = useCallback((text: string) => {
    if (isHistoryActionRef.current) return;
    const history = historyRef.current;
    if (history.stack[history.index] === text) return;
    history.stack = history.stack.slice(0, history.index + 1);
    history.stack.push(text);
    if (history.stack.length > 100) history.stack.shift();
    history.index = history.stack.length - 1;
  }, []);

  const historyUndo = useCallback((): string | null => {
    const history = historyRef.current;
    if (history.index > 0) {
      history.index--;
      isHistoryActionRef.current = true;
      const result = history.stack[history.index];
      setTimeout(() => { isHistoryActionRef.current = false; }, 0);
      return result;
    }
    return null;
  }, []);

  const historyRedo = useCallback((): string | null => {
    const history = historyRef.current;
    if (history.index < history.stack.length - 1) {
      history.index++;
      isHistoryActionRef.current = true;
      const result = history.stack[history.index];
      setTimeout(() => { isHistoryActionRef.current = false; }, 0);
      return result;
    }
    return null;
  }, []);

  const updateActiveFormats = useCallback(() => {
    if (mode !== "rich") return;
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("strikeThrough")) formats.add("strikeThrough");
    if (document.queryCommandState("insertUnorderedList")) formats.add("insertUnorderedList");
    if (document.queryCommandState("insertOrderedList")) formats.add("insertOrderedList");

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);
      if (element) {
        if (element.closest("code") && !element.closest("pre")) formats.add("inlineCode");
        if (element.closest("h1") || element.closest("h2") || element.closest("h3")) formats.add("h2");
        if (element.closest("blockquote")) formats.add("blockquote");
        if (element.closest("pre")) formats.add("pre");
      }
    }
    setActiveFormats(formats);
  }, [mode]);

  useEffect(() => {
    if (externalMode) {
      setMode(externalMode);
    }
  }, [externalMode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showCodeDropdown && !target.closest('[title="代码块"]')) {
        setShowCodeDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showCodeDropdown]);

  useEffect(() => {
    if (mode !== "rich" || !editorRef.current) return;

    // 刚切换模式时由 requestAnimationFrame 处理，跳过
    if (Date.now() - switchTimestampRef.current < 100) return;

    const expected = value || "<p></p>";
    // 对比 cleaned HTML（去掉选择器后的），而非原始 innerHTML
    // 这样选择器存在不会导致不必要的 DOM 覆盖
    const currentClean = getCleanHTML(editorRef.current);
    if (currentClean !== expected) {
      editorRef.current.innerHTML = expected;
      // 覆盖后重新添加语言选择器
      editorRef.current.querySelectorAll("pre").forEach((pre) => {
        addCodeLanguageSelector(pre as HTMLElement);
      });
    }
  }, [value, mode]);

  const handleModeToggle = (newMode: "rich" | "markdown") => {
    if (newMode === mode) return;
    let newValue = value;
    if (newMode === "rich") {
      newValue = parseMarkdown(value);
    } else {
      if (editorRef.current) {
        newValue = htmlToMarkdown(editorRef.current.innerHTML);
      } else {
        newValue = htmlToMarkdown(value);
      }
    }
    switchTimestampRef.current = Date.now();
    onChange(newValue);
    setMode(newMode);
    onModeChange?.(newMode);

    if (newMode === "rich") {
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = newValue || "<p></p>";
          editorRef.current.querySelectorAll("pre").forEach((pre) => {
            addCodeLanguageSelector(pre as HTMLElement);
          });
        }
      });
    }
  };

  const execCommand = useCallback((command: string, value?: string) => {
    if (mode !== "rich") return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (command === "createLink") {
      const selection = window.getSelection();
      const hasLink = selection && selection.rangeCount > 0 &&
        (selection.anchorNode as HTMLElement)?.parentElement?.closest("a");
      if (hasLink) {
        document.execCommand("unlink");
      } else {
        const url = prompt("请输入链接地址：", "https://");
        if (url) {
          document.execCommand(command, false, url);
        }
      }
    } else if (command === "inlineCode") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as HTMLElement);

        const codeEl = element?.closest("code");
        if (codeEl && !codeEl.closest("pre")) {
          const parent = codeEl.parentNode;
          while (codeEl.firstChild) {
            parent?.insertBefore(codeEl.firstChild, codeEl);
          }
          parent?.removeChild(codeEl);
        } else {
          const selectedText = range.toString();
          const code = document.createElement("code");
          code.textContent = selectedText || "code";
          range.deleteContents();
          range.insertNode(code);
        }
      }
    } else if (command === "formatBlock" && value === "pre") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as HTMLElement);

        let preEl = element?.closest("pre");
        if (!preEl) {
          const startNode = range.startContainer;
          const endNode = range.endContainer;
          const startEl = startNode.nodeType === Node.TEXT_NODE ? startNode.parentElement : (startNode as HTMLElement);
          const endEl = endNode.nodeType === Node.TEXT_NODE ? endNode.parentElement : (endNode as HTMLElement);
          preEl = startEl?.closest("pre") || endEl?.closest("pre");
        }

        if (preEl) {
          const codeEl = preEl.querySelector("code");
          const text = codeEl?.textContent || "";
          const wrapper = preEl.parentElement;
          const p = document.createElement("p");
          p.textContent = text || " ";
          if (wrapper && wrapper.classList.contains("code-block-wrapper")) {
            wrapper.parentNode?.replaceChild(p, wrapper);
          } else {
            preEl.parentNode?.replaceChild(p, preEl);
          }
          const newRange = document.createRange();
          newRange.selectNodeContents(p);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          const selectedText = range.toString();
          const pre = document.createElement("pre");
          const code = document.createElement("code");
          code.textContent = selectedText || "// 在此输入代码";
          pre.appendChild(code);
          range.deleteContents();
          range.insertNode(pre);
          range.collapse(false);
          const emptyP = document.createElement("p");
          emptyP.innerHTML = "<br>";
          range.insertNode(emptyP);
          const newRange = document.createRange();
          newRange.selectNodeContents(code);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          setTimeout(() => {
            addCodeLanguageSelector(pre);
          }, 0);
        }

        const cleanHtml = getCleanHTML(editorRef.current);
        onChange(cleanHtml);
        updateActiveFormats();
      }
    } else if (command === "formatBlock" && value) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as HTMLElement);

        let currentBlock = element;
        while (currentBlock && currentBlock !== editorRef.current) {
          if (/^H[1-6]|^P$|^BLOCKQUOTE$/.test(currentBlock.tagName)) break;
          currentBlock = currentBlock.parentElement;
        }

        if (currentBlock && currentBlock.tagName.toLowerCase() === value.toLowerCase()) {
          document.execCommand("formatBlock", false, "p");
        } else {
          document.execCommand(command, false, value);
        }
      }
    } else {
      document.execCommand(command, false, value);
    }

    if (editorRef.current) {
      const cleanHtml = getCleanHTML(editorRef.current);
      onChange(cleanHtml);
      setTimeout(updateActiveFormats, 0);
    }
  }, [mode, onChange, updateActiveFormats]);

  const doUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/upload/image`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.url) {
        if (mode === "rich") {
          document.execCommand("insertImage", false, result.url);
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        } else {
          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = value.substring(0, start);
            const after = value.substring(end);
            const imgMarkdown = `![](${result.url})\n`;
            const newText = before + imgMarkdown + after;
            onChange(newText);
            setTimeout(() => {
              textarea.focus();
              const newPos = start + imgMarkdown.length;
              textarea.selectionStart = newPos;
              textarea.selectionEnd = newPos;
            }, 0);
          } else {
            const imgMarkdown = `![](${result.url})\n`;
            onChange(value + imgMarkdown);
          }
        }
      } else {
        alert(result.message || "上传失败");
      }
    } catch {
      alert("上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await doUploadImage(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await doUploadImage(file);
        }
        return;
      }
    }

    // 粘贴到代码块内时：用 insertText 插入纯文本，保留换行符
    if (mode === "rich") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as HTMLElement);
        if (element?.closest("pre")) {
          e.preventDefault();
          const text = e.clipboardData?.getData("text/plain") ?? "";
          document.execCommand("insertText", false, text);
          if (editorRef.current) {
            onChange(getCleanHTML(editorRef.current));
          }
          return;
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        await doUploadImage(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getCleanHTML = (container: HTMLElement): string => {
    const clone = container.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".code-lang-selector").forEach((s) => s.remove());
    return clone.innerHTML;
  };

  const addCodeLanguageSelector = (pre: HTMLElement) => {
    if (pre.querySelector(".code-lang-selector")) return;

    const selector = document.createElement("select");
    selector.className = "code-lang-selector";
    selector.contentEditable = "false";
    selector.style.cssText = `
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 11px;
      padding: 2px 18px 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--blog-border);
      background: var(--blog-card);
      color: var(--blog-muted-foreground);
      cursor: pointer;
      outline: none;
      z-index: 2;
      appearance: auto;
    `;

    const currentLang = pre.querySelector("code")?.getAttribute("data-language") || "";

    const langOptions = [
      { value: "", label: "选择语言" },
      ...codeLanguages,
    ];

    langOptions.forEach((lang) => {
      const option = document.createElement("option");
      option.value = lang.value;
      option.textContent = lang.label;
      if (lang.value === currentLang) option.selected = true;
      selector.appendChild(option);
    });

    selector.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const lang = target.value;
      const code = pre.querySelector("code");
      if (!code) return;

      code.setAttribute("data-language", lang);
      if (editorRef.current) {
        const cleanHtml = getCleanHTML(editorRef.current);
        onChange(cleanHtml);
      }
    });

    pre.style.position = "relative";
    pre.appendChild(selector);
  };

  const sanitizeCodeBlocks = () => {
    if (!editorRef.current) return;
    const preCodes = editorRef.current.querySelectorAll("pre > code");
    preCodes.forEach((codeEl) => {
      const hasElements = codeEl.querySelectorAll("*").length > 0;
      if (hasElements) {
        const lang = codeEl.getAttribute("data-language") || "";
        const rawText = getRawCodeText(codeEl);
        codeEl.textContent = rawText;
        if (lang) codeEl.setAttribute("data-language", lang);
      }
    });
  };

  const handleRichInput = () => {
    if (editorRef.current) {
      sanitizeCodeBlocks();
      const cleanHtml = getCleanHTML(editorRef.current);
      onChange(cleanHtml);
      updateActiveFormats();
    }
  };

  const handleRichKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      document.execCommand("undo");
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
      e.preventDefault();
      document.execCommand("redo");
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      return;
    }

    if (e.key !== "Enter") return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);

    if (!element) return;

    const preElement = element.closest("pre");
    const codeElement = element.closest("code");

    if (!preElement && !codeElement) return;

    e.preventDefault();

    const targetPre = preElement || codeElement?.closest("pre");
    if (!targetPre || !editorRef.current) return;

    // 在代码块内按 Enter：插入换行符 \n，不跳出代码块
    // Shift+Enter 也插入换行
    document.execCommand("insertText", false, "\n");
    if (editorRef.current) {
      onChange(getCleanHTML(editorRef.current));
    }
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    pushHistory(newValue);
    onChange(newValue);
  };

  const handleMarkdownKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      const prev = historyUndo();
      if (prev !== null) {
        onChange(prev);
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.value = prev;
        }
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
      e.preventDefault();
      const next = historyRedo();
      if (next !== null) {
        onChange(next);
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.value = next;
        }
      }
      return;
    }
  };

  const insertMarkdownFormat = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = before + prefix + selectedText + suffix + after;
    pushHistory(newText);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
    }, 0);
  };

  const insertCodeBlock = (language: string) => {
    if (mode === "markdown") {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const before = value.substring(0, start);
      const after = value.substring(end);

      const codeBlock = `\n\`\`\`${language}\n${selectedText || "// 在此输入代码"}
\`\`\`\n`;
      const newText = before + codeBlock + after;
      pushHistory(newText);
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const codeStart = start + 4 + language.length;
        textarea.selectionStart = codeStart;
        textarea.selectionEnd = codeStart + (selectedText.length || 14);
      }, 0);
    } else {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        editorRef.current.focus();
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.setAttribute("data-language", language);
        code.textContent = selectedText || `// ${language} 代码\n// 在此输入代码`;
        pre.appendChild(code);
        range.deleteContents();
        range.insertNode(pre);
        range.collapse(false);
        const emptyP = document.createElement("p");
        emptyP.innerHTML = "&nbsp;";
        range.insertNode(emptyP);
        onChange(editorRef.current.innerHTML);
        setTimeout(() => {
          const newRange = document.createRange();
          newRange.selectNodeContents(code);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }, 0);
      }
    }
  };

  const toolbarClick = (btn: ToolbarButton) => {
    if (mode === "rich") {
      execCommand(btn.command, btn.value);
    } else {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
      }
      switch (btn.command) {
        case "bold":
          insertMarkdownFormat("**", "**");
          break;
        case "italic":
          insertMarkdownFormat("*", "*");
          break;
        case "strikeThrough":
          insertMarkdownFormat("~~", "~~");
          break;
        case "inlineCode":
          insertMarkdownFormat("`", "`");
          break;
        case "formatBlock":
          if (btn.value === "pre") {
            setShowCodeDropdown(true);
          } else if (btn.value === "h2") {
            insertMarkdownFormat("\n## ");
          } else if (btn.value === "blockquote") {
            insertMarkdownFormat("\n> ");
          }
          break;
        case "createLink":
          insertMarkdownFormat("[", "](url)");
          break;
        case "insertUnorderedList":
          insertMarkdownFormat("\n- ");
          break;
        case "insertOrderedList":
          insertMarkdownFormat("\n1. ");
          break;
      }
    }
  };

  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--blog-border)" }}>
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: "var(--blog-card)", borderBottom: "1px solid var(--blog-border)" }}
      >
        <div className="flex items-center gap-1 relative">
          {basicButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = activeFormats.has(btn.command) || (btn.value ? activeFormats.has(btn.value) : false);
            if (btn.command === "formatBlock" && btn.value === "pre") {
              return (
                <div key={btn.title} className="relative">
                  <button
                    type="button"
                    onClick={() => toolbarClick(btn)}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      isActive ? "bg-primary/15 text-primary" : "hover:bg-primary/10 hover:text-primary"
                    )}
                    style={isActive ? {} : { color: "var(--blog-foreground)" }}
                    title={btn.title}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                  {showCodeDropdown && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50 min-w-[150px]"
                      style={{ borderColor: "var(--blog-border)" }}
                    >
                      {codeLanguages.map((lang) => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => insertCodeBlock(lang.value)}
                          className="w-full px-3 py-1.5 text-sm text-left hover:bg-primary/10 hover:text-primary"
                          style={{ color: "var(--blog-foreground)" }}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={btn.title}
                type="button"
                onClick={() => toolbarClick(btn)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  isActive ? "bg-primary/15 text-primary" : "hover:bg-primary/10 hover:text-primary"
                )}
                style={isActive ? {} : { color: "var(--blog-foreground)" }}
                title={btn.title}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
          <div className="w-px h-5 mx-1" style={{ background: "var(--blog-border)" }} />
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploading}
            className="p-2 rounded-md transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            style={{ color: "var(--blog-foreground)" }}
            title="插入图片"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: mode === "rich" ? "var(--blog-foreground)" : "var(--blog-muted)" }}
          >
            Rich Text
          </span>
          <button
            type="button"
            onClick={() => handleModeToggle(mode === "rich" ? "markdown" : "rich")}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: mode === "markdown" ? "var(--blog-primary)" : "var(--blog-border)" }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ left: mode === "markdown" ? "22px" : "2px" }}
            />
          </button>
          <span
            className="text-sm font-semibold"
            style={{ color: mode === "markdown" ? "var(--blog-foreground)" : "var(--blog-muted)" }}
          >
            Markdown
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {mode === "rich" ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleRichInput}
          onKeyDown={handleRichKeyDown}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="prose-editorial min-h-[400px] p-4 focus:outline-none text-sm"
          style={{ background: "var(--blog-background)", color: "var(--blog-foreground)" }}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleMarkdownChange}
          onKeyDown={handleMarkdownKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          placeholder={placeholder}
          className="w-full min-h-[400px] p-4 text-sm font-mono focus:outline-none resize-none"
          style={{
            background: "var(--blog-background)",
            color: "var(--blog-foreground)",
            lineHeight: "1.6",
          }}
        />
      )}

      {uploading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.1)" }}
        >
          <span className="text-sm" style={{ color: "var(--blog-foreground)" }}>
            上传中...
          </span>
        </div>
      )}
    </div>
  );
}
