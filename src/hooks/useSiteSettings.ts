import { create } from "zustand";

interface SiteSettings {
  title: string;
  description: string;
}

interface SiteSettingsState {
  settings: SiteSettings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (title: string, description: string) => Promise<boolean>;
}

function getApiBase(): string {
  if (import.meta.env.DEV) return "";
  return "https://api.202616.xyz";
}

const API_BASE = /* @__NOINLINE */ getApiBase();

const DEFAULT_SETTINGS: SiteSettings = {
  title: "那斯小棧",
  description: "在代码与硬盘的缝隙里，记录每一次 NAS 折腾的踩坑与顿悟。",
};

export const useSiteSettings = create<SiteSettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  loadSettings: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/site-settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        set({ settings: data.settings, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
  saveSettings: async (title: string, description: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/site-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.success) {
        set({ settings: data.settings });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
