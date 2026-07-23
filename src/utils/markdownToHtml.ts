export function markdownToHtml(text: string): string {
  if (!text) return "<p></p>";

  const trimmed = text.trim();
  
  // Already HTML, return as-is
  if (trimmed.startsWith("<")) {
    return text;
  }

  const lines = text.split("\n");
  const html: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(" ");
      const placeholder = "\x00INLINE_CODE_\x00";
      let processed = paragraphText
        .replace(/`([^`]+)`/g, (_, code) => `${placeholder}${code}${placeholder}`)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/~~(.*?)~~/g, "<del>$1</del>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      processed = processed.split(placeholder).map((part, i) => {
        if (i % 2 === 1) return `<code>${part}</code>`;
        return part;
      }).join("");
      html.push(`<p>${processed}</p>`);
      currentParagraph = [];
    }
  };

  let inCodeBlock = false;
  let codeLang = "";
  let codeContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const language = codeLang || "plaintext";
        const escapedContent = codeContent.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html.push(`<pre><code data-language="${language}">${escapedContent}</code></pre>`);
        inCodeBlock = false;
        codeLang = "";
        codeContent = [];
      } else {
        flushParagraph();
        inCodeBlock = true;
        codeLang = line.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      html.push(`<h1>${line.substring(2)}</h1>`);
    } else if (line.startsWith("## ")) {
      flushParagraph();
      html.push(`<h2>${line.substring(3)}</h2>`);
    } else if (line.startsWith("### ")) {
      flushParagraph();
      html.push(`<h3>${line.substring(4)}</h3>`);
    } else if (line.startsWith("> ")) {
      flushParagraph();
      html.push(`<blockquote>${line.substring(2)}</blockquote>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      html.push(`<ul><li>${line.substring(2)}</li></ul>`);
    } else if (/^\d+\. /.test(line)) {
      flushParagraph();
      const match = line.match(/^\d+\. (.*)$/);
      if (match) {
        html.push(`<ol><li>${match[1]}</li></ol>`);
      }
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      currentParagraph.push(line);
    }
  }

  flushParagraph();

  return html.join("");
}
