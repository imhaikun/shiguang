import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Monitor, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "首页", end: true },
  { to: "/category/tutorial", label: "教程系列", end: false },
  { to: "/category/pitfall", label: "踩坑实录", end: false },
  { to: "/category/tools", label: "工具推荐", end: false },
  { to: "/category/diary", label: "折腾日记", end: false },
  { to: "/about", label: "关于", end: false },
];

const themeOptions = [
  { mode: "light" as const, label: "亮色模式", icon: Sun },
  { mode: "dark" as const, label: "暗色模式", icon: Moon },
  { mode: "auto" as const, label: "跟随系统", icon: Monitor },
];

export default function Header() {
  const { mode, isDark, toggleMode, setMode } = useTheme();
  const { settings, loaded, loadSettings } = useSiteSettings();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (!loaded) {
    void loadSettings();
  }

  const getCurrentIcon = () => {
    if (mode === "auto") return Monitor;
    return isDark ? Moon : Sun;
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 no-underline transition-opacity hover:opacity-80"
        >
          <div className="h-12 w-12 shrink-0">
            <svg viewBox="0 0 64 64" className="h-full w-full">
              <rect x="8" y="12" width="48" height="44" rx="14" fill="currentColor" style={{ color: isDark ? "#34d399" : "#0F766E" }}/>
              <rect x="16" y="22" width="32" height="6" rx="3" fill="#ffffff"/>
              <rect x="16" y="32" width="32" height="6" rx="3" fill="#ffffff"/>
              <rect x="16" y="42" width="32" height="6" rx="3" fill="#ffffff"/>
              <path d="M40 10 Q48 2 56 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" style={{ color: isDark ? "#34d399" : "#0F766E" }}/>
              <path d="M42 14 Q48 6 54 14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" style={{ color: isDark ? "#34d399" : "#0F766E" }}/>
            </svg>
          </div>
          <div className="flex flex-col justify-center items-center">
            <span className="font-display text-xl font-semibold tracking-tight leading-tight" style={{ color: "var(--blog-foreground)", letterSpacing: "0.05em" }}>
              那斯小棧
            </span>
            <span className="text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: "var(--blog-muted)" }}>
              NAS IS LIFE
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-5 sm:gap-8">
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              aria-label="切换主题"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50"
            >
              {getCurrentIcon() === Monitor ? (
                <Monitor className="h-4 w-4" />
              ) : getCurrentIcon() === Sun ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 w-36 rounded-md border border-border bg-popover p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2"
                >
                  {themeOptions.map((option) => (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => {
                        setMode(option.mode);
                        setShowThemeMenu(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        mode === option.mode
                          ? "bg-primary/10 text-primary"
                          : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => toggleMode()}
            aria-label="切换主题"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50 active:scale-95"
          >
            {getCurrentIcon() === Monitor ? (
              <Monitor className="h-4 w-4" />
            ) : getCurrentIcon() === Sun ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="菜单"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50 active:scale-95"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed inset-x-0 top-16 z-50 bg-background border-b border-border shadow-lg">
            <nav className="flex flex-col py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    cn(
                      "px-6 py-3 text-base transition-colors no-underline",
                      isActive
                        ? "text-primary font-medium bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
