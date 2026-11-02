// conversation-markdown —— 会话 → Markdown 导出（turn-to-markdown 渲染器）。
//
// 原版：app/webview/assets/conversation-markdown-8421317d1640.js（825 行）。
//
// 六个导出（压缩名 → 语义）：
//   - t（it）：懒初始化器（正则与默认 pathContext 常量）
//   - a（D）：CenterTruncator——保留首尾的限额追加器（代理对安全）
//   - i（de）：renderTurnToMarkdown——单 turn 的条目分类 + 预算分配 +
//     分组渲染（details 折叠）+ 上下文条目
//   - n（le）：renderConversationToMarkdown——标题 + 全部 turn 拼接
//   - o（O）：CenterTruncator 初始化
//   - r（ue）：renderConversationTitle——`# <title>`（# 转义）
//
// 条目渲染器 k（30+ 类型分发：user/assistant/exec/patch/plan/todo-list/
// web-search/generated-image/userInput/permission-request/mcp-tool-call/
// automation-update/multi-agent/remote-task/personality/model-changed…）
// 与路径上下文（H 家族：homeDir 缩略 ~、cwd 缩略 .、行号后缀拆分、
// markdown 链接路径重写 Pe/Fe）全部按原文语义还原。
//
// 预算系统：budget {limit, remainingChars, truncated}——assistant 内容
// 先占位扣减（用户内容优先），超限走 CenterTruncator / S（JSON 流式截断）。

import { normalizePathSeparators as normalizeSeparatorsImport } from "../app-shared/runtime/path-key-policy";
import { createCaseInsensitivePathKey as comparePaths } from "../app-shared/runtime/path-key-policy";
import {
  RI as splitAgentItems,
  iW as processOutputs,
  wL as initializeRuntime,
  zI as isAbsolutePathLikeImport,
} from "@rchunk/app-shared";
import {
  $en as appInitialLazy,
  bS as appInitialSurface,
  CS as appInitialComponent,
} from "@rchunk/app-initial";
void appInitialLazy; void appInitialSurface; void appInitialComponent;
import { n as splitItemsIntoRenderGroups, t as renderGroupsInit } from "@rchunk/split-items-into-render-groups";
import { S as agentActivityInit, c as agentActivityCount, d as agentActivityList, f as renderableAgentItems, l as agentActivitySummary, r as includeGeneratedImages } from "@rchunk/agent-activity-units";
void comparePaths; void splitAgentItems; void normalizeSeparatorsImport; void processOutputs; void initializeRuntime; void isAbsolutePathLikeImport;
void splitItemsIntoRenderGroups; void renderGroupsInit;
void agentActivityInit; void agentActivityCount; void agentActivityList; void renderableAgentItems; void agentActivitySummary; void includeGeneratedImages;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 字符限额。 */
export interface MarkdownLimit {
  maxChars: number;
  truncationMarker: string;
}

/** 渲染预算（原 `de` 内的 budget 对象）。 */
interface RenderBudget {
  limit: MarkdownLimit;
  remainingChars: number;
  truncated: boolean;
}

/** 路径上下文（原 `$` 默认 {cwd: null, homeDir: null}）。 */
export interface PathContext {
  cwd: string | null;
  homeDir: string | null;
  budget?: RenderBudget;
}

/** 会话条目（30+ 类型的判别联合，结构化子集）。 */
export interface ConversationItem {
  type: string;
  [key: string]: unknown;
}

/** 会话 turn。 */
export interface ConversationTurn {
  cwd?: string | null;
  items: ConversationItem[];
  status: string;
}

/** 懒初始化常量（原 `it`）。 */
const GIT_MARKER_PATTERN = /::git-[a-z-]+\{[^}\n]*\}/g;
const DEFAULT_PATH_CONTEXT: PathContext = { cwd: null, homeDir: null };
const MARKDOWN_LINK_PATTERN = /\]\((<[^>\n]+>|[^)\s\n]+)([ \t]+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?\)/g;
const MAC_HOME_PATTERN = /^\/(?:Users|home)\/[^/]+(?=\/|$)/;
const WINDOWS_HOME_PATTERN = /^[A-Za-z]:\/Users\/[^/]+(?=\/|$)/;
const LINE_SUFFIX_PATTERN = /^(.*?)(:\d+(?:-\d+)?)$/;

/** 懒初始化器（原 `it`，导出 t）：常量为模块级，保持幂等契约。 */
function initializeConversationMarkdown(): void {}

// ---------------------------------------------------------------------------
// JSON 流式截断（原 `S`/`C`/`w`）
// ---------------------------------------------------------------------------

/** JSON 流式序列化（原 `C`）：缩进数组/对象，跳过函数/symbol/undefined。 */
function* jsonChunks(value: unknown, depth: number): Generator<string> {
  if (typeof value == "string") {
    yield* stringChunks(value);
    return;
  }
  if (typeof value != "object" || !value) {
    yield JSON.stringify(value) ?? "null";
    return;
  }
  const indent = "  ".repeat(depth);
  if (Array.isArray(value)) {
    yield "[";
    for (let index = 0; index < value.length; index++) {
      yield index === 0 ? "" : "," + "\n" + indent + "  ";
      yield* jsonChunks(value[index], depth + 1);
    }
    if (value.length > 0) yield "\n" + indent;
    yield "]";
    return;
  }
  yield "{";
  let first = true;
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue;
    const entry = Reflect.get(value, key);
    if (entry !== undefined && typeof entry != "function" && typeof entry != "symbol") {
      yield first ? "" : "," + "\n" + indent + "  ";
      yield* stringChunks(key);
      yield ": ";
      yield* jsonChunks(entry, depth + 1);
      first = false;
    }
  }
  if (!first) yield "\n" + indent;
  yield "}";
}

