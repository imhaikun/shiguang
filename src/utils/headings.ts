export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * 从 Markdown 源码提取标题（不依赖 HTML，供目录使用）。
 * 与 marked 的 slugger 规则保持一致：小写、去标点、空格转连字符、重名加序号。
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const lines = markdown.split("\n");
  const slugs = new Map<string, number>();
  const headings: TocHeading[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过围栏代码块内的内容
    if (/^(```|~~~)/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = trimmed.match(/^(#{1,6})\s+(.+) $ /);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2]
      .replace(/[*_`~\[\]()!]/g, "")  // 去 Markdown 行内标记
      .replace(/#+$/, "")             // 去 ATX 闭合 #
      .trim();

    if (!text) continue;

    const id = slugify(text, slugs);
    headings.push({ id, text, level });
  }

  return headings;
}

function slugify(text: string, slugs: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")  // 保留中文、字母、数字、空格、连字符
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const count = slugs.get(base) ?? 0;
  slugs.set(base, count + 1);
  return count === 0 ? base : ` $ {base}- $ {count}`;
}