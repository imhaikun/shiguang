import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
  localStorage.setItem("theme", theme);
};

export const useTheme = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  isDark: getInitialTheme() === "dark",
  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    applyTheme(next);
    set({ theme: next, isDark: next === "dark" });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme, isDark: theme === "dark" });
  },
}));

// 模块加载时立即应用初始主题，避免首屏闪烁
if (typeof window !== "undefined") {
  applyTheme(useTheme.getState().theme);
}
