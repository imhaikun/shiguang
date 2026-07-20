import { useState, useEffect } from "react";
import { Edit2, Trash2, Save, X, Check, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

interface Tag {
  name: string;
  count: number;
}

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tags`);
      const data = await res.json();
      if (data.success && data.tags) {
        setTags(data.tags.sort((a: Tag, b: Tag) => b.count - a.count));
      }
    } catch (err) {
      console.error("Load tags failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess("");
    setTimeout(() => setError(""), 3000);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleEdit = (tagName: string) => {
    setEditingTag(tagName);
    setEditValue(tagName);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!editingTag || !editValue.trim()) {
      showError("标签名称不能为空");
      return;
    }
    if (editingTag === editValue.trim()) {
      setEditingTag(null);
      setEditValue("");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: editingTag, newName: editValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message);
        setEditingTag(null);
        setEditValue("");
        loadTags();
      } else {
        showError(data.message || "修改失败");
      }
    } catch (err) {
      showError("修改失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingTag(null);
    setEditValue("");
  };

  const handleDelete = async (tagName: string) => {
    if (!confirm(`确定要删除标签 "${tagName}" 吗？此操作会从所有文章中移除该标签。`)) {
      return;
    }

    setDeletingTag(tagName);
    try {
      const res = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(tagName)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message);
        loadTags();
      } else {
        showError(data.message || "删除失败");
      }
    } catch (err) {
      showError("删除失败，请稍后重试");
    } finally {
      setDeletingTag(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="blog-h2" style={{ margin: 0 }}>
          标签管理
        </h2>
        <p className="blog-small mt-1" style={{ color: "var(--blog-muted)" }}>
          管理文章标签，支持修改名称和删除标签
        </p>
      </div>

      {error && (
        <div
          className="p-4 rounded-md flex items-center gap-2"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          <AlertCircle className="h-4 w-4" style={{ color: "#dc2626" }} />
          <span className="blog-small" style={{ color: "#dc2626" }}>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="p-4 rounded-md flex items-center gap-2"
          style={{
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.2)",
          }}
        >
          <Check className="h-4 w-4" style={{ color: "#16a34a" }} />
          <span className="blog-small" style={{ color: "#16a34a" }}>{success}</span>
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "var(--blog-card)",
          border: "1px solid var(--blog-border)",
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--blog-border)" }}>
              <th
                className="px-6 py-4 text-left text-sm font-medium"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                标签名称
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                关联文章数
              </th>
              <th
                className="px-6 py-4 text-right text-sm font-medium"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center">
                  <div className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        style={{ color: "var(--blog-primary)" }}
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        style={{ color: "var(--blog-primary)" }}
                      />
                    </svg>
                    <span className="blog-small" style={{ color: "var(--blog-muted)" }}>
                      加载中...
                    </span>
                  </div>
                </td>
              </tr>
            ) : tags.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center">
                  <p className="blog-small" style={{ color: "var(--blog-muted)" }}>
                    暂无标签，发布文章时可添加标签
                  </p>
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr
                  key={tag.name}
                  style={{ borderBottom: "1px solid var(--blog-border)" }}
                >
                  <td className="px-6 py-4">
                    {editingTag === tag.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 rounded-md px-3 py-2 text-sm focus:outline-none"
                          style={{
                            border: "1px solid var(--blog-primary)",
                            background: "var(--blog-background)",
                            color: "var(--blog-foreground)",
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--blog-foreground)" }}
                      >
                        {tag.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(16,185,129,0.08)",
                        color: "var(--blog-primary)",
                      }}
                    >
                      {tag.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingTag === tag.name ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-opacity disabled:opacity-70"
                          style={{ background: "var(--blog-primary)" }}
                        >
                          <Save className="h-3.5 w-3.5" />
                          保存
                        </button>
                        <button
                          onClick={handleCancel}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          style={{ color: "var(--blog-muted-foreground)" }}
                        >
                          <X className="h-3.5 w-3.5" />
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tag.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:text-primary hover:bg-primary/5"
                          style={{ color: "var(--blog-muted-foreground)" }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          修改
                        </button>
                        <button
                          onClick={() => handleDelete(tag.name)}
                          disabled={deletingTag === tag.name}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:text-red-600 hover:bg-red-50"
                          style={{ color: "var(--blog-muted-foreground)" }}
                        >
                          {deletingTag === tag.name ? (
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}