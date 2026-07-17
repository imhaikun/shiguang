import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import TwoColumn from "@/components/TwoColumn";
import ArticleListItem from "@/components/ArticleListItem";
import { usePosts } from "@/hooks/usePosts";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const { loaded, loadPosts, searchPosts } = usePosts();

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  const results = q ? searchPosts(q) : [];

  return (
    <TwoColumn>
      <div className="mb-2">
        <Link
          to="/"
          className="blog-small arrow-link inline-flex items-center gap-1 no-underline mb-6 transition-opacity hover:opacity-75"
          style={{ color: "var(--blog-muted-foreground)" }}
        >
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>
        <h1 className="blog-h1 mb-2" style={{ fontSize: "2rem" }}>
          搜索结果
        </h1>
        <p className="blog-body">
          {q ? (
            <>
              关键词「<span style={{ color: "var(--blog-foreground)" }}>{q}</span>
              」共找到 {results.length} 篇文章
            </>
          ) : (
            "请输入搜索关键词"
          )}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="flex flex-col mt-4">
          {results.map((post, index) => (
            <ArticleListItem
              key={post.slug}
              post={post}
              showDivider={index < results.length - 1}
            />
          ))}
        </div>
      ) : (
        q && (
          <div
            className="mt-6 flex flex-col items-center gap-3 rounded-md py-12 text-center"
            style={{ border: "1px solid var(--blog-border)" }}
          >
            <SearchX
              className="h-8 w-8"
              style={{ color: "var(--blog-muted)" }}
            />
            <p className="blog-body">没有找到匹配的文章，换个关键词试试？</p>
          </div>
        )
      )}
    </TwoColumn>
  );
}
