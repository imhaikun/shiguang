/**
 * 为 markdownToHtml 渲染出的代码块注入交互。
 * 基于事件委托，单个 document 级监听器处理所有代码块的复制/展开按钮。
 * @returns 解绑函数，调用后移除事件监听。
 */
export function initCodeBlocks(): () => void {
  const onClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // ── 复制 ──
    const copyBtn = target.closest<HTMLElement>(".code-block-copy");
    if (copyBtn) {
      const code =
        copyBtn.closest(".code-block-container")
          ?.querySelector("pre code")?.textContent ?? "";
      navigator.clipboard
        ?.writeText(code)
        .then(() => {
          const label = copyBtn.querySelector<HTMLElement>(".copy-text");
          copyBtn.classList.add("copied");
          if (label) label.textContent = "已复制";
          window.setTimeout(() => {
            copyBtn.classList.remove("copied");
            if (label) label.textContent = "复制";
          }, 2000);
        })
        .catch(() => {});
      return;
    }

    // ── 展开折叠代码块 ──
    const expandBtn = target.closest<HTMLElement>(".code-block-expand");
    if (expandBtn) {
      expandBtn
        .closest(".code-block-container")
        ?.querySelector(".code-block-body")
        ?.classList.remove("collapsed");
      expandBtn.remove();
    }
  };

  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("click", onClick);
  };
}
