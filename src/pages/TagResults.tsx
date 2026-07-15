import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TwoColumn from "@/components/TwoColumn";
import ArticleListItem from "@/components/ArticleListItem";
import { getPostsByTag } from "@/data/posts";

export default function TagResults() {
  const { tag = "" } = useParams();
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);

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
          共 {posts.length} 篇文章
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="flex flex-col mt-4">
          {posts.map((post, index) => (
            <ArticleListItem
              key={post.slug}
              post={post}
              showDivider={index < posts.length - 1}
            />
          ))}
        </div>
      ) : (
        <p className="blog-body mt-6">该标签下暂无文章。</p>
      )}
    </TwoColumn>
  );
}
