import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Tag,
  Folder,
  LogOut,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import BackToTop from "@/components/BackToTop";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "仪表盘", end: true },
  { to: "/admin/posts", icon: FileText, label: "文章管理", end: false },
  { to: "/admin/categories", icon: Folder, label: "分类管理", end: false },
  { to: "/admin/tags", icon: Tag, label: "标签管理", end: false },
  { to: "/admin/settings", icon: Settings, label: "设置", end: false },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className="w-64 flex-shrink-0 border-r border-border bg-card"
        style={{ background: "var(--blog-card)" }}
      >
        <div className="p-6 border-b border-border">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-display font-semibold"
            style={{ color: "var(--blog-primary)" }}
          >
            <ArrowLeft className="h-5 w-5" />
            回到前台
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors no-underline",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-border/50"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg
              className="h-7 w-9 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: "var(--blog-primary)" }}
            >
              <rect x="2" y="2" width="20" height="18" rx="5" stroke="currentColor" strokeWidth="2"/>
              <line x1="7" y1="20" x2="7" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="17" y1="20" x2="17" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="5" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="13" y1="5" x2="13" y2="17" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="18" y1="5" x2="18" y2="17" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="5" cy="15" r="1.5" fill="currentColor"/>
              <circle cx="10.5" cy="7" r="1.5" fill="currentColor"/>
              <circle cx="15.5" cy="7" r="1.5" fill="currentColor"/>
            </svg>
            <h1 className="blog-h3" style={{ margin: 0 }}>
              后台管理
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="blog-small font-medium" style={{ color: "var(--blog-foreground)" }}>
              {user?.username}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <BackToTop />
    </div>
  );
}
