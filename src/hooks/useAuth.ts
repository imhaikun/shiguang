import { create } from "zustand";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, "username" | "email">>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const STORAGE_KEYS = {
  user: "auth_user",
  token: "auth_token",
};

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "请求失败");
  }
  return data;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    try {
      const result = await fetchApi<{ success: boolean; user: User }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (result.success && result.user) {
        localStorage.setItem(STORAGE_KEYS.token, "shiguang-admin-token");
        saveUser(result.user);
        set({ user: result.user, token: "shiguang-admin-token", isAuthenticated: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return false;
    try {
      const result = await fetchApi<{ success: boolean; user: User }>(`/api/users/${user.id}/profile`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (result.success && result.user) {
        saveUser(result.user);
        set({ user: result.user });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const user = get().user;
    if (!user) return false;
    try {
      const result = await fetchApi<{ success: boolean }>(`/api/users/${user.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return result.success;
    } catch {
      return false;
    }
  },
}));

// 模块加载时立即恢复登录态
if (typeof window !== "undefined") {
  const savedToken = localStorage.getItem(STORAGE_KEYS.token);
  const savedUser = getStoredUser();
  if (savedToken && savedUser) {
    useAuth.setState({
      user: savedUser,
      token: savedToken,
      isAuthenticated: true,
    });
  }
}
