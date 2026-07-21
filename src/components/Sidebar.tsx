import { useState, useMemo, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Tag as TagIcon, BookOpen, Bug, Wrench, Pencil } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { categories } from "@/data/categories";

export default function Sidebar() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const { loaded, loadPosts, getRandomPosts, getAllTags, getPostsByTag } = usePosts();

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  const tags = getAllTags();
  const recommended = useMemo(() => getRandomPosts(5), [getRandomPosts, loaded]);

  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    tags.forEach((tag) => {
      stats[tag] = getPostsByTag(tag).length;
    });
    const counts = Object.values(stats);
    const maxCount = Math.max(...counts, 1);
    return { stats, maxCount };
  }, [tags, getPostsByTag]);

  const getTagStyle = (tag: string) => {
    const count = tagStats.stats[tag] || 0;
    const ratio = count / tagStats.maxCount;
    let textColor: string;
    
    if (ratio >= 0.6) {
      textColor = "#064e3b";
    } else if (ratio >= 0.4) {
      textColor = "#059669";
    } else if (ratio >= 0.2) {
      textColor = "#059669";
    } else {
      textColor = "#0d9488";
    }

    return {
      color: textColor,
    };
  };

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
        <span className="blog-caption">爱NAS，也爱生活</span>
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

      {/* 栏目导航 */}
      <div className="flex flex-col gap-3">
        <span
          className="blog-caption font-semibold uppercase"
          style={{
            color: "var(--blog-muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          栏目导航
        </span>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="blog-caption no-underline transition-colors hover:text-primary flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-primary/5"
              style={{ color: "var(--blog-muted-foreground)" }}
            >
              {cat.slug === "tutorial" && <BookOpen className="h-4 w-4" style={{ color: "var(--blog-primary)" }} />}
              {cat.slug === "pitfall" && <Bug className="h-4 w-4" style={{ color: "var(--blog-primary)" }} />}
              {cat.slug === "tools" && <Wrench className="h-4 w-4" style={{ color: "var(--blog-primary)" }} />}
              {cat.slug === "diary" && <Pencil className="h-4 w-4" style={{ color: "var(--blog-primary)" }} />}
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 随机推荐 */}
      <div className="flex flex-col gap-3">
        <span
          className="blog-caption font-semibold uppercase"
          style={{
            color: "var(--blog-muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          推荐阅读
        </span>
        <div className="flex flex-col gap-2">
          {recommended.map((post) => (
            <Link
              key={post.slug}
              to={`/post/${post.slug}`}
              className="blog-caption no-underline transition-colors hover:text-primary truncate"
              style={{ color: "var(--blog-muted-foreground)", lineHeight: 1.5 }}
              title={post.title}
            >
              {post.title}
            </Link>
          ))}
        </div>
      </div>

      {/* 标签云 */}
      <div className="flex flex-col gap-3">
        <span
          className="blog-caption font-semibold uppercase"
          style={{
            color: "var(--blog-muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          标签云
        </span>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const trimmedTag = tag.trim();
            const count = tagStats.stats[tag] || 0;
            const sizeClass =
              count >= 5 ? "text-sm px-3.5 py-1.5" : count >= 3 ? "text-xs px-3 py-1" : "text-xs px-2.5 py-0.5";
            const style = getTagStyle(tag);
            return (
              <Link
                key={trimmedTag}
                to={`/tag/${encodeURIComponent(trimmedTag)}`}
                className={`blog-caption no-underline rounded-full transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-sm ${sizeClass} border whitespace-nowrap`}
                style={{
                  background: "rgba(16,185,129,0.08)",
                  color: style.color,
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
                title={`${count} 篇文章`}
              >
                {trimmedTag}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
