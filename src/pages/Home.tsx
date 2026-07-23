import { useEffect, useState, useMemo } from "react";
import TwoColumn from "@/components/TwoColumn";
import FeaturedPost from "@/components/FeaturedPost";
import ArticleListItem from "@/components/ArticleListItem";
import { usePosts } from "@/hooks/usePosts";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const PAGE_SIZE = 10;

export default function Home() {
  const { loaded, loadPosts, getFeaturedPost, getNonFeaturedPosts } = usePosts();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  const featured = getFeaturedPost();
  const allPosts = getNonFeaturedPosts();

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
      {featured && <FeaturedPost post={featured} />}

      <div className="flex flex-col">
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
    </TwoColumn>
  );
}
