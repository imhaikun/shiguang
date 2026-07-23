import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Tag as TagIcon, X } from "lucide-react";
import { formatLongDate } from "@/data/posts";
import { usePosts } from "@/hooks/usePosts";
import { useTheme } from "@/hooks/useTheme";
import TableOfContents from "@/components/TableOfContents";
import { addHeadingIds } from "@/utils/headingIds";
import { markdownToHtml } from "@/utils/markdownToHtml";
import { initCodeBlocks } from "@/utils/initCodeBlocks";

const tagColorPalette = [
  { text: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.15)" },
  { text: "#ea580c", bg: "rgba(234,88,12,0.08)", border: "rgba(234,88,12,0.15)" },
  { text: "#ca8a04", bg: "rgba(202,138,4,0.08)", border: "rgba(202,138,4,0.15)" },
  { text: "#65a30d", bg: "rgba(101,163,13,0.08)", border: "rgba(101,163,13,0.15)" },
  { text: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.15)" },
  { text: "#0d9488", bg: "rgba(13,148,136,0.08)", border: "rgba(13,148,136,0.15)" },
  { text: "#0284c7", bg: "rgba(2,132,199,0.08)", border: "rgba(2,132,199,0.15)" },
  { text: "#2563eb", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.15)" },
  { text: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.15)" },
  { text: "#c026d3", bg: "rgba(192,38,211,0.08)", border: "rgba(192,38,211,0.15)" },
  { text: "#db2777", bg: "rgba(219,39,119,0.08)", border: "rgba(219,39,119,0.15)" },
  { text: "#e11d48", bg: "rgba(225,29,72,0.08)", border: "rgba(225,29,72,0.15)" },
];

const getTagColorIndex = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % tagColorPalette.length;
};

const getTagStyle = (tag: string) => {
  const color = tagColorPalette[getTagColorIndex(tag)];
  return color;
};

