import { useState } from "react";
import { Save, Palette, Bell, Shield } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [siteTitle, setSiteTitle] = useState("拾光笔记");
  const [siteDescription, setSiteDescription] = useState(
    "写代码，也写生活。一个关于设计、代码与生活的个人博客。"
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="blog-h2" style={{ margin: 0 }}>
          设置
        </h2>
        <p className="blog-small mt-1" style={{ color: "var(--blog-muted)" }}>
          配置博客站点信息和偏好设置
        </p>
      </div>

      {saved && (
        <div
          className="p-4 rounded-md flex items-center gap-2"
          style={{
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.2)",
          }}
        >
          <Save className="h-4 w-4" style={{ color: "#16a34a" }} />
          <span className="blog-small" style={{ color: "#16a34a" }}>
            设置已保存！
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <Palette className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              站点信息
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  站点标题
                </label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                />
              </div>
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  站点描述
                </label>
                <textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors resize-none"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <Bell className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              通知设置
            </h3>
            <div className="space-y-4">
              <label
                className="flex items-center gap-3 cursor-pointer"
                style={{ color: "var(--blog-foreground)" }}
              >
                <input
                  type="checkbox"
                  checked={true}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--blog-primary)" }}
                />
                <span className="blog-small">接收评论通知</span>
              </label>
              <label
                className="flex items-center gap-3 cursor-pointer"
                style={{ color: "var(--blog-foreground)" }}
              >
                <input
                  type="checkbox"
                  checked={false}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--blog-primary)" }}
                />
                <span className="blog-small">接收订阅邮件</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <Shield className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              主题模式
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setTheme("light")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-colors"
                style={{
                  background: theme === "light" ? "rgba(194,112,62,0.1)" : "var(--blog-background)",
                  border: theme === "light" ? "1px solid var(--blog-primary)" : "1px solid var(--blog-border)",
                  color: theme === "light" ? "var(--blog-primary)" : "var(--blog-muted-foreground)",
                }}
              >
                <span>亮色模式</span>
                {theme === "light" && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "var(--blog-primary)", color: "#fff" }}
                  >
                    ✓
                  </span>
                )}
              </button>
              <button
                onClick={() => setTheme("dark")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-colors"
                style={{
                  background: theme === "dark" ? "rgba(194,112,62,0.1)" : "var(--blog-background)",
                  border: theme === "dark" ? "1px solid var(--blog-primary)" : "1px solid var(--blog-border)",
                  color: theme === "dark" ? "var(--blog-primary)" : "var(--blog-muted-foreground)",
                }}
              >
                <span>暗色模式</span>
                {theme === "dark" && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "var(--blog-primary)", color: "#fff" }}
                  >
                    ✓
                  </span>
                )}
              </button>
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4" style={{ margin: 0 }}>
              保存设置
            </h3>
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--blog-primary)" }}
            >
              <Save className="h-4 w-4" />
              保存更改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
