import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Tag as TagIcon } from "lucide-react";
import {
  getPostBySlug,
  getAdjacentPosts,
  formatLongDate,
} from "@/data/posts";

export default function ArticleDetail() {
  const { slug = "" } = useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="blog-h2 mb-4">文章未找到</h1>
        <p className="blog-body mb-6">你访问的文章可能已被移动或删除。</p>
        <Link
          to="/"
          className="blog-small inline-flex items-center gap-1 no-underline"
          style={{ color: "var(--blog-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>
      </div>
    );
  }

  const { prev, next } = getAdjacentPosts(slug);

  return (
    <article className="max-w-3xl mx-auto px-6 py-10 lg:py-14 animate-fade-in">
      {/* 返回链接 */}
      <Link
        to="/"
        className="blog-small arrow-link inline-flex items-center gap-1 no-underline mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--blog-muted-foreground)" }}
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      {/* 文章头部 */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4" style={{ color: "var(--blog-muted)" }} />
          <time className="blog-small">{formatLongDate(post.date)}</time>
        </div>
        <h1 className="blog-h1 mb-4" style={{ fontSize: "2.25rem" }}>
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              to={`/tag/${encodeURIComponent(tag)}`}
              className="blog-caption inline-flex items-center gap-1 no-underline transition-colors hover:text-primary"
              style={{
                padding: "3px 10px",
                border: "1px solid var(--blog-border)",
                borderRadius: "var(--blog-radius-sm)",
                color: "var(--blog-muted-foreground)",
              }}
            >
              <TagIcon className="h-3 w-3" />
              {tag}
            </Link>
          ))}
        </div>
      </header>

      {/* 正文 */}
      <div
        className="prose-editorial"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 分隔线 */}
      <hr className="my-10 border-0 border-t" style={{ borderColor: "var(--blog-border)" }} />

      {/* 上下篇导航 */}
      <nav className="flex flex-col sm:flex-row gap-4">
        {prev ? (
          <Link
            to={`/post/${prev.slug}`}
            className="flex-1 rounded-md p-4 no-underline transition-colors hover:border-primary/50 group"
            style={{
              border: "1px solid var(--blog-border)",
              background: "var(--blog-card)",
            }}
          >
            <span
              className="blog-caption inline-flex items-center gap-1 mb-1"
              style={{ color: "var(--blog-muted)" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 上一篇
            </span>
            <span
              className="blog-h3 block transition-colors group-hover:text-primary"
              style={{ color: "var(--blog-foreground)" }}
            >
              {prev.title}
            </span>
          </Link>
        ) : (
          <div
            className="flex-1 rounded-md p-4 opacity-40"
            style={{ border: "1px solid var(--blog-border)" }}
          >
            <span className="blog-caption inline-flex items-center gap-1 mb-1">
              <ChevronLeft className="h-3.5 w-3.5" /> 上一篇
            </span>
            <span className="blog-h3 block">没有更早的文章了</span>
          </div>
        )}
        {next ? (
          <Link
            to={`/post/${next.slug}`}
            className="flex-1 rounded-md p-4 text-right no-underline transition-colors hover:border-primary/50 group"
            style={{
              border: "1px solid var(--blog-border)",
              background: "var(--blog-card)",
            }}
          >
            <span
              className="blog-caption inline-flex items-center gap-1 mb-1"
              style={{ color: "var(--blog-muted)" }}
            >
              下一篇 <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <span
              className="blog-h3 block transition-colors group-hover:text-primary"
              style={{ color: "var(--blog-foreground)" }}
            >
              {next.title}
            </span>
          </Link>
        ) : (
          <div
            className="flex-1 rounded-md p-4 text-right opacity-40"
            style={{ border: "1px solid var(--blog-border)" }}
          >
            <span className="blog-caption inline-flex items-center gap-1 mb-1">
              下一篇 <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <span className="blog-h3 block">没有更新的文章了</span>
          </div>
        )}
      </nav>
    </article>
  );
}
