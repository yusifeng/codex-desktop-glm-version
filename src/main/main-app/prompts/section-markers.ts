// 用户输入 prompt 的分节标记与 response-annotations 解析。
//
// 原版 main-C-Mhak1n.ts 26,561-26,622。桌面端把用户提交的上下文按固定
// 标题分节拼进 prompt（文件/粘贴/Diff 评论/浏览器评论/选中文本/失败 PR
// 检查），并支持在 prompt 头部携带 <response-annotations> JSON 块；
// 本模块提供这些标记常量、注解块解析（$me/Xp）与「最后一次请求段」的
// 提取/替换（rm/ohe）及评论截图附件的文案生成/反解（im/am/om/sm/ahe）。

/** 用户提及的文件分节（原版 Up）。 */
export const FILES_MENTIONED_SECTION = `# Files mentioned by the user:`;
/** 用户粘贴的文件分节（原版 Wp）。 */
export const FILES_PASTED_SECTION = `# Files pasted by the user:`;
/** 用户请求分节标题（原版 Gp）。 */
export const MY_REQUEST_SECTION = `## My request:`;
/** 用户请求分节匹配（可带 " for Codex" 后缀；全局正则，matchAll/split 用，原版 Kp）。 */
export const MY_REQUEST_PATTERN = /## My request(?: for Codex)?:/g;
/** response-annotations 分节标题（原版 qp）。 */
export const RESPONSE_ANNOTATIONS_SECTION = `# Response annotations:`;
/** response-annotations JSON 块开标记（原版 Jp）。 */
export const RESPONSE_ANNOTATIONS_OPEN = `<response-annotations>`;
/** response-annotations JSON 块闭标记（原版 Yp）。 */
export const RESPONSE_ANNOTATIONS_CLOSE = `</response-annotations>`;
/** Diff 评论分节（原版 Zp）。 */
export const DIFF_COMMENTS_SECTION = `# Diff comments:`;
/** 浏览器评论分节（原版 Qp）。 */
export const BROWSER_COMMENTS_SECTION = `# Browser comments:`;
/** 浏览器评论来源名（原版 ehe）。 */
export const BROWSER_COMMENT_SOURCE = `Browser`;
/** 选中文本分节（原版 $p）。 */
export const SELECTED_TEXT_SECTION = `# Selected text:`;
/** 失败 PR 检查分节（原版 em）。 */
export const FAILING_PR_CHECKS_SECTION = `# Failing PR checks:`;
/** Diff 评论中的用户评论文本分节（原版 the）。 */
export const USER_COMMENT_SECTION = `## User Comment`;
/** 评论中请求的注解分节（原版 nhe）。 */
export const REQUESTED_ANNOTATION_SECTION = `## Requested annotation`;
/** 浏览器文本注解占位文案（原版 rhe）。 */
export const BROWSER_TEXT_ANNOTATION_PLACEHOLDER = `Browser annotation: text`;
/** 浏览器图形快照注解占位文案（原版 ihe）。 */
export const BROWSER_GRAPHICS_ANNOTATION_PLACEHOLDER = `Browser annotation: graphics snapshot`;
/** 「已附图片」文案前缀（原版 tm，注意尾部空格）。 */
export const ATTACHED_IMAGES_PREFIX = `Attached images: `;
/** 「…张附加标注图片」文案后缀（原版 nm）。 */
export const ADDITIONAL_LABELED_IMAGES_SUFFIX = ` additional labeled images for Comment `;

/**
 * 提取 prompt 中位于最后一次 `## My request:` 之前的正文（原版 Xp）。
 * 没有 response-annotations 头块时从头开始；没有请求分节时返回 null。
 */
export function extractPromptPreamble(prompt: string): string | null {
  let startIndex = parseResponseAnnotations(prompt)?.endIndex ?? 0;
  let requestOffset = prompt.slice(startIndex).search(MY_REQUEST_PATTERN);
  return requestOffset === -1 ? null : prompt.slice(startIndex, startIndex + requestOffset);
}

