import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Tag as TagIcon, X } from "lucide-react";
import { formatLongDate } from "@/data/posts";
import { usePosts } from "@/hooks/usePosts";
import { useTheme } from "@/hooks/useTheme";
import TableOfContents from "@/components/TableOfContents";
import { addHeadingIds } from "@/utils/headingIds";

import githubLightCss from "highlight.js/styles/github.css?raw";
import githubDarkCss from "highlight.js/styles/github-dark.css?raw";

export default function ArticleDetail() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { isDark } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const hljsStyleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!hljsStyleRef.current) {
      hljsStyleRef.current = document.createElement("style");
      hljsStyleRef.current.id = "hljs-dynamic-theme";
      document.head.appendChild(hljsStyleRef.current);
    }
    hljsStyleRef.current.textContent = isDark ? githubDarkCss : githubLightCss;
  }, [isDark]);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    const img = e.currentTarget;
    setPreviewImage(img.src);
  }, []);

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

  const processCodeBlocks = useCallback((container: HTMLElement) => {
    container.querySelectorAll(".code-block-wrapper").forEach((wrapper) => {
      const selector = wrapper.querySelector(".code-lang-selector");
      if (selector) selector.remove();
      const pre = wrapper.querySelector("pre");
      if (pre) {
        wrapper.parentNode?.insertBefore(pre, wrapper);
      }
      wrapper.remove();
    });

    container.querySelectorAll(".code-lang-selector").forEach((s) => s.remove());

    const pres = container.querySelectorAll("pre");
    console.log("processCodeBlocks: found pre elements count:", pres.length);
    if (pres.length === 0) return;

    Promise.all([
      import("highlight.js"),
      import("highlight.js/lib/languages/python"),
      import("highlight.js/lib/languages/javascript"),
      import("highlight.js/lib/languages/typescript"),
      import("highlight.js/lib/languages/bash"),
      import("highlight.js/lib/languages/json"),
      import("highlight.js/lib/languages/sql"),
      import("highlight.js/lib/languages/go"),
      import("highlight.js/lib/languages/rust"),
      import("highlight.js/lib/languages/java"),
      import("highlight.js/lib/languages/xml"),
      import("highlight.js/lib/languages/css"),
      import("highlight.js/lib/languages/markdown"),
      import("highlight.js/lib/languages/yaml"),
    ]).then(([main, python, javascript, typescript, bash, json, sql, go, rust, java, xml, css, markdown, yaml]) => {
      console.log("processCodeBlocks: hljs loaded successfully");
      const hljs = main.default;
      hljs.registerLanguage("python", python.default);
      hljs.registerLanguage("javascript", javascript.default);
      hljs.registerLanguage("typescript", typescript.default);
      hljs.registerLanguage("bash", bash.default);
      hljs.registerLanguage("json", json.default);
      hljs.registerLanguage("sql", sql.default);
      hljs.registerLanguage("go", go.default);
      hljs.registerLanguage("rust", rust.default);
      hljs.registerLanguage("java", java.default);
      hljs.registerLanguage("html", xml.default);
      hljs.registerLanguage("css", css.default);
      hljs.registerLanguage("yaml", yaml.default);
      hljs.registerLanguage("markdown", markdown.default);

      console.log("processCodeBlocks: processing pres count:", pres.length);
      pres.forEach((pre) => {
        const codeEl = pre.querySelector("code");
        if (!codeEl) {
          console.log("processCodeBlocks: pre has no code element");
          return;
        }

        if (pre.parentElement?.classList.contains("code-block-container")) {
          console.log("processCodeBlocks: pre already in code-block-container");
          return;
        }

        const lang = (codeEl as HTMLElement).getAttribute("data-language") || "plaintext";
        const rawCode = codeEl.textContent || "";

        const blockContainer = document.createElement("div");
        blockContainer.className = "code-block-container";

        const header = document.createElement("div");
        header.className = "code-block-header";

        const langSpan = document.createElement("span");
        langSpan.className = "code-block-lang";
        langSpan.textContent = lang || "plaintext";

        const copyBtn = document.createElement("button");
        copyBtn.className = "code-block-copy";
        copyBtn.type = "button";
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>复制</span>`;

        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(rawCode).then(() => {
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>已复制</span>`;
            copyBtn.classList.add("copied");
            setTimeout(() => {
              copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>复制</span>`;
              copyBtn.classList.remove("copied");
            }, 2000);
          });
        });

        header.appendChild(langSpan);
        header.appendChild(copyBtn);

        const body = document.createElement("div");
        body.className = "code-block-body";

        const lines = rawCode.split("\n");
        const lineNumbers = document.createElement("div");
        lineNumbers.className = "code-block-line-numbers";
        lines.forEach((_, i) => {
          const num = document.createElement("span");
          num.className = "code-block-line-number";
          num.textContent = String(i + 1);
          lineNumbers.appendChild(num);
        });

        const newPre = document.createElement("pre");
        const newCode = document.createElement("code");

        if (lang && lang !== "plaintext") {
          try {
            const result = hljs.highlight(rawCode, { language: lang });
            newCode.innerHTML = result.value;
            newCode.className = `hljs language-${lang}`;
          } catch {
            newCode.textContent = rawCode;
            newCode.className = "hljs";
          }
        } else {
          newCode.textContent = rawCode;
          newCode.className = "hljs";
        }

        newPre.appendChild(newCode);
        body.appendChild(lineNumbers);
        body.appendChild(newPre);

        blockContainer.appendChild(header);
        blockContainer.appendChild(body);

        pre.parentNode?.replaceChild(blockContainer, pre);
      });
    });
  }, []);

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

    const remainingImages = container.querySelectorAll("img");
    remainingImages.forEach((img) => {
      (img as HTMLImageElement).style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        setPreviewImage((img as HTMLImageElement).src);
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

  useEffect(() => {
    if (contentRef.current && post) {
      const el = contentRef.current;
      console.log("ArticleDetail: contentRef.current has content:", el.innerHTML.length > 0);
      console.log("ArticleDetail: pre count before processing:", el.querySelectorAll("pre").length);
      const timer = setTimeout(() => {
        console.log("ArticleDetail: processing after timeout, pre count:", el.querySelectorAll("pre").length);
        processArticleImages(el);
        processCodeBlocks(el);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [post, processArticleImages, processCodeBlocks]);

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
          {post.tags.map((tag) => (
            <Link
              key={tag}
              to={`/tag/${encodeURIComponent(tag)}`}
              className="blog-caption inline-flex items-center gap-1 no-underline transition-colors hover:text-primary"
              style={{
                padding: "3px 10px",
                border: "1px solid var(--blog-border)",
                borderRadius: "var(--blog-radius-sm)",
                color: "var(--blog-muted-foreground)",
              }}
            >
              <TagIcon className="h-3 w-3" />
              {tag}
            </Link>
          ))}
        </div>
      </header>

      {/* 正文区域 */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 文章内容 */}
        <div className="flex-1">
          <div
            className="prose-editorial"
            dangerouslySetInnerHTML={{ __html: addHeadingIds(post.content) }}
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
