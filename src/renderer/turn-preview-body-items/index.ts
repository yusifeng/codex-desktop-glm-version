// turn-preview-body-items —— turn 预览正文的条目裁剪。
//
// 原版：app/webview/assets/turn-preview-body-items-84e9457d1850.js（360B）。
// 两个导出：n=空初始化器；t=previewBodyItems——worked-for 之后的条目；
// 否则从首个非 user-message 起裁剪（保留后续）。

/** 预览正文条目（原 `t`）。 */
function previewBodyItems(items: Array<{ type: string }>): Array<{ type: string }> {
  const workedForIndex = items.findIndex((item) => item.type === "worked-for");
  if (workedForIndex >= 0) return items.slice(workedForIndex + 1);
  const firstNonUser = items.findIndex((item) => item.type !== "user-message");
  if (firstNonUser < 0) return [];
  return firstNonUser === 0 ? items : items.slice(firstNonUser);
}

/** 空初始化器（原 `n`）。 */
function initializePreviewBodyItems(): void {}

export { initializePreviewBodyItems as n, previewBodyItems as t };
