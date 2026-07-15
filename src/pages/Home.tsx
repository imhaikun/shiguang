import TwoColumn from "@/components/TwoColumn";
import FeaturedPost from "@/components/FeaturedPost";
import ArticleListItem from "@/components/ArticleListItem";
import { getFeaturedPost, getNonFeaturedPosts } from "@/data/posts";

export default function Home() {
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
