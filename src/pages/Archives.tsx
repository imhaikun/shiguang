import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { formatYearMonth, formatShortDate } from "@/data/posts";
import { usePosts } from "@/hooks/usePosts";

export default function Archives() {
  const { loaded, loadPosts, getArchives } = usePosts();

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  const archives = getArchives();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14 animate-fade-in">
      <header className="mb-10">
        <h1 className="blog-h1 mb-3" style={{ fontSize: "2.25rem" }}>
          归档
        </h1>
        <p className="blog-body">
          按时间倒序整理的全部文章，共 {archives.reduce((n, g) => n + g.posts.length, 0)} 篇。
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {archives.map((group) => (
          <section key={`${group.year}-${group.month}`}>
            <h2
              className="font-display font-semibold mb-4 pb-2 border-b"
              style={{
                fontSize: "1.25rem",
                color: "var(--blog-foreground)",
                borderColor: "var(--blog-border)",
              }}
            >
              {formatYearMonth(group.year, group.month)}
              <span
                className="blog-caption ml-2 font-normal"
                style={{ color: "var(--blog-muted)" }}
              >
                {group.posts.length} 篇
              </span>
            </h2>
            <div className="flex flex-col">
              {group.posts.map((post, index) => (
                <article
                  key={post.slug}
                  className="flex gap-4 sm:gap-6 items-baseline py-4 group"
                  style={
                    index < group.posts.length - 1
                      ? { borderBottom: "1px solid var(--blog-border)" }
                      : undefined
                  }
                >
                  <time
                    className="blog-caption flex-shrink-0 hidden sm:flex items-center gap-1.5"
                    style={{ width: "70px", color: "var(--blog-muted)" }}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatShortDate(post.date)}
                  </time>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <time
                      className="blog-caption sm:hidden"
                      style={{ color: "var(--blog-muted)" }}
                    >
                      {formatShortDate(post.date)}
                    </time>
                    <Link
                      to={`/post/${post.slug}`}
                      className="blog-h3 no-underline transition-colors group-hover:text-primary"
                      style={{ color: "var(--blog-foreground)" }}
                    >
                      {post.title}
                    </Link>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--blog-primary)" }}
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
