import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "仪表盘", end: true },
  { to: "/admin/posts", icon: FileText, label: "文章管理", end: false },
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
          <div>
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
    </div>
  );
}
