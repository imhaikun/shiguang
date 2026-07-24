import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Footer() {
  const { settings, loaded, loadSettings } = useSiteSettings();

  useEffect(() => {
    if (!loaded) {
      void loadSettings();
    }
  }, [loaded, loadSettings]);

  return (
    <footer className="border-t border-border mt-10">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col items-center justify-center gap-1.5">
        <span className="blog-caption">
          &copy; 2026{" "}
          <Link to="/" className="hover:text-primary transition-colors no-underline">
            {settings.title}
          </Link>{" "}
          &middot; 使用{" "}
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors no-underline">
            React
          </a>{" "}
          搭建
        </span>
      </div>
    </footer>
  );
}