/**
 * 解析 prompt 头部的 response-annotations 块（原版 $me）。
 * 要求 prompt 以 `\n# Response annotations:\n` 开头，且其后紧跟一个
 * `\n<response-annotations>\n…\n</response-annotations>\n` JSON 块；
 * 返回块的结束偏移与 JSON 文本，结构不符返回 null。
 */
export function parseResponseAnnotations(
  prompt: string,
): { endIndex: number; json: string } | null {
  let header = `
${RESPONSE_ANNOTATIONS_SECTION}
`;
  if (!prompt.startsWith(header)) return null;
  let openMarker = `
${RESPONSE_ANNOTATIONS_OPEN}
`;
  let openIndex = prompt.indexOf(openMarker, header.length);
  if (openIndex === -1) return null;
  let jsonStart = openIndex + openMarker.length;
  let closeMarker = `
${RESPONSE_ANNOTATIONS_CLOSE}
`;
  let closeIndex = prompt.indexOf(closeMarker, jsonStart);
  return closeIndex === -1
    ? null
    : { endIndex: closeIndex + closeMarker.length, json: prompt.slice(jsonStart, closeIndex) };
}

/** 取最后一次请求段之后的正文（去掉此前所有分节，原版 rm）。 */
export function takeLastRequestSection(prompt: string): string {
  let sections = prompt.split(MY_REQUEST_PATTERN);
  return sections.length <= 1 ? prompt : sections[sections.length - 1].trim();
}

/** 已保存的标记截图文案（原版 im）。 */
export function savedMarkerScreenshotMessage(commentId: string): string {
  return `Saved marker screenshot: attached as a labeled image for Comment ${commentId}`;
}

/** 已标注截图文案（原版 am）。 */
export function annotatedScreenshotMessage(commentId: string): string {
  return `Annotated screenshot: attached as a labeled image for Comment ${commentId}`;
}

/** 已标注 PDF 截图文案（原版 om）。 */
export function annotatedPdfScreenshotMessage(commentId: string): string {
  return `Annotated PDF screenshot: attached as a labeled image for Comment ${commentId}`;
}

/** 附加标注图片数量文案（原版 sm；count=1 时用单数句式）。 */
export function attachedImagesMessage(commentId: string, count: number): string {
  return count === 1
    ? `Attached image: 1 additional labeled image for Comment ${commentId}`
    : `${ATTACHED_IMAGES_PREFIX}${count}${ADDITIONAL_LABELED_IMAGES_SUFFIX}${commentId}`;
}

/**
 * 反解附加标注图片数量（原版 ahe）：匹配 attachedImagesMessage 生成的两种
 * 句式，返回数量；不匹配或非正整数返回 null。
 */
export function parseAttachedImagesCount(message: string, commentId: string): number | null {
  if (message === attachedImagesMessage(commentId, 1)) return 1;
  let suffix = `${ADDITIONAL_LABELED_IMAGES_SUFFIX}${commentId}`;
  if (!message.startsWith(ATTACHED_IMAGES_PREFIX) || !message.endsWith(suffix)) return null;
  let count = Number(message.slice(17, message.length - suffix.length));
  return !Number.isSafeInteger(count) || count <= 0 ? null : count;
}

/**
 * 用新的请求文本替换最后一次 `## My request:` 段（原版 ohe）：
 * 保留之前的所有分节，重写请求标题与内容；无请求分节时原样返回。
 */
export function replaceLastRequestSection(prompt: string, requestText: string): string {
  let lastMatch = Array.from(prompt.matchAll(MY_REQUEST_PATTERN)).at(-1);
  return lastMatch == null
    ? prompt
    : `${prompt.slice(0, lastMatch.index).trimEnd()}
${MY_REQUEST_SECTION}
${requestText}
`;
}
