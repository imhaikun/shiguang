import { Link } from "react-router-dom";
import { Mail, Github, ArrowRight } from "lucide-react";

const skills = ["React", "TypeScript", "设计系统", "排版", "写作", "阅读"];

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14 animate-fade-in">
      <header className="flex flex-col items-center text-center mb-10">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white font-display text-3xl font-semibold mb-5 shadow-sm"
          style={{
            background: "linear-gradient(135deg, var(--blog-primary), #e8b89a)",
          }}
        >
          屿
        </div>
        <h1 className="blog-h1 mb-2" style={{ fontSize: "2.25rem" }}>
          林屿
        </h1>
        <p className="blog-caption">写代码，也写生活</p>
      </header>

      <div className="prose-editorial">
        <p>
          你好，我是林屿。一名前端工程师，也是一个喜欢在深夜写字的人。
        </p>
        <p>
          这个博客叫"拾光笔记"，取"拾起时光"之意。在这里，我会记录一些关于代码、设计与生活的碎片——它们或许零散，但都是真实思考过的痕迹。
        </p>
        <blockquote>
          相信慢的力量，相信文字的温度，相信把一件事做到克制，本身就是一种美。
        </blockquote>
        <h2>关于写作</h2>
        <p>
          我更愿意把每一篇文章当作一封写给未来的信。不追求频率，只希望每次落笔，都比上一次更诚实一点。如果你在这里读到了什么让你停顿片刻的句子，那就是我最大的幸运。
        </p>
        <h2>关于这个站点</h2>
        <p>
          "拾光笔记"使用 React 与 Tailwind CSS 搭建，采用衬线标题与无衬线正文搭配的编辑式排版，主色是一种温暖的赤陶土。它支持亮色与暗色两种主题，并在不同屏幕尺寸下自适应。希望这里的阅读体验，能让你愿意多停留一会儿。
        </p>
      </div>

      <hr
        className="my-10 border-0 border-t"
        style={{ borderColor: "var(--blog-border)" }}
      />

      {/* 兴趣 / 技能 */}
      <section className="mb-10">
        <h3
          className="blog-caption font-semibold uppercase mb-4"
          style={{
            color: "var(--blog-muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          兴趣与技能
        </h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="blog-caption"
              style={{
                padding: "4px 12px",
                border: "1px solid var(--blog-border)",
                borderRadius: "var(--blog-radius-sm)",
                color: "var(--blog-muted-foreground)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* 联系方式 */}
      <section>
        <h3
          className="blog-caption font-semibold uppercase mb-4"
          style={{
            color: "var(--blog-muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          联系方式
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:linyu@shiguang.dev"
            className="inline-flex items-center gap-2 rounded-md blog-small no-underline transition-colors hover:text-primary hover:border-primary/50"
            style={{
              padding: "10px 16px",
              border: "1px solid var(--blog-border)",
              color: "var(--blog-muted-foreground)",
            }}
          >
            <Mail className="h-4 w-4" /> linyu@shiguang.dev
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md blog-small no-underline transition-colors hover:text-primary hover:border-primary/50"
            style={{
              padding: "10px 16px",
              border: "1px solid var(--blog-border)",
              color: "var(--blog-muted-foreground)",
            }}
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
        </div>
      </section>

      <div className="mt-10">
        <Link
          to="/"
          className="blog-small arrow-link inline-flex items-center gap-1 no-underline font-medium transition-opacity hover:opacity-75"
          style={{ color: "var(--blog-primary)" }}
        >
          回到首页，开始阅读 <ArrowRight className="arrow h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