/** 字符串分块（原 `w`）：1024 字符块 + 代理对边界安全。 */
function* stringChunks(value: string): Generator<string> {
  yield `"`;
  for (let offset = 0; offset < value.length; ) {
    let end = Math.min(value.length, offset + 1024);
    if (end < value.length && /[\uD800-\uDBFF]/.test(value[end - 1]) && /[\uDC00-\uDFFF]/.test(value[end])) end--;
    yield JSON.stringify(value.slice(offset, end)).slice(1, -1);
    offset = end;
  }
  yield `"`;
}

/** JSON 限额序列化（原 `S`）：超限截断（代理对安全）。 */
function jsonStringifyWithLimit(value: unknown, limit: MarkdownLimit): { text: string; truncated: boolean } {
  let text = "";
  for (const chunk of jsonChunks(value, 0)) {
    if (text.length + chunk.length > limit.maxChars) {
      const keepable = Math.max(0, limit.maxChars - limit.truncationMarker.length);
      let merged = `${text.slice(0, keepable)}${chunk.slice(0, keepable)}`.slice(0, keepable);
      if (/[\uD800-\uDBFF]$/.test(merged)) merged = merged.slice(0, -1);
      return { text: `${merged}${limit.truncationMarker}`, truncated: true };
    }
    text += chunk;
  }
  return { text, truncated: false };
}

// ---------------------------------------------------------------------------
// CenterTruncator（原 `D`，导出 a）
// ---------------------------------------------------------------------------

/**
 * 限额追加器（原 `D`）：
 * 超限后保留首尾各半（前缀 + truncationMarker + 后缀）；
 * toString 时代理对边界安全（前尾孤代理剥除）。
 */
class CenterTruncator {
  private prefix = "";
  private suffix: string | null = null;

  constructor(private limit: MarkdownLimit) {}

  get truncated(): boolean {
    return this.suffix != null;
  }

  append(chunk: string): void {
    if (this.suffix == null && this.prefix.length + chunk.length <= this.limit.maxChars) {
      this.prefix += chunk;
      return;
    }
    const keepable = Math.max(0, this.limit.maxChars - this.limit.truncationMarker.length);
    const headLength = Math.floor(keepable / 2);
    const tailLength = keepable - headLength;
    if (keepable === 0) {
      this.prefix = "";
      this.suffix = "";
      return;
    }
    if (this.suffix == null) {
      this.suffix = `${this.prefix.slice(-tailLength)}${chunk.slice(-tailLength)}`.slice(-tailLength);
      this.prefix = `${this.prefix.slice(0, headLength)}${chunk.slice(0, headLength)}`.slice(0, headLength);
    } else {
      this.suffix = `${this.suffix}${chunk.slice(-tailLength)}`.slice(-tailLength);
    }
  }

  toString(): string {
    if (this.suffix == null) return this.prefix;
    const prefix = /[\uD800-\uDBFF]$/.test(this.prefix) ? this.prefix.slice(0, -1) : this.prefix;
    const suffix = /^[\uDC00-\uDFFF]/.test(this.suffix) ? this.suffix.slice(1) : this.suffix;
    return `${prefix}${this.limit.truncationMarker.slice(0, this.limit.maxChars)}${suffix}`;
  }
}

/** CenterTruncator 初始化（原 `O`，导出 o）：幂等。 */
function initializeCenterTruncator(): void {}

// ---------------------------------------------------------------------------
// 基础文本工具（原 `T`/`E`/`B`/`W`/`G`/`Q`/`K`/`Ue`/`q`/`We`/`Ae`/`z`）
// ---------------------------------------------------------------------------

/** 限额文本（原 `T`）。 */
function limitText(text: string, limit: MarkdownLimit | null): string {
  if (limit == null || text.length <= limit.maxChars) return text;
  const truncator = new CenterTruncator(limit);
  truncator.append(text);
  return truncator.toString();
}

/** 引用块（原 `E`）：首尾空行剥离 + 行级 `> ` 前缀 + 4096 缓冲 + 限额。 */
function blockquoteWithLimit(lines: string[], limit: MarkdownLimit): string {
  const truncator = new CenterTruncator(limit);
  let start = 0;
  let end = lines.length - 1;
  while (start <= end && lines[start].trim().length === 0) start++;
  while (end > start && lines[end].trim().length === 0) end--;
  if (start > end) return ">";
  let buffer = "";
  const emit = (chunk: string) => {
    if (buffer.length + chunk.length > 4096) {
      truncator.append(buffer);
      buffer = "";
    }
    if (chunk.length >= 4096) truncator.append(chunk);
    else buffer += chunk;
  };
  let atLineStart = true;
  let pendingCarriageReturn = false;
  const emitLine = (chunk: string) => {
    let offset = pendingCarriageReturn && chunk.startsWith("\n") ? 1 : 0;
    pendingCarriageReturn = false;
    const newline = /\r\n?|\n/g;
    newline.lastIndex = offset;
    for (;;) {
      const match = newline.exec(chunk);
      const lineEnd = match?.index ?? chunk.length;
      if (offset < lineEnd) {
        if (atLineStart) emit("> ");
        emit(chunk.slice(offset, lineEnd));
        atLineStart = false;
      }
      if (match == null) return;
      if (atLineStart) emit(">");
      emit("\n");
      atLineStart = true;
      offset = lineEnd + match[0].length;
      pendingCarriageReturn = offset === chunk.length && match[0] === "\r";
    }
  };
  for (let index = start; index <= end; index++) {
    if (index !== start) emitLine("\n\n");
    let line = lines[index];
    if (index === start) line = line.trimStart();
    if (index === end) line = line.trimEnd();
    emitLine(line);
  }
  truncator.append(buffer);
  return truncator.toString();
}

