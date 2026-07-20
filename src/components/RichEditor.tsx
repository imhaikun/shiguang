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
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const language = codeLang || "plaintext";
        html.push(`<pre><code data-language="${language}">${codeContent.join("\n")}</code></pre>`);
        inCodeBlock = false;
        codeLang = "";
        codeContent = [];
      } else {
        flushParagraph();
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
      html.push(`<h1>${line.substring(2)}</h1>`);
    } else if (line.startsWith("## ")) {
      flushParagraph();
      html.push(`<h2>${line.substring(3)}</h2>`);
    } else if (line.startsWith("### ")) {
      flushParagraph();
      html.push(`<h3>${line.substring(4)}</h3>`);
    } else if (line.startsWith("> ")) {
      flushParagraph();
      html.push(`<blockquote>${line.substring(2)}</blockquote>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      html.push(`<ul><li>${line.substring(2)}</li></ul>`);
    } else if (/^\d+\. /.test(line)) {
      flushParagraph();
      const match = line.match(/^\d+\. (.*)$/);
      if (match) {
        html.push(`<ol><li>${match[1]}</li></ol>`);
      }
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      currentParagraph.push(line);
    }
  }

  flushParagraph();

  return html.join("");
}

function htmlToMarkdown(html: string): string {
  let md = html;

  md = md.replace(/<pre><code data-language="([^"]*)">([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) => {
    return "```" + (lang || "") + "\n" + code.trim() + "\n```";
  });
  md = md.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
    return "```\n" + code.trim() + "\n```";
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
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  useEffect(() => {
    if (externalMode) {
      setMode(externalMode);
    }
  }, [externalMode]);

  useEffect(() => {
    if (mode === "rich" && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "<p></p>";
    }
  }, [value, mode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showCodeDropdown) {
        const isInsideEditor = target.closest('[contenteditable="true"]');
        const isCodeBlockButton = target.closest('[title="代码块"]');
        const isDropdownItem = target.closest('.code-language-dropdown');
        if (!isInsideEditor && !isCodeBlockButton && !isDropdownItem) {
          setShowCodeDropdown(false);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showCodeDropdown]);

  const handleModeToggle = (newMode: "rich" | "markdown") => {
    if (newMode === mode) return;
    let newValue = value;
    if (newMode === "rich") {
      newValue = parseMarkdown(value);
      if (editorRef.current) {
        editorRef.current.innerHTML = newValue || "<p></p>";
      }
    } else {
      if (editorRef.current) {
        newValue = htmlToMarkdown(editorRef.current.innerHTML);
      } else {
        newValue = htmlToMarkdown(value);
      }
    }
    onChange(newValue);
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const execCommand = useCallback((command: string, value?: string) => {
    if (mode !== "rich") return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (command === "createLink") {
      const url = prompt("请输入链接地址：", "https://");
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === "inlineCode") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        const code = document.createElement("code");
        code.textContent = selectedText || "code";
        range.deleteContents();
        range.insertNode(code);
      }
    } else if (command === "formatBlock" && value === "pre") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = selectedText || "// 在此输入代码";
        pre.appendChild(code);
        range.deleteContents();
        range.insertNode(pre);
      }
    } else if (command === "formatBlock" && value) {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false, value);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [mode, onChange]);

  const handleImageUpload = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          const imgMarkdown = `![](${result.url})`;
          onChange(value + "\n" + imgMarkdown + "\n");
        }
      } else {
        alert(result.message || "上传失败");
      }
    } catch {
      alert("上传失败，请稍后重试");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRichInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
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
      onChange(newText);
      setShowCodeDropdown(false);

      setTimeout(() => {
        textarea.focus();
        const codeStart = start + 4 + language.length + 1;
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
      setShowCodeDropdown(false);
    }
  };

  const toolbarClick = (btn: ToolbarButton) => {
    if (mode === "rich") {
      if (btn.command === "formatBlock" && btn.value === "pre") {
        setShowCodeDropdown(!showCodeDropdown);
      } else {
        execCommand(btn.command, btn.value);
      }
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
            setShowCodeDropdown(!showCodeDropdown);
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
            if (btn.command === "formatBlock" && btn.value === "pre") {
              return (
                <div key={btn.title} className="relative">
                  <button
                    type="button"
                    onClick={() => toolbarClick(btn)}
                    className={cn(
                      "p-2 rounded-md transition-colors hover:bg-primary/10 hover:text-primary"
                    )}
                    style={{ color: "var(--blog-foreground)" }}
                    title={btn.title}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                  {showCodeDropdown && (
                    <div
                      className="code-language-dropdown absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50 min-w-[150px]"
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
                  "p-2 rounded-md transition-colors hover:bg-primary/10 hover:text-primary"
                )}
                style={{ color: "var(--blog-foreground)" }}
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
