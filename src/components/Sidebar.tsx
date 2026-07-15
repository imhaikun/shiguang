import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookOpen, Archive, Tag as TagIcon } from "lucide-react";
import { getAllTags } from "@/data/posts";

export default function Sidebar() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const tags = getAllTags();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <aside className="flex flex-col gap-8">
      {/* 作者卡 */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-display text-xl font-semibold shadow-sm"
          style={{
            background: "linear-gradient(135deg, var(--blog-primary), #93c5fd)",
          }}
        >
          I
        </div>
        <span
          className="blog-body font-semibold"
          style={{ color: "var(--blog-foreground)", lineHeight: 1.4 }}
        >
          Imloyo
        </span>
        <span className="blog-caption">写代码，也写生活</span>
      </div>

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{ color: "var(--blog-muted)" }}
        />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索文章"
          aria-label="搜索文章"
          className="w-full rounded-md blog-small focus:outline-none transition-colors"
          style={{
            padding: "8px 12px 8px 36px",
            border: "1px solid var(--blog-border)",
            background: "var(--blog-card)",
            color: "var(--blog-foreground)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
        />
      </form>

      {/* 侧边导航 */}
      <nav className="flex flex-col gap-1">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md blog-small no-underline font-medium"
          style={{
            padding: "8px 10px",
            color: "var(--blog-primary)",
            background: "rgba(16,185,129,0.06)",
          }}
        >
          <BookOpen className="h-4 w-4" />
          最新文章
        </Link>
        <Link
          to="/archives"
          className="flex items-center gap-2 rounded-md blog-small no-underline transition-colors hover:text-foreground"
          style={{ padding: "8px 10px", color: "var(--blog-muted-foreground)" }}
        >
          <Archive className="h-4 w-4" />
          归档
        </Link>
        <span
          className="flex items-center gap-2 rounded-md blog-small cursor-default"
          style={{ padding: "8px 10px", color: "var(--blog-muted-foreground)" }}
        >
          <TagIcon className="h-4 w-4" />
          标签云
        </span>
      </nav>

      {/* 标签云 */}
      <div className="flex flex-col gap-3">
        <span
          className="blog-caption font-semibold uppercase"
          style={{
            color: "var(--blog-muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          标签
        </span>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              to={`/tag/${encodeURIComponent(tag)}`}
              className="blog-caption no-underline transition-all hover:text-primary hover:border-primary/50"
              style={{
                padding: "4px 10px",
                border: "1px solid var(--blog-border)",
                borderRadius: "var(--blog-radius-sm)",
                color: "var(--blog-muted-foreground)",
              }}
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