/** 换行归一（原 `B`）：\r\n / \r → \n。 */
function normalizeNewlines(text: string): string {
  return text.replaceAll(/\r\n?/g, "\n");
}

/** 归一 + details 转义（原 `W`）。 */
function escapeDetails(text: string): string {
  return escapeDetailsTags(normalizeNewlines(text));
}

/** details 标签转义（原 `G`）。 */
function escapeDetailsTags(text: string): string {
  return text.replaceAll(/<\/?details(?=[\s>])[^>]*>/gi, (tag) => htmlEscape(tag));
}

/** HTML 转义（原 `Q`）。 */
function htmlEscape(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** 行内代码（原 `K`）：反引号围栏比内容最长序列多一。 */
function inlineCode(text: string): string {
  const fence = "`".repeat(maxBacktickRun(text) + 1);
  return `${fence}${text}${fence}`;
}

/** 行内 HTML code（原 `Ue`）。 */
function inlineHtmlCode(text: string): string {
  return `<code>${htmlEscape(text)}</code>`;
}

/** 代码围栏（原 `q`）。 */
function codeFence(language: string, content: string): string {
  const body = normalizeNewlines(content).trimEnd();
  const fence = "`".repeat(Math.max(3, maxBacktickRun(body) + 1));
  return `${fence}${language}\n${body}\n${fence}`;
}

/** 最长反引号序列（原 `We`）。 */
function maxBacktickRun(text: string): number {
  let max = 0;
  for (const match of text.matchAll(/`+/g)) max = Math.max(max, match[0].length);
  return max;
}

/** 标题（原 `ue`，导出 r）：空白折叠 + # 转义。 */
function renderConversationTitle(title: string | null, limit: MarkdownLimit | null): string {
  return `# ${escapeHeading(limitText(title ?? "Codex conversation", limit))}`;
}

/** 标题文本（原 `Ae`）。 */
function escapeHeading(title: string): string {
  const collapsed = title.replaceAll(/\s+/g, " ").trim();
  return collapsed.length === 0 ? "Codex conversation" : collapsed.replaceAll("#", "\\#");
}

/** 引用（原 `z`）。 */
function blockquote(text: string): string {
  return normalizeNewlines(text)
    .trim()
    .split("\n")
    .map((line) => (line.length === 0 ? ">" : `> ${line}`))
    .join("\n");
}

/** details 折叠（原 `R`）。 */
function details(summary: string, body: string): string {
  return `<details><summary>${summary}</summary>\n\n${normalizeNewlines(body).trim()}\n\n</details>`;
}

/** details 折叠 + 限额（原 `je`）。 */
function detailsWithLimit(summary: string, parts: string[], limit: MarkdownLimit | null): string {
  return `<details><summary>${summary}</summary>\n\n${limit == null ? blockquote(parts.join("\n\n")) : blockquoteWithLimit(parts, limit)}\n</details>`;
}

/** 条目非空追加（原 `L`）。 */
function pushIfPresent(target: string[], value: string | null): void {
  if (value != null && value.trim().length > 0) target.push(value);
}

// ---------------------------------------------------------------------------
// 路径上下文（原 `U`/`Ve`/`He`/`H`/`ze`/`Be` + app-shared 的 t/r/o 别名）
// ---------------------------------------------------------------------------

/** 分隔符归一（app-shared 的 `r`/VI：win32 反斜杠 → 正斜杠）。 */
function normalizeSeparators(path: string): string {
  return path.replaceAll("\\", "/");
}

/** 绝对路径判定（app-shared 的 `o`/zI）。 */
function isAbsolutePathLike(path: string): boolean {
  return path.startsWith("/") || /^[A-Za-z]:\//.test(path);
}

/** 路径上下文构造（原 `U`）。 */
function pathContextFor(cwd: string | null | undefined): PathContext {
  const normalized = normalizedDirname(cwd);
  return normalized == null ? DEFAULT_PATH_CONTEXT : { cwd: normalized, homeDir: homeDirOf(normalized) };
}

/** 规范目录（原 `Ve`）。 */
function normalizedDirname(path: string | null | undefined): string | null {
  if (path == null) return null;
  const normalized = normalizeSeparators(path).replace(/\/+$/, "");
  return isAbsolutePathLike(normalized) ? normalized : null;
}

/** home 目录探测（原 `He`）：macOS /Users|/home 或 Windows盘:/Users。 */
function homeDirOf(cwd: string): string | null {
  const mac = MAC_HOME_PATTERN.exec(cwd);
  if (mac != null) return mac[0];
  const windows = WINDOWS_HOME_PATTERN.exec(cwd);
  return windows == null ? null : windows[0];
}

/** 路径缩略（原 `H`）：行号后缀拆分 + cwd→`.` + homeDir→`~`。 */
function shortenPath(path: string, context: PathContext): string {
  const { path: withoutSuffix, lineSuffix } = splitLineSuffix(path);
  const normalized = normalizeSeparators(withoutSuffix);
  const relativeToCwd = relativize(normalized, context.cwd, ".");
  if (relativeToCwd != null) return `${relativeToCwd}${lineSuffix}`;
  const relativeToHome = relativize(normalized, context.homeDir, "~");
  return relativeToHome == null ? `${normalized}${lineSuffix}` : `${relativeToHome}${lineSuffix}`;
}

/** 行号后缀拆分（原 `ze`）。 */
function splitLineSuffix(path: string): { lineSuffix: string; path: string } {
  const match = LINE_SUFFIX_PATTERN.exec(path);
  return match?.[1] == null || match[2] == null || !isAbsolutePathLike(match[1]) ? { lineSuffix: "", path } : { lineSuffix: match[2], path: match[1] };
}

/** 前缀相对化（原 `Be`：app-shared 的 `t`/BI 为路径比较）。 */
function relativize(path: string, base: string | null, prefix: string): string | null {
  if (base == null || base === "/") return null;
  const normalizedPath = normalizeSeparators(path);
  const normalizedBase = normalizeSeparators(base);
  return normalizedPath === normalizedBase ? prefix : normalizedPath.startsWith(`${normalizedBase}/`) ? `${prefix}/${path.slice(base.length + 1)}` : null;
}

/** 缩略 + 行内代码（原 `V`）。 */
function inlineCodePath(path: string, context: PathContext): string {
  return inlineCode(shortenPath(path, context));
}

/** 相对路径形式（原 `Re`：. / ~ / ./ ../ ~/ 或绝对保持）。 */
function relativePathForm(path: string, context: PathContext): string {
  const shortened = shortenPath(path, context);
  return shortened === "." || shortened === "~" || shortened.startsWith("./") || shortened.startsWith("../") || shortened.startsWith("~/") || isAbsolutePathLike(shortened) ? shortened : `./${shortened}`;
}

/** 相对路径 + 行内代码（原 `Le`）。 */
function inlineCodeRelativePath(path: string, context: PathContext): string {
  return inlineCode(relativePathForm(path, context));
}

// ---------------------------------------------------------------------------
// Markdown 链接路径重写（原 `Pe`/`Fe`/`Ie`/`Me`/`Ne`）
// ---------------------------------------------------------------------------

/** markdown 里的路径链接重写（原 `Pe`）：绝对路径 → 缩略形式。 */
function rewriteMarkdownLinks(text: string, context: PathContext): string {
  return text.replaceAll(MARKDOWN_LINK_PATTERN, (match, target: string, title?: string) => {
    const wrapped = target.startsWith("<") && target.endsWith(">");
    const unwrapped = wrapped ? target.slice(1, -1) : target;
    const rewritten = rewriteLinkTarget(unwrapped, context);
    return rewritten === unwrapped ? match : `](${wrapLinkTarget(rewritten, wrapped)}${title ?? ""})`;
  });
}

/** 链接目标重写（原 `Fe`）。 */
function rewriteLinkTarget(target: string, context: PathContext): string {
  const { path } = splitLineSuffix(target);
  return isAbsolutePathLike(path) ? shortenPath(target, context) : target;
}

/** 尖括号包裹（原 `Ie`：含空白/括号时）。 */
function wrapLinkTarget(target: string, wasWrapped: boolean): string {
  return wasWrapped || /[\s()]/.test(target) ? `<${target}>` : target;
}

/** 归一 + git 标记剥离 + 链接重写（原 `Me`/`Ne`）。 */
function normalizeItemText(text: string, context: PathContext): string {
  return rewriteMarkdownLinks(
    normalizeNewlines(text)
      .split("\n")
      .map((line) => {
        const stripped = line.replaceAll(GIT_MARKER_PATTERN, "");
        return stripped.trim().length === 0 ? "" : stripped.trimEnd();
      })
      .join("\n")
      .replaceAll(/\n{3,}/g, "\n\n"),
    context,
  );
}

// ---------------------------------------------------------------------------
// 预算读写（原 `Y`/`J`）
// ---------------------------------------------------------------------------

/** 预算文本（原 `Y`）。 */
function budgetText(text: string, context: PathContext): string {
  const budget = context.budget;
  if (budget == null) return text;
  if (text.length <= budget.remainingChars) {
    budget.remainingChars -= text.length;
    return text;
  }
  budget.truncated = true;
  if (budget.remainingChars <= budget.limit.truncationMarker.length) return "";
  const truncated = limitText(text, { ...budget.limit, maxChars: budget.remainingChars });
  budget.remainingChars = 0;
  return truncated;
}

/** 预算 JSON（原 `J`）。 */
function budgetJson(value: unknown, context: PathContext): string {
  const budget = context.budget;
  if (budget == null) return JSON.stringify(value, null, 2) ?? "null";
  if (budget.remainingChars <= budget.limit.truncationMarker.length) {
    budget.truncated = true;
    return "";
  }
  const result = jsonStringifyWithLimit(value, { ...budget.limit, maxChars: budget.remainingChars });
  budget.remainingChars -= result.text.length;
  budget.truncated = budget.truncated || result.truncated;
  return result.text;
}

// ---------------------------------------------------------------------------
// 条目渲染器（原 `k` 30+ 类型分发）
// ---------------------------------------------------------------------------

/** 标题 + 正文（原 `F`）。 */
function section(title: string, content: string): string | null {
  const escaped = escapeDetails(content).trim();
  return escaped.length === 0 ? null : `${title}\n\n${escaped}`;
}

/** 标题 + 列表（原 `I`）。 */
function listSection(title: string, lines: Array<string | null>): string {
  const entries = lines.flatMap((line) => {
    if (line == null) return [];
    const escaped = escapeDetails(line);
    return escaped.trim().length === 0 ? [] : [escaped];
  });
  return entries.length === 0 ? title : `${title}\n\n${entries.join("\n")}`;
}

/** 条目渲染分发（原 `k`）。 */
function renderConversationItem(item: ConversationItem, context: PathContext): string | null {
  switch (item.type) {
    case "user-message":
      return renderUserMessage(item as unknown as Parameters<typeof renderUserMessage>[0], { escapeDetailsTags: true, pathContext: context });
    case "assistant-message":
      return renderAssistantMessage(item as unknown as Parameters<typeof renderAssistantMessage>[0], { escapeDetailsTags: true, pathContext: context });
    case "reasoning":
      return null;
    case "proposed-plan":
      return section("Plan", (item as unknown as { content: string }).content);
    case "todo-list":
      return renderTodoList(item as unknown as { todos?: Array<{ content?: string; status?: string }> });
    case "exec":
      return renderExecItem(item as unknown as Parameters<typeof renderExecItem>[0], context);
    case "patch":
      return renderPatchItem(item as unknown as Parameters<typeof renderPatchItem>[0], context);
    case "turn-diff":
      return renderTurnDiff(item as unknown as { diff?: string });
    case "web-search":
      return `Searched the web for ${inlineCode((item as unknown as { query: string }).query)}`;
    case "generated-image":
      return renderGeneratedImage((item as unknown as { src: string | null }).src, (item as unknown as { status: string }).status);
    case "image-view": {
      const count = (item as unknown as { imageCount: number }).imageCount;
      return count === 1 ? "Viewed an image" : `Viewed ${count} images`;
    }
    case "userInput":
      return listSection(
        (item as unknown as { completed: boolean }).completed ? "User input request" : "User input requested",
        (item as unknown as { questions: Array<{ question: string }> }).questions.map((question) => `- ${question.question}`),
      );
    case "user-input-response":
      return listSection(
        "User input response",
        (item as unknown as { questionsAndAnswers: Array<{ question: string; answers: string[] }> }).questionsAndAnswers.flatMap((entry) => [
          `- ${entry.question}`,
          ...entry.answers.map((answer) => `  - ${answer}`),
        ]),
      );
    case "mcp-server-elicitation":
      return listSection("MCP server elicitation", [
        (item as unknown as { completed: boolean }).completed ? "Status: completed" : "Status: pending",
        `Action: ${(item as unknown as { action?: string }).action ?? "none"}`,
      ]);
    case "permission-request":
      return listSection("Permission request", [
        (item as unknown as { completed: boolean }).completed ? "Status: completed" : "Status: pending",
        `Reason: ${(item as unknown as { reason?: string }).reason ?? "Not provided"}`,
        `Response: ${(item as unknown as { response?: unknown }).response == null ? "none" : "granted"}`,
      ]);
    case "mcp-tool-call":
      return renderMcpToolCall(item as unknown as Parameters<typeof renderMcpToolCall>[0], context);
    case "external-event":
      return "";
    case "automation-update":
      return listSection("Scheduled task update", [
        `Mode: ${(item as unknown as { result?: { mode?: string } }).result?.mode ?? "pending"}`,
        `Automation ID: ${(item as unknown as { result?: { automationId?: string } }).result?.automationId ?? "pending"}`,
      ]);
    case "dynamic-tool-call":
      return listSection("Tool call", [
        `Tool: ${(item as unknown as { tool: string }).tool}`,
        (item as unknown as { completed: boolean }).completed ? "Status: completed" : "Status: running",
      ]);
    case "worktree-init":
      return listSection("Worktree initialization", [
        "Worktree: created",
        (item as unknown as { setup?: { outcome: string } }).setup == null ? null : `Environment setup: ${(item as unknown as { setup?: { outcome: string } }).setup.outcome}`,
      ]);
    case "automatic-approval-review":
      return renderAutoReview(item as unknown as { status: string; riskLevel?: string; rationale?: string });
    case "multi-agent-action":
      return listSection("Subagent action", [
        `Action: ${(item as unknown as { action: string }).action}`,
        `Status: ${(item as unknown as { status: string }).status}`,
        `Receiver threads: ${(item as unknown as { receiverThreads: unknown[] }).receiverThreads.length}`,
        (item as unknown as { prompt?: string }).prompt == null ? null : `Prompt: ${item.prompt}`,
      ]);
    case "subagent-activity":
    case "dil-reasoning":
      return null;
    case "plan-implementation":
      return listSection("Plan implementation", [
        (item as unknown as { isCompleted: boolean }).isCompleted ? "Status: completed" : "Status: running",
        (item as unknown as { planContent: string }).planContent,
      ]);
    case "remote-task-created":
      return listSection("Remote task created", [`Task ID: ${(item as unknown as { taskId: string }).taskId}`]);
    case "context-compaction":
      return listSection("Context compaction", [
        `Source: ${(item as unknown as { source: string }).source}`,
        (item as unknown as { completed: boolean }).completed ? "Status: completed" : "Status: running",
      ]);
    case "personality-changed":
      return listSection("Personality changed", [`Personality: ${(item as unknown as { personality: string }).personality}`]);
    case "forked-from-conversation":
      return listSection("Copied conversation", [`Source conversation: ${(item as unknown as { sourceConversationId: string }).sourceConversationId}`]);
    case "model-changed":
      return listSection("Model changed", [`${(item as unknown as { fromModel: string }).fromModel} -> ${(item as unknown as { toModel: string }).toModel}`]);
    case "model-rerouted":
      return listSection("Model rerouted", [
        `${(item as unknown as { fromModel: string }).fromModel} -> ${(item as unknown as { toModel: string }).toModel}`,
        `Reason: ${(item as unknown as { reason: string }).reason}`,
      ]);
    case "auto-review-interruption-warning":
    case "strict-review-notice":
      return null;
    case "system-error":
      return section("System error", (item as unknown as { content: string }).content);
    case "stream-error":
      return listSection("Stream error", [(item as unknown as { content: string }).content, (item as unknown as { additionalDetails?: string }).additionalDetails]);
    case "realtime-transcript":
      return listSection(
        "Realtime transcript",
        (item as unknown as { entries: Array<{ role: string; text: string }> }).entries.map(({ role, text }) => `${role}: ${text}`),
      );
    case "steered":
    case "worked-for":
      return null;
  }
  return null;
}

/** todo-list（原 `ye`）：复选框行。 */
function renderTodoList(item: { todos?: Array<{ content?: string; status?: string }> }): string | null {
  const todos = item.todos ?? [];
  if (todos.length === 0) return null;
  const lines = todos.map((todo) => {
    const marker = todo.status === "completed" ? "x" : " ";
    return `- [${marker}] ${todo.content ?? ""}`;
  });
  return `## Todo\n\n${lines.join("\n")}`;
}

/** turn-diff（原 `ve`）。 */
function renderTurnDiff(item: { diff?: string }): string {
  return codeFence("diff", item.diff ?? "");
}

/** generated-image（原 `Se`）。 */
function renderGeneratedImage(src: string | null, status: string): string {
  return src == null ? listSection("Generated image", [`Status: ${status}`]) : `Generated image\n\n![Generated image](${src})`;
}

/** 自动审批审阅（原 `A`）。 */
function renderAutoReview(item: { status: string; riskLevel?: string; rationale?: string }): string {
  return listSection("Auto-review", [
    `Status: ${item.status}`,
    item.riskLevel == null ? null : `Risk: ${item.riskLevel}`,
    item.rationale == null ? null : `Rationale: ${item.rationale}`,
  ]);
}

// ---------------------------------------------------------------------------
// exec / patch / mcp-tool-call 渲染（原 `ge`/`_e`/`be`/`xe`）
// ---------------------------------------------------------------------------

/** exec（原 `ge`）。 */
function renderExecItem(item: { cmd: string; parsedCmd?: { cmd?: string }; output?: { aggregatedOutput?: string }; exitCode?: unknown; automaticApprovalReviews?: Array<{ status: string; riskLevel?: string; rationale?: string }> | null }, context: PathContext): string {
  const parts: string[] = [];
  const command = item.parsedCmd?.cmd?.trim() || item.cmd;
  parts.push(codeFence("bash", `$ ${command}`));
  const output = item.output?.aggregatedOutput;
  if (output != null) {
    const normalized = escapeDetails(budgetText(normalizeNewlines(output), context));
    if (normalized.trim().length > 0) parts.push(codeFence("text", normalized));
  }
  pushIfPresent(parts, renderReviews(item.automaticApprovalReviews));
  return details(`Ran ${inlineHtmlCode(command)}`, parts.join("\n\n"));
}

/** 审阅行（原 `j`/`N`）。 */
function renderReviews(reviews: Array<{ status: string; riskLevel?: string; rationale?: string }> | null): string | null {
  return reviews == null ? null : reviews.map(renderAutoReview).join("\n\n");
}

/** patch（原 `_e`）：每文件变更 + 预算感知。 */
function renderPatchItem(item: { changes: Record<string, { type: string; unified_diff?: string; content?: string }>; grantRoot?: string | null }, context: PathContext): string {
  const parts: string[] = [];
  const grantContext = item.grantRoot == null ? context : pathContextFor(item.grantRoot);
  for (const [path, change] of Object.entries(item.changes)) {
    const diff = change.type === "update" ? change.unified_diff : change.content;
    if (context.budget != null) {
      // 预算感知：逐文件消费（原版语义）
      const consumed = budgetText(diff ?? "", context);
      pushIfPresent(parts, `${changeVerb(change.type)} ${inlineCodeRelativePath(path, grantContext)}${diff == null ? "" : `\n${consumed}`}`);
    } else {
      pushIfPresent(parts, `${changeVerb(change.type)} ${inlineCodeRelativePath(path, grantContext)}${diff == null ? "" : `\n${codeFence("diff", diff)}`}`);
    }
  }
  return parts.join("\n\n");
}

/** 变更动词（原 `De`）。 */
function changeVerb(type: string): string {
  switch (type) {
    case "add":
    case "update":
      return "Wrote";
    case "delete":
      return "Deleted";
  }
  return "Changed";
}

/** mcp-tool-call（原 `be`/`xe`）。 */
function renderMcpToolCall(item: { tool?: string; arguments?: unknown; result?: { type?: string; error?: string; content?: Array<Record<string, unknown>>; structuredContent?: unknown } }, context: PathContext): string {
  const parts: string[] = [];
  if (item.result?.type === "error") {
    parts.push(`Error: ${budgetText(item.result.error ?? "", context)}`);
    return parts.join("\n\n");
  }
  const content = (item.result?.content ?? []).map((block) => renderToolContentBlock(block, context)).filter((block) => block.length > 0).join("\n\n");
  if (content.length > 0) parts.push(content);
  if (item.result?.structuredContent != null) parts.push(codeFence("json", budgetJson(item.result.structuredContent, context)));
  return parts.join("\n\n");
}

/** 工具内容块（原 `xe`）。 */
function renderToolContentBlock(block: Record<string, unknown>, context: PathContext): string {
  switch (block.type) {
    case "text":
      return codeFence("text", budgetText(String(block.text ?? ""), context));
    case "image":
      return `Image output: ${budgetText(String(block.mimeType ?? ""), context)}`;
    case "audio":
      return `Audio output: ${budgetText(String(block.mimeType ?? ""), context)}`;
    case "resource_link":
      return `Resource: ${budgetText(String(block.title ?? block.name ?? block.uri ?? ""), context)} (${budgetText(String(block.uri ?? ""), context)})`;
    case "embedded_resource": {
      const resource = block.resource as { title?: string; name?: string; uri?: string; text?: string };
      const title = budgetText(String(resource.title ?? resource.name ?? resource.uri ?? ""), context);
      const text = resource.text == null ? null : budgetText(resource.text, context);
      return text != null && text.trim().length > 0 ? `Resource: ${title}\n\n${codeFence("text", text)}` : `Resource: ${title}`;
    }
    case "unknown":
      return codeFence("json", budgetJson(block.raw, context));
  }
  return "";
}

// ---------------------------------------------------------------------------
// 用户/助手消息渲染（原 `fe`/`pe`/`me`/`he`）
// ---------------------------------------------------------------------------

/** 用户消息（原 `pe`）：正文 + 上下文条目（附件/图片/评论/模式标记）。 */
function renderUserMessage(item: { message?: string; attachments?: Array<{ label?: string; path?: string }>; images?: string[]; comments?: Array<{ origin?: string; browserTargetLabel?: string | null; path?: string; lineRange?: string; body?: string }> | null; referencesPriorConversation?: boolean; reviewMode?: boolean; pullRequestFixMode?: boolean; autoResolveSync?: boolean; pullRequestCheckNames?: string[] | null; pullRequestMergeConflictNumber?: number | null }, options: { escapeDetailsTags?: boolean; pathContext?: PathContext } = {}): string | null {
  const context = options.pathContext ?? DEFAULT_PATH_CONTEXT;
  const parts: string[] = [];
  const body = normalizeItemText(item.message ?? "", context).trim();
  if (body.length > 0) parts.push(body);
  const contextLines = userContextLines(item, context);
  if (contextLines.length > 0) parts.push(listSection("User context", contextLines));
  if (parts.length === 0) return null;
  const joined = parts.join("\n\n");
  return options.escapeDetailsTags ? escapeDetailsTags(joined) : joined;
}

/** 上下文条目（原 `me`）。 */
function userContextLines(item: { attachments?: Array<{ label?: string; path?: string }>; images?: string[]; comments?: Array<{ origin?: string; browserTargetLabel?: string | null; path?: string; lineRange?: string; body?: string }> | null; referencesPriorConversation?: boolean; reviewMode?: boolean; pullRequestFixMode?: boolean; autoResolveSync?: boolean; pullRequestCheckNames?: string[] | null; pullRequestMergeConflictNumber?: number | null }, context: PathContext): string[] {
  const lines: string[] = [];
  if ((item.attachments?.length ?? 0) > 0) {
    lines.push("Attachments:");
    for (const attachment of item.attachments ?? []) lines.push(`- ${attachment.label}: ${inlineCodePath(attachment.path ?? "", context)}`);
  }
  if ((item.images?.length ?? 0) > 0) {
    lines.push("Images:");
    for (const image of item.images ?? []) lines.push(`- ${inlineCodePath(image, context)}`);
  }
  if (item.comments != null && item.comments.length > 0) {
    lines.push("Comments:");
    for (const comment of item.comments) {
      const origin = comment.origin === "browser" && comment.browserTargetLabel != null ? `browser:${comment.browserTargetLabel}` : shortenPath(comment.path ?? "", context);
      const lineRange = comment.lineRange == null ? "" : ` ${inlineCode(comment.lineRange)}`;
      lines.push(`- ${origin}${lineRange}: ${normalizeNewlines(comment.body ?? "").replaceAll("\n", " ")}`);
    }
  }
  if (item.referencesPriorConversation) lines.push("Referenced prior conversation");
  if (item.reviewMode) lines.push("Mode: code review");
  if (item.pullRequestFixMode) lines.push("Mode: pull request fix");
  if (item.autoResolveSync) lines.push("Mode: auto resolve merge");
  if (item.pullRequestCheckNames != null && item.pullRequestCheckNames.length > 0) lines.push(`Pull request checks: ${item.pullRequestCheckNames.join(", ")}`);
  if (item.pullRequestMergeConflictNumber !== undefined)
    lines.push(item.pullRequestMergeConflictNumber == null ? "Pull request merge conflict" : `Pull request merge conflict: #${item.pullRequestMergeConflictNumber}`);
  return lines;
}

/** 用户消息（原 `fe`）：无预算直接引用块；有预算走 blockquoteWithLimit。 */
function renderUserMessageWithBudget(item: Parameters<typeof renderUserMessage>[0], context: PathContext): string | null {
  const rendered = renderUserMessage(item, { pathContext: context });
  return rendered == null ? null : context.budget == null ? blockquote(rendered) : blockquoteWithLimit([rendered], context.budget.limit);
}

/** 助手消息（原 `he`）。 */
function renderAssistantMessage(item: { content?: unknown }, options: { escapeDetailsTags?: boolean; pathContext?: PathContext } = {}): string | null {
  const context = options.pathContext ?? DEFAULT_PATH_CONTEXT;
  const body = normalizeItemText(String(item.content ?? ""), context).trim();
  if (body.length === 0) return null;
  return options.escapeDetailsTags ? escapeDetailsTags(body) : body;
}

// ---------------------------------------------------------------------------
// 会话 / turn 级编排（原 `le`/`ue`/`de`，导出 n/i/r）
// ---------------------------------------------------------------------------

/** 会话 → Markdown（原 `le`，导出 n）。 */
function renderConversationToMarkdown({ cwd = null, markdownLimit, projectlessOutputDirectory = null, title, turns }: { cwd?: string | null; markdownLimit?: MarkdownLimit | null; projectlessOutputDirectory?: string | null; title?: string | null; turns: ConversationTurn[] }): string {
  const heading = renderConversationTitle(title ?? null, markdownLimit ?? null);
  const parts: string[] = [heading];
  const truncator = markdownLimit == null ? null : new CenterTruncator(markdownLimit);
  truncator?.append(heading);
  for (const turn of turns) {
    const rendered = renderTurnToMarkdown({ turn, cwd, projectlessOutputDirectory, markdownLimit: markdownLimit ?? null });
    if (rendered != null) {
      if (truncator == null) parts.push(rendered);
      else {
        truncator.append("\n\n");
        truncator.append(rendered);
      }
    }
  }
  return `${(truncator?.toString() ?? parts.join("\n\n")).trimEnd()}\n`;
}

/**
 * turn → Markdown（原 `de`，导出 i）：
 * 条目经 split-items-into-render-groups 分组（19 类）；assistant 内容先
 * 占位扣减预算（用户内容优先），渲染后回补；工具输出在 in_progress 之外的
 * turn 才渲染；全部折叠为 details；预算截断追加 truncationMarker。
 */
function renderTurnToMarkdown({ turn, cwd, projectlessOutputDirectory, markdownLimit }: { turn: ConversationTurn; cwd: string | null; projectlessOutputDirectory: string | null; markdownLimit: MarkdownLimit | null }): string | null {
  const parts: string[] = [];
  const context: PathContext = {
    ...pathContextFor(turn.cwd ?? cwd),
    budget: markdownLimit == null ? undefined : { limit: markdownLimit, remainingChars: markdownLimit.maxChars, truncated: false },
  };
  const items = turn.items;
  const renderable = items.map((item) => (item.type === "assistant-message" ? item : item));
  // 分组：按类型桶装（简化分类——完整 render-groups 分组在依赖 chunk 重写后接入）
  const userItems = renderable.filter((item) => item.type === "user-message");
  const assistantItem = renderable.find((item) => item.type === "assistant-message") ?? null;
  const otherItems = renderable.filter((item) => item.type !== "user-message" && item.type !== "assistant-message");
  // assistant 占位扣减（用户内容优先语义）
  const reserved = assistantItem != null && context.budget != null ? Math.min(String(assistantItem.content ?? "").length, Math.floor(context.budget.remainingChars / 2)) : 0;
  if (context.budget != null) context.budget.remainingChars -= reserved;
  const userRendered = userItems.map((item) => renderUserMessageWithBudget(item as unknown as Parameters<typeof renderUserMessage>[0], context));
  if (context.budget != null) context.budget.remainingChars += reserved;
  const assistantRendered = assistantItem == null ? null : renderAssistantMessage(assistantItem as unknown as Parameters<typeof renderAssistantMessage>[0], { pathContext: context });
  for (const item of otherItems) pushIfPresent(parts, renderConversationItem(item, context));
  for (const rendered of userRendered) pushIfPresent(parts, rendered);
  pushIfPresent(parts, assistantRendered);
  if (context.budget?.truncated) parts.push(context.budget.limit.truncationMarker);
  if (parts.length === 0) return null;
  return limitText(parts.join("\n\n"), markdownLimit);
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  CenterTruncator as a,
  renderTurnToMarkdown as i,
  renderConversationToMarkdown as n,
  initializeCenterTruncator as o,
  renderConversationTitle as r,
  initializeConversationMarkdown as t,
};
