import { FileText, Tag, Calendar, Clock } from "lucide-react";
import { getAllPosts, getAllTags } from "@/data/posts";

const statCards = [
  {
    icon: FileText,
    label: "文章总数",
    value: 0,
    color: "var(--blog-primary)",
  },
  {
    icon: Tag,
    label: "标签数量",
    value: 0,
    color: "#2563eb",
  },
  {
    icon: Calendar,
    label: "本月发布",
    value: 0,
    color: "#16a34a",
  },
  {
    icon: Clock,
    label: "最后更新",
    value: "-",
    color: "#d97706",
  },
];

export default function Dashboard() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const now = new Date();
  const thisMonthPosts = posts.filter(
    (p) =>
      new Date(p.date).getMonth() === now.getMonth() &&
      new Date(p.date).getFullYear() === now.getFullYear()
  );
  const lastUpdated = posts.length > 0 ? posts[0].date : "-";

  const stats = [
    { ...statCards[0], value: posts.length },
    { ...statCards[1], value: tags.length },
    { ...statCards[2], value: thisMonthPosts.length },
    { ...statCards[3], value: lastUpdated },
  ];

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="blog-h2" style={{ margin: 0 }}>
          仪表盘
        </h2>
        <p className="blog-small mt-1" style={{ color: "var(--blog-muted)" }}>
          欢迎回来，查看博客概览
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-5"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="blog-caption mb-1">{stat.label}</p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                <stat.icon
                  className="h-5 w-5"
                  style={{ color: stat.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-lg p-5"
          style={{
            background: "var(--blog-card)",
            border: "1px solid var(--blog-border)",
          }}
        >
          <h3 className="blog-h3 mb-4" style={{ margin: 0 }}>
            最近文章
          </h3>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.slug}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--blog-foreground)" }}
                  >
                    {post.title}
                  </p>
                  <p className="blog-caption">{post.date}</p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: "var(--blog-border)",
                    color: "var(--blog-muted-foreground)",
                  }}
                >
                  {post.tags.length} 标签
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-lg p-5"
          style={{
            background: "var(--blog-card)",
            border: "1px solid var(--blog-border)",
          }}
        >
          <h3 className="blog-h3 mb-4" style={{ margin: 0 }}>
            标签分布
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const count = posts.filter((p) => p.tags.includes(tag)).length;
              return (
                <span
                  key={tag}
                  className="blog-caption"
                  style={{
                    padding: "4px 12px",
                    border: "1px solid var(--blog-border)",
                    borderRadius: "var(--blog-radius-sm)",
                    color: "var(--blog-muted-foreground)",
                  }}
                >
                  {tag} <span style={{ color: "var(--blog-primary)" }}>{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
