import { create } from "zustand";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme") as ThemeMode | null;
  if (saved === "light" || saved === "dark" || saved === "auto") return saved;
  return "light";
};

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getEffectiveTheme = (mode: ThemeMode): "light" | "dark" => {
  if (mode === "auto") return getSystemTheme();
  return mode;
};

const applyTheme = (theme: "light" | "dark") => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
};

let mediaQueryListener: (e: MediaQueryListEvent) => void | null = null;

export const useTheme = create<ThemeState>((set, get) => {
  const initialMode = getInitialMode();
  const initialTheme = getEffectiveTheme(initialMode);

  if (typeof window !== "undefined") {
    mediaQueryListener = (e) => {
      const mode = get().mode;
      if (mode === "auto") {
        const newTheme = e.matches ? "dark" : "light";
        applyTheme(newTheme);
        set({ isDark: newTheme === "dark" });
      }
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", mediaQueryListener);
  }

  return {
    mode: initialMode,
    isDark: initialTheme === "dark",
    toggleMode: () => {
      const modes: ThemeMode[] = ["light", "dark", "auto"];
      const currentIndex = modes.indexOf(get().mode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      get().setMode(nextMode);
    },
    setMode: (mode) => {
      localStorage.setItem("theme", mode);
      const effectiveTheme = getEffectiveTheme(mode);
      applyTheme(effectiveTheme);
      set({ mode, isDark: effectiveTheme === "dark" });
    },
  };
});

if (typeof window !== "undefined") {
  applyTheme(getEffectiveTheme(useTheme.getState().mode));
}
