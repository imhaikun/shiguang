import { Link, NavLink } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "首页", end: true },
  { to: "/archives", label: "归档", end: false },
  { to: "/about", label: "关于", end: false },
];

export default function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-2xl font-semibold tracking-tight text-foreground no-underline transition-opacity hover:opacity-80"
          style={{ letterSpacing: "-0.01em" }}
        >
          那斯棧
        </Link>

        <nav className="flex items-center gap-5 sm:gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "text-sm transition-colors no-underline",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
