import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TwoColumn from "@/components/TwoColumn";
import ArticleListItem from "@/components/ArticleListItem";
import { usePosts } from "@/hooks/usePosts";
import { getCategoryBySlug } from "@/data/categories";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const PAGE_SIZE = 10;

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const category = getCategoryBySlug(slug);
  const { loaded, loadPosts, posts } = usePosts();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [slug]);

  const categoryPosts = useMemo(() => {
    if (!category) return [];
    return posts.filter((post) =>
      post.tags.some((tag) => category.tags.includes(tag))
    );
  }, [posts, category]);

  const visiblePosts = useMemo(() => {
    return categoryPosts.slice(0, visibleCount);
  }, [categoryPosts, visibleCount]);

  const hasMore = visibleCount < categoryPosts.length;

  const { lastElementRef } = useInfiniteScroll({
    hasMore,
    isLoading: false,
    onLoadMore: () => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    },
  });

  if (!category) {
    return (
      <TwoColumn>
        <div className="py-20 text-center">
          <p className="blog-body" style={{ color: "var(--blog-muted-foreground)" }}>
            分类不存在
          </p>
          <Link
            to="/"
            className="blog-small inline-flex items-center gap-1 mt-4 no-underline transition-opacity hover:opacity-75"
            style={{ color: "var(--blog-primary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
        </div>
      </TwoColumn>
    );
  }

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
          {category.name}
        </h1>
        <p className="blog-body" style={{ color: "var(--blog-muted-foreground)", lineHeight: 1.7 }}>
          {category.description}
        </p>
        <p className="blog-caption mt-2" style={{ color: "var(--blog-muted)" }}>
          共 {categoryPosts.length} 篇文章
        </p>
      </div>

      {categoryPosts.length > 0 ? (
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
        <p className="blog-body mt-6" style={{ color: "var(--blog-muted-foreground)" }}>
          该分类下暂无文章，敬请期待。
        </p>
      )}
    </TwoColumn>
  );
}
