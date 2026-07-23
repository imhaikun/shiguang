export function addHeadingIds(html: string): string {
  if (!html) return html;

  const headingRegex = /<h([1-3])([^>]*)>([^<]+)<\/h[1-3]>/gi;

  return html.replace(headingRegex, (match, level, attrs, text) => {
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    const id = cleanText
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, "");

    return `<h${level}${attrs} id="toc-${id}">${text}</h${level}>`;
  });
}