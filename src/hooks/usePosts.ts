import { create } from "zustand";
import type { Post } from "@/data/posts";

function getApiBase(): string {
  if (import.meta.env.DEV) return "";
  return "https://api.202616.xyz";
}

const API_BASE = /* @__NOINLINE */ getApiBase();

interface UsePostsState {
  posts: Post[];
  loaded: boolean;
  loadPosts: () => Promise<void>;
  loadAllPosts: () => Promise<void>;
  createPost: (data: Omit<Post, "slug">) => Promise<Post | null>;
  updatePost: (slug: string, data: Partial<Omit<Post, "slug">>) => Promise<Post | null>;
  deletePost: (slug: string) => Promise<boolean>;
  getPostBySlug: (slug: string) => Post | undefined;
  getFeaturedPost: () => Post | undefined;
  getNonFeaturedPosts: () => Post[];
  getPostsByTag: (tag: string) => Post[];
  getRandomPosts: (count: number) => Post[];
  getAllTags: () => string[];
  searchPosts: (keyword: string) => Post[];
  getArchives: () => { year: number; month: number; posts: Post[] }[];
  getAdjacentPosts: (slug: string) => { prev: Post | undefined; next: Post | undefined };
}

export const usePosts = create<UsePostsState>((set, get) => ({
  posts: [],
  loaded: false,

  loadPosts: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`);
      const data = await res.json();
      if (data.success && data.posts) {
        set({ posts: data.posts, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  loadAllPosts: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/all`);
      const data = await res.json();
      if (data.success && data.posts) {
        set({ posts: data.posts, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  createPost: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.post) {
        set((state) => {
          const newPosts = [...state.posts, result.post].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          return { posts: newPosts };
        });
        return result.post;
      }
      return null;
    } catch {
      return null;
    }
  },

  updatePost: async (slug, data) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.post) {
        set((state) => ({
          posts: state.posts.map((p) => (p.slug === slug ? result.post : p)),
        }));
        return result.post;
      }
      return null;
    } catch {
      return null;
    }
  },

  deletePost: async (slug) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        set((state) => ({
          posts: state.posts.filter((p) => p.slug !== slug),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getPostBySlug: (slug) => {
    return get().posts.find((p) => p.slug === slug);
  },

  getFeaturedPost: () => {
    return get().posts.find((p) => p.featured);
  },

  getNonFeaturedPosts: () => {
    return get().posts.filter((p) => !p.featured);
  },

  getPostsByTag: (tag) => {
    const trimmedTag = tag.trim();
    return get().posts.filter((p) => p.tags.some((t) => t.trim() === trimmedTag));
  },

  getRandomPosts: (count = 5) => {
    const shuffled = [...get().posts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  getAllTags: () => {
    const tagSet = new Set<string>();
    get().posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t.trim())));
    return Array.from(tagSet);
  },

  searchPosts: (keyword) => {
    const k = keyword.trim().toLowerCase();
    if (!k) return [];
    return get().posts.filter((p) =>
      [p.title, p.excerpt, p.content].join(" ").toLowerCase().includes(k)
    );
  },

  getArchives: () => {
    const sorted = get().posts;
    const groups: Record<string, { year: number; month: number; posts: Post[] }> = {};
    sorted.forEach((p) => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!groups[key]) {
        groups[key] = { year: d.getFullYear(), month: d.getMonth() + 1, posts: [] };
      }
      groups[key].posts.push(p);
    });
    return Object.values(groups).sort(
      (a, b) =>
        new Date(b.year, b.month - 1).getTime() - new Date(a.year, a.month - 1).getTime()
    );
  },

  getAdjacentPosts: (slug) => {
    const sorted = [...get().posts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const index = sorted.findIndex((p) => p.slug === slug);
    return {
      next: index > 0 ? sorted[index - 1] : undefined,
      prev: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined,
    };
  },
}));
