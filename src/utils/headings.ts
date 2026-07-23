export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(content: string): TocHeading[] {
  const slugs = new Map<string, number>();
  const headings: TocHeading[] = [];

  if (/<h[1-6]\b/i.test(content)) {
    const regex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const level = parseInt(match[1], 10);
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (!text) continue;
      const id = slugify(text, slugs);
      headings.push({ id, text, level });
    }
    return headings;
  }

  const lines = content.split("\n");
  let inCodeBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(```|~~~)/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2]
      .replace(/[*_`~\[\]()!]/g, "")
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
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const count = slugs.get(base) ?? 0;
  slugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}
