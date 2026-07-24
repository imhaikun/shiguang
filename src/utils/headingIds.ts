/**
 * 为 HTML 中的 h1-h6 添加 id 属性。
 * slug 规则与 headings.ts 的 extractHeadings 保持一致。
 */
export function addHeadingIds(html: string, _markdown?: string): string {
  const slugs = new Map<string, number>();

  return html.replace(/<h([1-6])([^>]*)>(.*?)<\/h\1>/gi, (_match, level, _attrs, content) => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const id = slugify(text, slugs);
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
}

function slugifyBase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugify(text: string, slugs: Map<string, number>): string {
  const base = slugifyBase(text);
  const count = slugs.get(base) ?? 0;
  slugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}