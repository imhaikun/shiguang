import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, AlertCircle, Send, X, Calendar, Tag as TagIcon } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import RichEditor from "@/components/RichEditor";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

interface Category {
  id: string;
  name: string;
  slug: string;
}

function formatLongDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function PostForm() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isEdit = !!slug;
  const { posts, loaded, loadPosts, loadAllPosts, createPost, updatePost, getAllTags, getPostBySlug } = usePosts();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [featured, setFeatured] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const availableTags = getAllTags();
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!loaded) loadPosts();
  }, [loaded, loadPosts]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEdit && slug && loaded) {
      const post = getPostBySlug(slug);
      if (post) {
        setTitle(post.title);
        setDate(post.date);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setTags(post.tags);
        setCategory(post.category || "");
        setFeatured(post.featured || false);
      }
    }
  }, [isEdit, slug, loaded, getPostBySlug, posts]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Fetch categories failed:", err);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "请输入文章标题";
    if (!excerpt.trim()) newErrors.excerpt = "请输入文章摘要";
    if (!content.trim()) newErrors.content = "请输入文章内容";
    if (!date) newErrors.date = "请选择发布日期";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaveError("");

    try {
      const postData = { title, date, excerpt, content, tags, category, featured, status: "draft" as const };
      let result;
      if (isEdit && slug) {
        result = await updatePost(slug, postData);
      } else {
        result = await createPost(postData);
      }

      if (result) {
        setSaved(true);
        await loadAllPosts();
        setTimeout(() => {
          navigate("/admin/posts");
        }, 1000);
      } else {
        setSaveError("保存失败，请稍后重试");
      }
    } catch {
      setSaveError("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addTag(newTag);
    } else if (e.key === "Backspace" && !newTag && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handlePreview = () => {
    if (!validate()) {
      setShowPreview(false);
      return;
    }
    setShowPreview(true);
  };

  const handlePublish = async () => {
    if (!validate()) return;

    setPublishing(true);
    setSaveError("");

    try {
      const postData = { title, date, excerpt, content, tags, category, featured, status: "published" as const };
      let result;
      let newSlug = slug;
      if (isEdit && slug) {
        result = await updatePost(slug, postData);
      } else {
        result = await createPost(postData);
        if (result && result.slug) {
          newSlug = result.slug;
        }
      }

      if (result) {
        await loadAllPosts();
        setSaved(true);
        setShowPreview(false);
        setTimeout(() => {
          if (newSlug) {
            navigate(`/post/${newSlug}`);
          } else {
            navigate("/admin/posts");
          }
        }, 800);
      } else {
        setSaveError("发布失败，请稍后重试");
      }
    } catch {
      setSaveError("发布失败，请稍后重试");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/posts")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
        <div>
          <h2 className="blog-h2" style={{ margin: 0 }}>
            {isEdit ? "编辑文章" : "新增文章"}
          </h2>
          <p className="blog-small mt-1" style={{ color: "var(--blog-muted)" }}>
            {isEdit ? "修改已有文章内容" : "创建一篇新文章"}
          </p>
        </div>
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
            保存成功！
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--blog-card)",
            border: "1px solid var(--blog-border)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  标题 <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入文章标题"
                  className="w-full rounded-md px-4 py-3 text-base focus:outline-none transition-colors"
                  style={{
                    border: errors.title ? "1px solid #dc2626" : "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.title ? "#dc2626" : "var(--blog-border)")}
                />
                {errors.title && (
                  <p className="mt-1 text-xs flex items-center gap-1" style={{ color: "#dc2626" }}>
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  摘要 <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="输入文章摘要（简短描述）"
                  rows={3}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors resize-none"
                  style={{
                    border: errors.excerpt ? "1px solid #dc2626" : "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.excerpt ? "#dc2626" : "var(--blog-border)")}
                />
                {errors.excerpt && (
                  <p className="mt-1 text-xs flex items-center gap-1" style={{ color: "#dc2626" }}>
                    <AlertCircle className="h-3 w-3" />
                    {errors.excerpt}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  内容 <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <RichEditor
                  value={content}
                  onChange={setContent}
                  placeholder="在这里输入文章内容..."
                />
                {errors.content && (
                  <p className="mt-1 text-xs flex items-center gap-1" style={{ color: "#dc2626" }}>
                    <AlertCircle className="h-3 w-3" />
                    {errors.content}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  发布日期 <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{
                    border: errors.date ? "1px solid #dc2626" : "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.date ? "#dc2626" : "var(--blog-border)")}
                />
              </div>

              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                >
                  <option value="">选择分类（可选）</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  标签
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md"
                      style={{
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid var(--blog-primary)",
                        color: "var(--blog-primary)",
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入标签名称，回车添加"
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
                {availableTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted mr-1">已有标签：</span>
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="text-xs px-2 py-1 rounded transition-colors hover:bg-primary/5"
                        style={{
                          background: tags.includes(tag) ? "rgba(16,185,129,0.08)" : "transparent",
                          color: tags.includes(tag) ? "var(--blog-primary)" : "var(--blog-muted)",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label
                  className="flex items-center gap-3 cursor-pointer"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--blog-primary)" }}
                  />
                  <span className="blog-small">置顶精选</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="p-4 rounded-md flex items-center gap-2" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <AlertCircle className="h-4 w-4" style={{ color: "#dc2626" }} />
            <span className="blog-small" style={{ color: "#dc2626" }}>{saveError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--blog-border)",
              background: "var(--blog-card)",
              color: "var(--blog-foreground)",
            }}
          >
            <Eye className="h-4 w-4" />
            文章预览
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#0f172a" }}
          >
            <Send className="h-4 w-4" />
            {publishing ? "发布中..." : "发布文章"}
          </button>
          <button
            type="submit"
            disabled={saving || publishing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--blog-primary)" }}
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : "保存草稿"}
          </button>
        </div>
      </form>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden"
            style={{ background: "var(--blog-background)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-3 border-b"
              style={{ borderColor: "var(--blog-border)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--blog-foreground)" }}>
                文章预览
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-8">
              <article className="animate-fade-in">
                <header className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4" style={{ color: "var(--blog-muted)" }} />
                    <time className="blog-small">{formatLongDate(date)}</time>
                  </div>
                  <h1
                    className="blog-h1 mb-4"
                    style={{ fontSize: "2.25rem" }}
                  >
                    {title || "无标题"}
                  </h1>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="blog-caption inline-flex items-center gap-1"
                          style={{
                            padding: "3px 10px",
                            border: "1px solid var(--blog-border)",
                            borderRadius: "var(--blog-radius-sm)",
                            color: "var(--blog-muted-foreground)",
                          }}
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {excerpt && (
                  <p
                    className="blog-body mb-6 italic"
                    style={{
                      color: "var(--blog-muted-foreground)",
                      borderLeft: "3px solid var(--blog-primary)",
                      paddingLeft: "1em",
                    }}
                  >
                    {excerpt}
                  </p>
                )}

                <div
                  className="prose-editorial"
                  dangerouslySetInnerHTML={{ __html: content }}
                  ref={(el) => {
                    if (el) {
                      const images = el.querySelectorAll("img");
                      images.forEach((img) => {
                        img.style.cursor = "zoom-in";
                        img.addEventListener("click", (e) => {
                          const target = e.target as HTMLImageElement;
                          setPreviewImage(target.src);
                        });
                      });
                    }
                  }}
                />
              </article>
            </div>

            <div
              className="flex items-center justify-end gap-2 px-6 py-3 border-t"
              style={{ borderColor: "var(--blog-border)" }}
            >
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--blog-border)",
                  color: "var(--blog-foreground)",
                }}
              >
                关闭预览
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--blog-primary)" }}
              >
                <Send className="h-4 w-4" />
                {publishing ? "发布中..." : "确认发布"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
