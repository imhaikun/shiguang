import { useEffect, useState, useCallback } from "react";
import { List } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const extractHeadings = useCallback((html: string) => {
    const headingRegex = /<h([1-3])[^>]*>([^<]+)<\/h[1-3]>/gi;
    const matches: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (text) {
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
          .replace(/^-|-$/g, "");
        matches.push({ id: `toc-${id}`, text, level });
      }
    }

    return matches;
  }, []);

  useEffect(() => {
    const extracted = extractHeadings(content);
    setHeadings(extracted);
  }, [content, extractHeadings]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            if (id) {
              setActiveId(id);
            }
          }
        });
      },
      { rootMargin: "-20% 0px -30% 0px", threshold: 0.1 }
    );

    document.querySelectorAll("[id^='toc-']").forEach((heading) => {
      observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <div
      className="rounded-md p-4"
      style={{
        background: "var(--blog-card)",
        border: "1px solid var(--blog-border)",
      }}
    >
      <div
        className="flex items-center gap-2 mb-3"
        style={{ color: "var(--blog-foreground)" }}
      >
        <List className="h-4 w-4" />
        <span className="font-semibold text-sm">目录</span>
      </div>
      <nav className="space-y-1 max-h-[400px] overflow-y-auto">
        {headings.map((heading, index) => (
          <button
            key={`${heading.id}-${index}`}
            onClick={() => handleClick(heading.id)}
            className="block w-full text-left transition-colors hover:text-primary"
            style={{
              color: activeId === heading.id ? "var(--blog-primary)" : "var(--blog-muted-foreground)",
              padding: "3px 8px",
              paddingLeft: `${(heading.level - 1) * 16 + 8}px`,
              fontSize: "13px",
              borderRadius: "4px",
              background: activeId === heading.id ? "var(--blog-primary)/5" : "transparent",
            }}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
}