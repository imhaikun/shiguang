import { useState, useEffect } from "react";
import { Edit2, Trash2, Save, X, Plus, Check, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ name: "", slug: "", description: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({ name: "", slug: "", description: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories.sort((a: Category, b: Category) => b.count - a.count));
      }
    } catch (err) {
      console.error("Load categories failed:", err);
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

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingData({ name: category.name, slug: category.slug, description: category.description });
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!editingId || !editingData.name.trim() || !editingData.slug.trim()) {
      showError("分类名称和别名不能为空");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingData),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("分类已更新");
        setEditingId(null);
        setEditingData({ name: "", slug: "", description: "" });
        loadCategories();
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
    setEditingId(null);
    setEditingData({ name: "", slug: "", description: "" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除分类 "${name}" 吗？此操作会将该分类下的所有文章移为无分类。`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message);
        loadCategories();
      } else {
        showError(data.message || "删除失败");
      }
    } catch (err) {
      showError("删除失败，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async () => {
    if (!addData.name.trim() || !addData.slug.trim()) {
      showError("分类名称和别名不能为空");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addData),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("分类已创建");
        setShowAddForm(false);
        setAddData({ name: "", slug: "", description: "" });
        loadCategories();
      } else {
        showError(data.message || "创建失败");
      }
    } catch (err) {
      showError("创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="blog-h2" style={{ margin: 0 }}>
            分类管理
          </h2>
          <p className="blog-small mt-1" style={{ color: "var(--blog-muted)" }}>
            管理文章分类，支持创建、修改和删除分类
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--blog-primary)" }}
        >
          <Plus className="h-4 w-4" />
          新建分类
        </button>
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

      {showAddForm && (
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--blog-card)",
            border: "1px solid var(--blog-border)",
          }}
        >
          <h3 className="blog-h3" style={{ margin: 0, marginBottom: "1rem" }}>
            新建分类
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block blog-small font-medium mb-2"
                style={{ color: "var(--blog-foreground)" }}
              >
                分类名称 <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={addData.name}
                onChange={(e) => setAddData({ ...addData, name: e.target.value })}
                placeholder="输入分类名称"
                className="w-full rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors"
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
                分类别名 <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={addData.slug}
                onChange={(e) => setAddData({ ...addData, slug: e.target.value })}
                placeholder="输入分类别名（英文小写）"
                className="w-full rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={{
                  border: "1px solid var(--blog-border)",
                  background: "var(--blog-background)",
                  color: "var(--blog-foreground)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
              />
            </div>
            <div className="md:col-span-2">
              <label
                className="block blog-small font-medium mb-2"
                style={{ color: "var(--blog-foreground)" }}
              >
                分类描述
              </label>
              <textarea
                value={addData.description}
                onChange={(e) => setAddData({ ...addData, description: e.target.value })}
                placeholder="输入分类描述（可选）"
                rows={2}
                className="w-full rounded-md px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none"
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
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddData({ name: "", slug: "", description: "" });
              }}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ color: "var(--blog-muted-foreground)" }}
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-70"
              style={{ background: "var(--blog-primary)" }}
            >
              <Save className="h-4 w-4" />
              创建
            </button>
          </div>
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
                分类名称
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                别名
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                描述
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                文章数
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
                <td colSpan={5} className="px-6 py-8 text-center">
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
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <p className="blog-small" style={{ color: "var(--blog-muted)" }}>
                    暂无分类，点击上方按钮创建
                  </p>
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr
                  key={cat.id}
                  style={{ borderBottom: "1px solid var(--blog-border)" }}
                >
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editingData.name}
                        onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                        className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                        style={{
                          border: "1px solid var(--blog-primary)",
                          background: "var(--blog-background)",
                          color: "var(--blog-foreground)",
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--blog-foreground)" }}
                      >
                        {cat.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editingData.slug}
                        onChange={(e) => setEditingData({ ...editingData, slug: e.target.value })}
                        className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                        style={{
                          border: "1px solid var(--blog-primary)",
                          background: "var(--blog-background)",
                          color: "var(--blog-foreground)",
                        }}
                      />
                    ) : (
                      <code
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          color: "var(--blog-primary)",
                        }}
                      >
                        {cat.slug}
                      </code>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editingData.description}
                        onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                        className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                        style={{
                          border: "1px solid var(--blog-primary)",
                          background: "var(--blog-background)",
                          color: "var(--blog-foreground)",
                        }}
                      />
                    ) : (
                      <span
                        className="text-sm"
                        style={{ color: "var(--blog-muted)" }}
                      >
                        {cat.description || "-"}
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
                      {cat.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === cat.id ? (
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
                          onClick={() => handleEdit(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:text-primary hover:bg-primary/5"
                          style={{ color: "var(--blog-muted-foreground)" }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          修改
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={deletingId === cat.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:text-red-600 hover:bg-red-50"
                          style={{ color: "var(--blog-muted-foreground)" }}
                        >
                          {deletingId === cat.id ? (
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