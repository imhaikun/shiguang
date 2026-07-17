import { useEffect } from "react";
import TwoColumn from "@/components/TwoColumn";
import FeaturedPost from "@/components/FeaturedPost";
import ArticleListItem from "@/components/ArticleListItem";
import { usePosts } from "@/hooks/usePosts";

export default function Home() {
  const { loaded, loadPosts, getFeaturedPost, getNonFeaturedPosts } = usePosts();

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  const featured = getFeaturedPost();
  const posts = getNonFeaturedPosts();

  return (
    <TwoColumn>
      {featured && <FeaturedPost post={featured} />}

      <div className="flex flex-col">
        {posts.map((post, index) => (
          <ArticleListItem
            key={post.slug}
            post={post}
            showDivider={index < posts.length - 1}
          />
        ))}
      </div>
    </TwoColumn>
  );
}
