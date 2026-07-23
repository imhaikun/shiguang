import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TwoColumn from "@/components/TwoColumn";
import ArticleListItem from "@/components/ArticleListItem";
import { usePosts } from "@/hooks/usePosts";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const PAGE_SIZE = 10;

export default function TagResults() {
  const { tag = "" } = useParams();
  const decodedTag = decodeURIComponent(tag);
  const { loaded, loadPosts, posts } = usePosts();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tag]);

  const allPosts = useMemo(() => {
    return posts.filter((post) => post.tags.includes(decodedTag));
  }, [posts, decodedTag]);

  const visiblePosts = useMemo(() => {
    return allPosts.slice(0, visibleCount);
  }, [allPosts, visibleCount]);

  const hasMore = visibleCount < allPosts.length;

  const { lastElementRef } = useInfiniteScroll({
    hasMore,
    isLoading: false,
    onLoadMore: () => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    },
  });

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
          标签：{decodedTag}
        </h1>
        <p className="blog-body">
          共 {allPosts.length} 篇文章
        </p>
      </div>

      {allPosts.length > 0 ? (
        <>
          <div className="flex flex-col mt-4">
            {visiblePosts.map((post, index) => (
              <div
                key={post.slug}
                ref={index === visiblePosts.length - 1 && hasMore ? lastElementRef : null}
              >
                <ArticleListItem
                  post={post}
                  showDivider={index < visiblePosts.length - 1}
                />
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-4">
              <div
                className="w-5 h-5 border-2 border-primary rounded-full animate-spin"
                style={{ borderColor: "var(--blog-primary)", borderTopColor: "transparent" }}
              />
            </div>
          )}
        </>
      ) : (
        <p className="blog-body mt-6">该标签下暂无文章。</p>
      )}
    </TwoColumn>
  );
}
