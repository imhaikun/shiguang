import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import type { Post } from "@/data/posts";
import { formatShortDate } from "@/data/posts";

export default function ArticleListItem({
  post,
  showDivider = true,
}: {
  post: Post;
  showDivider?: boolean;
}) {
  return (
    <article
      className="flex gap-4 sm:gap-6 items-baseline py-6 group"
      style={showDivider ? { borderBottom: "1px solid var(--blog-border)" } : undefined}
    >
      <time
        className="blog-caption flex-shrink-0 hidden sm:flex items-center gap-1.5"
        style={{ width: "90px", color: "var(--blog-muted)" }}
      >
        <Calendar className="h-3 w-3" />
        {formatShortDate(post.date)}
      </time>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <time className="blog-caption sm:hidden" style={{ color: "var(--blog-muted)" }}>
          {formatShortDate(post.date)}
        </time>
        <h3 className="blog-h3">
          <Link
            to={`/post/${post.slug}`}
            className="no-underline transition-colors group-hover:text-primary"
            style={{ color: "var(--blog-foreground)" }}
          >
            {post.title}
          </Link>
        </h3>
        <p
          className="blog-small"
          style={{
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.excerpt}
        </p>
      </div>
      <Link
        to={`/post/${post.slug}`}
        className="blog-caption arrow-link flex-shrink-0 no-underline whitespace-nowrap transition-opacity hover:opacity-75"
        style={{ color: "var(--blog-primary)" }}
      >
        阅读全文 <ArrowRight className="arrow inline h-3 w-3" />
      </Link>
    </article>
  );
}
