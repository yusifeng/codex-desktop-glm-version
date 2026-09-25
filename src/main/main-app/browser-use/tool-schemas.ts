// browser-use 工具 schema 带 —— WebMCP/locator/download/print/tabs 的
// 工具命令常量与参数 schema。
//
// 对应 main-C-Mhak1n.ts 的 109,475-110,116 行区段：
//   - 20 个工具命令常量（MKe~Bqe）：webmcp_list_tools / webmcp_invoke_tool /
//     playwright_evaluate + playwright_locator_* 17 命令（click/dblclick/
//     download_media/fill/press/press_sequentially/wait_for/count/
//     select_option/set_checked/is_visible/is_enabled/all_text_contents/
//     text_content/inner_text/get_attribute/read_all）
//   - NJ/TKe/EKe/PJ：tabs 工具的浏览器/tab 引用与 tab 描述 schema
//     （type: iab | extension | cdp + metadata）
//   - DKe：download 工具的 handoff | deliverable 状态
//   - OKe：print 的 html | text | domSnapshot 内容类型
//   - kKe/FJ：工具注册 schema（hints + name/registration_id）
//   - selector 工具（UJ/WJ/GJ 等）：RegExp source 缓存 + selector 解析
//
// 各 `*Ke` 工厂函数（FJ schema → 具名工具定义）在 capability 层消费。

// ---------------------------------------------------------------------------
// 工具命令名常量（原 109,532-110,037 的 20 常量）
// ---------------------------------------------------------------------------

export const WEBMCP_TOOL_NAMES = {
  listTools: "webmcp_list_tools",
  invokeTool: "webmcp_invoke_tool",
} as const;

export const PLAYWRIGHT_TOOL_NAMES = {
  evaluate: "playwright_evaluate",
  locatorClick: "playwright_locator_click",
  locatorDblclick: "playwright_locator_dblclick",
  locatorDownloadMedia: "playwright_locator_download_media",
  locatorFill: "playwright_locator_fill",
  locatorPress: "playwright_locator_press",
  locatorPressSequentially: "playwright_locator_press_sequentially",
  locatorWaitFor: "playwright_locator_wait_for",
  locatorCount: "playwright_locator_count",
  locatorSelectOption: "playwright_locator_select_option",
  locatorSetChecked: "playwright_locator_set_checked",
  locatorIsVisible: "playwright_locator_is_visible",
  locatorIsEnabled: "playwright_locator_is_enabled",
  locatorAllTextContents: "playwright_locator_all_text_contents",
  locatorTextContent: "playwright_locator_text_content",
  locatorInnerText: "playwright_locator_inner_text",
  locatorGetAttribute: "playwright_locator_get_attribute",
  locatorReadAll: "playwright_locator_read_all",
} as const;

// ---------------------------------------------------------------------------
// tabs/download/print 的共享 schema 形态（原 NJ/TKe/EKe/PJ/DKe/OKe）
// ---------------------------------------------------------------------------

/** 浏览器/tab 引用（原 `NJ` + `TKe`）。 */
export interface BrowserTabRef {
  browser?: ToolDescriptor;
  tab?: ToolDescriptor;
}

/** 工具描述符（原 `NJ`：{id, description}）。 */
export interface ToolDescriptor {
  description?: string;
  id: string;
}

/** tab 类型（原 `EKe`）。 */
export type ToolTabType = "iab" | "extension" | "cdp";

/** tab 描述（原 `PJ`）。 */
export interface ToolTabDescriptor {
  family?: string;
  id: string;
  metadata?: { codexSessionId?: string; extensionInstanceId?: string };
  name: string;
  profileName?: string;
  type: ToolTabType;
}

/** download 状态（原 `DKe`）。 */
export type ToolDownloadStatus = "handoff" | "deliverable";

/** print 内容类型（原 `OKe`）。 */
export type ToolPrintContentType = "html" | "text" | "domSnapshot";

/** print 请求（原 OKe 的消费形态）。 */
export interface ToolPrintRequest {
  browser_id: string;
  content_type: ToolPrintContentType;
  timeout_ms?: number;
  urls: string[];
}

/** print 结果条目。 */
export interface ToolPrintResult {
  content: string | null;
  title: string | null;
  url: string;
}

/** 工具 hints（原 `kKe`）。 */
export interface ToolHints {
  consequentialHint?: boolean;
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

/** 工具注册（原 `FJ`）。 */
export interface ToolRegistration {
  hints?: ToolHints;
  name: string;
  registration_id: string;
}

// ---------------------------------------------------------------------------
// selector 工具（原 `UJ`/`WJ`/`GJ`）
// ---------------------------------------------------------------------------

/** RegExp source 缓存（原 `UJ`）。 */
const regExpSourceCache = new WeakMap<RegExp, string>();

/** 取 RegExp 的稳定 source（原 `UJ`）。 */
export function cachedRegExpSource(pattern: RegExp): string {
  let source = regExpSourceCache.get(pattern);
  if (source == null) {
    source = pattern.source;
    regExpSourceCache.set(pattern, source);
  }
  return source;
}

/** RegExp 判定（原 `WJ`）。 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/** selector 解析（原 `GJ` 语义：字符串 | RegExp | {or/and/role/text...}）。 */
export type ToolSelector =
  | string
  | RegExp
  | { and: ToolSelector[] }
  | { or: ToolSelector[] }
  | { role: string }
  | { text: string }
  | { label: string }
  | { placeholder: string }
  | { testId: string };

/** selector 序列化为内部语法（原 `YJ`~`tJe`：internal:role= 等）。 */
export function serializeToolSelector(selector: ToolSelector): string {
  if (typeof selector === "string") return selector;
  if (selector instanceof RegExp) return `/regex=${cachedRegExpSource(selector)}/`;
  if ("role" in selector) return `internal:role=${selector.role}`;
  if ("text" in selector) return `internal:text=${selector.text}`;
  if ("label" in selector) return `internal:label=${selector.label}`;
  if ("placeholder" in selector) return `internal:attr=[placeholder=${selector.placeholder}]`;
  if ("testId" in selector) return `internal:testid=${selector.testId}`;
  if ("or" in selector) return selector.or.map(serializeToolSelector).join(" >> ");
  if ("and" in selector) return selector.and.map(serializeToolSelector).join(" && ");
  return String(selector);
}
