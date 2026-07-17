import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";
import { usePosts } from "@/hooks/usePosts";

export default function PostList() {
  const navigate = useNavigate();
  const { posts, loaded, loadPosts, deletePost } = usePosts();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadPosts();
  }, [loaded, loadPosts]);

  const handleDelete = async (slug: string) => {
    setDeletingId(slug);
    const ok = await deletePost(slug);
    if (ok) {
      setTimeout(() => {
        setDeletingId(null);
        setConfirmDelete(null);
      }, 300);
    } else {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="blog-h2" style={{ margin: 0 }}>
            文章管理
          </h2>
          <p className="blog-small mt-1" style={{ color: "var(--blog-muted)" }}>
            管理博客文章，支持新增、编辑和删除
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/posts/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--blog-primary)" }}
        >
          <Plus className="h-4 w-4" />
          新增文章
        </button>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "var(--blog-card)",
          border: "1px solid var(--blog-border)",
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "2px solid var(--blog-border)" }}>
              <th
                className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                标题
              </th>
              <th
                className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                日期
              </th>
              <th
                className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                标签
              </th>
              <th
                className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--blog-muted-foreground)" }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.slug}
                style={{
                  borderBottom: "1px solid var(--blog-border)",
                  opacity: deletingId === post.slug ? 0 : 1,
                  transform: deletingId === post.slug ? "translateX(-20px)" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                <td className="px-6 py-4">
                  <p
                    className="font-medium text-sm"
                    style={{ color: "var(--blog-foreground)" }}
                  >
                    {post.title}
                  </p>
                  <p className="blog-caption mt-1">
                    {post.featured && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          color: "var(--blog-primary)",
                        }}
                      >
                        置顶
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--blog-muted)" }} />
                    <span className="blog-caption">{post.date}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" style={{ color: "var(--blog-muted)" }} />
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: "var(--blog-border)",
                            color: "var(--blog-muted-foreground)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs text-muted">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/post/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      title="预览"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => navigate(`/admin/posts/edit/${post.slug}`)}
                      className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      title="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {confirmDelete === post.slug ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-error">确认删除？</span>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="p-2 rounded-md text-white"
                          style={{ background: "#dc2626" }}
                          title="确认删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="取消"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(post.slug)}
                        className="p-2 rounded-md text-muted-foreground hover:text-error hover:bg-error/5 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="py-12 text-center">
            <p className="blog-body">暂无文章，点击上方按钮新增</p>
          </div>
        )}
      </div>
    </div>
  );
}
