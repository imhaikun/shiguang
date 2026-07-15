import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, AlertCircle } from "lucide-react";
import { getPostBySlug, getAllTags, type Post } from "@/data/posts";
import RichEditor from "@/components/RichEditor";

export default function PostForm() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isEdit = !!slug;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [tags, setTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const availableTags = getAllTags();
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (isEdit && slug) {
      const post = getPostBySlug(slug);
      if (post) {
        setTitle(post.title);
        setDate(post.date);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setTags(post.tags);
        setFeatured(post.featured || false);
      }
    }
  }, [isEdit, slug]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "请输入文章标题";
    if (!excerpt.trim()) newErrors.excerpt = "请输入文章摘要";
    if (!content.trim()) newErrors.content = "请输入文章内容";
    if (!date) newErrors.date = "请选择发布日期";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaved(true);
    setTimeout(() => {
      navigate("/admin/posts");
    }, 1000);
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

        <div className="flex items-center justify-end gap-4">
          {isEdit && slug && (
            <a
              href={`/post/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <Eye className="h-4 w-4" />
              预览文章
            </a>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--blog-primary)" }}
          >
            <Save className="h-4 w-4" />
            保存文章
          </button>
        </div>
      </form>
    </div>
  );
}