export default function ArticleDetail() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const { isDark } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const highlighterRef = useRef<((code: string, language: string) => string | null) | null>(null);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewImage) {
        closePreview();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, closePreview]);

  const processArticleImages = useCallback((container: HTMLElement) => {
    const allImages = Array.from(container.querySelectorAll("img"));
    if (allImages.length === 0) return;

    const imageSectionGroups: HTMLImageElement[][] = [];
    let currentSectionImages: HTMLImageElement[] = [];

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (/^H[1-6]$/.test(el.tagName) && currentSectionImages.length > 0) {
          imageSectionGroups.push([...currentSectionImages]);
          currentSectionImages = [];
          return;
        }
        if (el.tagName === "IMG") {
          currentSectionImages.push(el as HTMLImageElement);
          return;
        }
      }
      for (const child of node.childNodes) {
        walk(child);
      }
    };
    walk(container);
    if (currentSectionImages.length > 0) {
      imageSectionGroups.push([...currentSectionImages]);
    }

    for (const sectionImages of imageSectionGroups) {
      if (sectionImages.length < 2) continue;

      const firstImg = sectionImages[0];
      const gallery = document.createElement("div");
      gallery.className = "article-image-gallery";

      const displayImages = sectionImages.slice(0, 9);
      const extraCount = sectionImages.length - 9;

      displayImages.forEach((imgEl, idx) => {
        const item = document.createElement("div");
        item.className = "gallery-item";
        const newImg = document.createElement("img");
        newImg.src = imgEl.src;
        newImg.alt = imgEl.alt || "";
        newImg.addEventListener("click", () => setPreviewImage(imgEl.src));
        item.appendChild(newImg);

        if (idx === 8 && extraCount > 0) {
          const more = document.createElement("div");
          more.className = "gallery-more";
          more.textContent = `+${extraCount}`;
          item.appendChild(more);
        }

        gallery.appendChild(item);
      });

      const elementsToRemove: HTMLElement[] = [];
      for (const imgEl of sectionImages) {
        const parent = imgEl.closest("p, div, figure, figcaption");
        if (parent && parent.parentNode) {
          const textLen = (parent.textContent || "").trim().length;
          const imgsInParent = parent.querySelectorAll("img").length;
          if (textLen < 50 || imgsInParent > 0) {
            if (!elementsToRemove.includes(parent as HTMLElement)) {
              elementsToRemove.push(parent as HTMLElement);
            }
          } else {
            imgEl.remove();
          }
        } else {
          imgEl.remove();
        }
      }

      const firstParent = elementsToRemove[0];
      if (firstParent && firstParent.parentNode) {
        firstParent.parentNode.insertBefore(gallery, firstParent);
      }

      let cursor = gallery.nextElementSibling;
      let captionCount = 0;
      while (cursor && captionCount < sectionImages.length) {
        const next = cursor.nextElementSibling as HTMLElement | null;
        if (/^H[1-6]$/.test(cursor.tagName)) break;
        if ((cursor.tagName === "P" || cursor.tagName === "DIV") && !cursor.querySelector("img")) {
          const text = (cursor.textContent || "").trim();
          if (text.length > 0 && text.length < 60) {
            (cursor as HTMLElement).remove();
            captionCount++;
            cursor = next;
            continue;
          }
        }
        if (cursor.tagName === "BR" || (cursor.tagName === "P" && (cursor.textContent || "").trim().length === 0)) {
          (cursor as HTMLElement).remove();
          cursor = next;
          continue;
        }
        break;
      }

      for (const el of elementsToRemove) {
        if (el.parentNode) {
          el.remove();
        }
      }
    }

    // ← 改动③-a：幂等标记，防止重跑时重复绑监听
    const remainingImages = container.querySelectorAll("img");
    remainingImages.forEach((img) => {
      const image = img as HTMLImageElement;
      if (image.dataset.previewBound === "1") return;
      image.dataset.previewBound = "1";
      image.style.cursor = "zoom-in";
      image.addEventListener("click", () => {
        setPreviewImage(image.src);
      });
    });
  }, []);

  const { slug = "" } = useParams();
  const { loaded, loadPosts, getPostBySlug, getAdjacentPosts } = usePosts();

  useEffect(() => {
    if (!loaded) {
      loadPosts();
    }
  }, [loaded, loadPosts]);

  const post = getPostBySlug(slug);

  // ← 改动③-b：依赖加 contentKey，高亮重建正文后重跑图片处理
  useEffect(() => {
    if (contentRef.current && post) {
      const el = contentRef.current;
      processArticleImages(el);
    }
  }, [post, processArticleImages, contentKey]);

  // ← 改动②：依赖 [] → [contentKey]，加 cleanup 解绑
  useEffect(() => {
    const dispose = initCodeBlocks(highlighterRef.current ?? undefined);
    return dispose;
  }, [contentKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hljs = (await import("highlight.js/lib/core")).default;
      const [
        javascript,
        typescript,
        python,
        bash,
        shell,
        xml,
        css,
        json,
        markdown,
        sql,
        java,
        cpp,
        c,
        rust,
        go,
        yaml,
        dockerfile,
        php,
        ruby,
        swift,
        kotlin,
        lua,
        perl,
        r,
        objectivec,
        vim,
        nginx,
        graphql,
        ini,
      ] = await Promise.all([
        import("highlight.js/lib/languages/javascript"),
        import("highlight.js/lib/languages/typescript"),
        import("highlight.js/lib/languages/python"),
        import("highlight.js/lib/languages/bash"),
        import("highlight.js/lib/languages/shell"),
        import("highlight.js/lib/languages/xml"),
        import("highlight.js/lib/languages/css"),
        import("highlight.js/lib/languages/json"),
        import("highlight.js/lib/languages/markdown"),
        import("highlight.js/lib/languages/sql"),
        import("highlight.js/lib/languages/java"),
        import("highlight.js/lib/languages/cpp"),
        import("highlight.js/lib/languages/c"),
        import("highlight.js/lib/languages/rust"),
        import("highlight.js/lib/languages/go"),
        import("highlight.js/lib/languages/yaml"),
        import("highlight.js/lib/languages/dockerfile"),
        import("highlight.js/lib/languages/php"),
        import("highlight.js/lib/languages/ruby"),
        import("highlight.js/lib/languages/swift"),
        import("highlight.js/lib/languages/kotlin"),
        import("highlight.js/lib/languages/lua"),
        import("highlight.js/lib/languages/perl"),
        import("highlight.js/lib/languages/r"),
        import("highlight.js/lib/languages/objectivec"),
        import("highlight.js/lib/languages/vim"),
        import("highlight.js/lib/languages/nginx"),
        import("highlight.js/lib/languages/graphql"),
        import("highlight.js/lib/languages/ini"),
      ]);

      hljs.registerLanguage("javascript", javascript.default);
      hljs.registerLanguage("js", javascript.default);
      hljs.registerLanguage("typescript", typescript.default);
      hljs.registerLanguage("ts", typescript.default);
      hljs.registerLanguage("python", python.default);
      hljs.registerLanguage("py", python.default);
      hljs.registerLanguage("bash", bash.default);
      hljs.registerLanguage("shell", shell.default);
      hljs.registerLanguage("sh", shell.default);
      hljs.registerLanguage("html", xml.default);
      hljs.registerLanguage("xml", xml.default);
      hljs.registerLanguage("css", css.default);
      hljs.registerLanguage("json", json.default);
      hljs.registerLanguage("markdown", markdown.default);
      hljs.registerLanguage("md", markdown.default);
      hljs.registerLanguage("sql", sql.default);
      hljs.registerLanguage("java", java.default);
      hljs.registerLanguage("cpp", cpp.default);
      hljs.registerLanguage("c", c.default);
      hljs.registerLanguage("rust", rust.default);
      hljs.registerLanguage("rs", rust.default);
      hljs.registerLanguage("go", go.default);
      hljs.registerLanguage("golang", go.default);
      hljs.registerLanguage("yaml", yaml.default);
      hljs.registerLanguage("yml", yaml.default);
      hljs.registerLanguage("dockerfile", dockerfile.default);
      hljs.registerLanguage("php", php.default);
      hljs.registerLanguage("ruby", ruby.default);
      hljs.registerLanguage("rb", ruby.default);
      hljs.registerLanguage("swift", swift.default);
      hljs.registerLanguage("kotlin", kotlin.default);
      hljs.registerLanguage("kt", kotlin.default);
      hljs.registerLanguage("lua", lua.default);
      hljs.registerLanguage("perl", perl.default);
      hljs.registerLanguage("pl", perl.default);
      hljs.registerLanguage("r", r.default);
      hljs.registerLanguage("objectivec", objectivec.default);
      hljs.registerLanguage("objc", objectivec.default);
      hljs.registerLanguage("vim", vim.default);
      hljs.registerLanguage("nginx", nginx.default);
      hljs.registerLanguage("graphql", graphql.default);
      hljs.registerLanguage("gql", graphql.default);
      hljs.registerLanguage("ini", ini.default);

      if (!cancelled) {
        highlighterRef.current = (code: string, language: string) => {
          try {
            const result = hljs.highlight(code, {
              language: hljs.getLanguage(language) ? language : "plaintext",
              ignoreIllegals: true,
            });
            return result.value;
          } catch {
            return null;
          }
        };
        setContentKey((k) => k + 1);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="blog-h2 mb-4">文章未找到</h1>
        <p className="blog-body mb-6">你访问的文章可能已被移动或删除。</p>
        <Link
          to="/"
          className="blog-small inline-flex items-center gap-1 no-underline"
          style={{ color: "var(--blog-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>
      </div>
    );
  }

  const { prev, next } = getAdjacentPosts(slug);

  return (
    <article className="max-w-6xl mx-auto px-6 py-10 lg:py-14 animate-fade-in">
      {/* 返回链接 */}
      <Link
        to="/"
        className="blog-small arrow-link inline-flex items-center gap-1 no-underline mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--blog-muted-foreground)" }}
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      {/* 文章头部 */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4" style={{ color: "var(--blog-muted)" }} />
          <time className="blog-small">{formatLongDate(post.date)}</time>
        </div>
        <h1 className="blog-h1 mb-4" style={{ fontSize: "2.25rem" }}>
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => {
            const style = getTagStyle(tag);
            return (
              <Link
                key={tag}
                to={`/tag/${encodeURIComponent(tag)}`}
                className="blog-caption inline-flex items-center gap-1 no-underline rounded-full transition-all duration-200 hover:shadow-sm hover:scale-105"
                style={{
                  padding: "3px 10px",
                  background: style.bg,
                  color: style.text,
                  border: `1px solid ${style.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = style.text;
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = style.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = style.bg;
                  e.currentTarget.style.color = style.text;
                  e.currentTarget.style.borderColor = style.border;
                }}
              >
                <TagIcon className="h-3 w-3" />
                {tag}
              </Link>
            );
          })}
        </div>
      </header>

      {/* 正文区域 */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 文章内容 */}
        <div className="flex-1">
          <div
            key={contentKey}
            className="prose-editorial"
            dangerouslySetInnerHTML={{
              __html: addHeadingIds(
                markdownToHtml(post.content, { highlighter: highlighterRef.current ?? undefined }),
                post.content,
              ),
            }}
            ref={contentRef}
          />
        </div>

        {/* 目录 */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-8">
            <TableOfContents content={post.content} />
          </div>
        </aside>
      </div>

      {/* 分隔线 */}
      <hr className="my-10 border-0 border-t" style={{ borderColor: "var(--blog-border)" }} />

      {/* 上下篇导航 */}
      <nav className="flex flex-col sm:flex-row gap-4">
        {prev ? (
          <Link
            to={`/post/${prev.slug}`}
            className="flex-1 rounded-md p-4 no-underline transition-colors hover:border-primary/50 group"
            style={{
              border: "1px solid var(--blog-border)",
              background: "var(--blog-card)",
            }}
          >
            <span
              className="blog-caption inline-flex items-center gap-1 mb-1"
              style={{ color: "var(--blog-muted)" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 上一篇
            </span>
            <span
              className="blog-h3 block transition-colors group-hover:text-primary"
              style={{ color: "var(--blog-foreground)" }}
            >
              {prev.title}
            </span>
          </Link>
        ) : (
          <div
            className="flex-1 rounded-md p-4 opacity-40"
            style={{ border: "1px solid var(--blog-border)" }}
          >
            <span className="blog-caption inline-flex items-center gap-1 mb-1">
              <ChevronLeft className="h-3.5 w-3.5" /> 上一篇
            </span>
            <span className="blog-h3 block">没有更早的文章了</span>
          </div>
        )}
        {next ? (
          <Link
            to={`/post/${next.slug}`}
            className="flex-1 rounded-md p-4 text-right no-underline transition-colors hover:border-primary/50 group"
            style={{
              border: "1px solid var(--blog-border)",
              background: "var(--blog-card)",
            }}
          >
            <span
              className="blog-caption inline-flex items-center gap-1 mb-1"
              style={{ color: "var(--blog-muted)" }}
            >
              下一篇 <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <span
              className="blog-h3 block transition-colors group-hover:text-primary"
              style={{ color: "var(--blog-foreground)" }}
            >
              {next.title}
            </span>
          </Link>
        ) : (
          <div
            className="flex-1 rounded-md p-4 text-right opacity-40"
            style={{ border: "1px solid var(--blog-border)" }}
          >
            <span className="blog-caption inline-flex items-center gap-1 mb-1">
              下一篇 <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <span className="blog-h3 block">没有更新的文章了</span>
          </div>
        )}
      </nav>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300"
          style={{ backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)" }}
          onClick={closePreview}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full hover:transition-colors"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              color: isDark ? "#ffffff" : "#1e293b",
            }}
            onClick={closePreview}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}