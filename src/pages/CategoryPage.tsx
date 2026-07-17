import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TwoColumn from "@/components/TwoColumn";
import ArticleListItem from "@/components/ArticleListItem";
import { usePosts } from "@/hooks/usePosts";
import { getCategoryBySlug } from "@/data/categories";

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const category = getCategoryBySlug(slug);
  const { loaded, loadPosts, posts } = usePosts();

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  const categoryPosts = useMemo(() => {
    if (!category) return [];
    return posts.filter((post) =>
      post.tags.some((tag) => category.tags.includes(tag))
    );
  }, [posts, category]);

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
        <div className="flex flex-col mt-4">
          {categoryPosts.map((post, index) => (
            <ArticleListItem
              key={post.slug}
              post={post}
              showDivider={index < categoryPosts.length - 1}
            />
          ))}
        </div>
      ) : (
        <p className="blog-body mt-6" style={{ color: "var(--blog-muted-foreground)" }}>
          该分类下暂无文章，敬请期待。
        </p>
      )}
    </TwoColumn>
  );
}
