import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import type { Post } from "@/data/posts";
import { formatLongDate } from "@/data/posts";

export default function FeaturedPost({ post }: { post: Post }) {
  return (
    <article
      className="rounded-lg animate-fade-up"
      style={{
        padding: "28px 28px 24px",
        background: "var(--blog-card)",
        border: "1px solid var(--blog-border)",
        borderLeft: "3px solid var(--blog-primary)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-3.5 w-3.5" style={{ color: "var(--blog-muted)" }} />
        <time className="blog-small">{formatLongDate(post.date)}</time>
        <span
          className="blog-caption ml-2 px-2 py-0.5 rounded-sm"
          style={{
            color: "var(--blog-primary)",
            background: "rgba(194,112,62,0.08)",
          }}
        >
          置顶
        </span>
      </div>
      <h1 className="blog-h1 mb-3" style={{ fontSize: "2rem" }}>
        <Link
          to={`/post/${post.slug}`}
          className="no-underline transition-opacity hover:opacity-75"
          style={{ color: "var(--blog-foreground)" }}
        >
          {post.title}
        </Link>
      </h1>
      <p className="blog-body mb-4">{post.excerpt}</p>
      <Link
        to={`/post/${post.slug}`}
        className="blog-small arrow-link inline-flex items-center gap-1 no-underline font-medium transition-opacity hover:opacity-75"
        style={{ color: "var(--blog-primary)" }}
      >
        阅读全文 <ArrowRight className="arrow h-3.5 w-3.5" />
      </Link>
    </article>
  );
}
