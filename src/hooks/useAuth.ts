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
}

const mockUser: User = {
  id: "1",
  username: "admin",
  email: "admin@shiguang.dev",
  role: "admin",
};

const mockToken = "shiguang-admin-token-2026";

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (username === "admin" && password === "admin") {
      localStorage.setItem("auth_token", mockToken);
      localStorage.setItem("auth_user", JSON.stringify(mockUser));
      set({ user: mockUser, token: mockToken, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

const savedToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
const savedUser = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;

if (savedToken && savedUser) {
  useAuth.setState({
    user: JSON.parse(savedUser),
    token: savedToken,
    isAuthenticated: true,
  });
}
