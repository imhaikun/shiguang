export default function Footer() {
  return (
    <footer className="border-t border-border mt-10">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col items-center justify-center gap-1.5">
        <span className="blog-caption">
          &copy; 2026 那斯棧 &middot; 使用 React 搭建
        </span>
        <span className="blog-caption" style={{ color: "var(--blog-muted)" }}>
          写代码，也写生活
        </span>
      </div>
    </footer>
  );
}
