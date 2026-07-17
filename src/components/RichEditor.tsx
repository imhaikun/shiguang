import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
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
  { icon: Code, command: "formatBlock", value: "pre", title: "代码块" },
  { icon: Link, command: "createLink", title: "插入链接" },
  { icon: Heading2, command: "formatBlock", value: "h2", title: "标题" },
  { icon: Quote, command: "formatBlock", value: "blockquote", title: "引用" },
  { icon: List, command: "insertUnorderedList", title: "无序列表" },
  { icon: ListOrdered, command: "insertOrderedList", title: "有序列表" },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleModeToggle = (newMode: "rich" | "markdown") => {
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
    const textarea = document.createElement("textarea");
    const activeEl = document.activeElement;
    if (!(activeEl instanceof HTMLTextAreaElement)) return;

    const start = activeEl.selectionStart;
    const end = activeEl.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = before + prefix + selectedText + suffix + after;
    onChange(newText);

    setTimeout(() => {
      activeEl.focus();
      activeEl.selectionStart = start + prefix.length;
      activeEl.selectionEnd = end + prefix.length;
    }, 0);
  };

  const toolbarClick = (btn: ToolbarButton) => {
    if (mode === "rich") {
      execCommand(btn.command, btn.value);
    } else {
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
        case "formatBlock":
          if (btn.value === "pre") {
            insertMarkdownFormat("\n```\n", "\n```\n");
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
        <div className="flex items-center gap-1">
          {basicButtons.map((btn) => {
            const Icon = btn.icon;
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
          value={value}
          onChange={handleMarkdownChange}
          placeholder={placeholder}
          className="w-full min-h-[400px] p-4 text-sm font-mono focus:outline-none resize-y"
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
