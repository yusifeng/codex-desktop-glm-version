// conversation-blocks：块组件（消息/图片/附件/活动/审查各渲染块）。
//
// 对应原 chunk 的组件群（定位行号见各注释）。组件以 props → 视图描述的
// 语义骨架承载（React 节点树在 jsx runtime 接入后直接装配）：
//   - rg（W，L2397）：AssistantMessageBlock —— 助手消息正文块
//   - pg（U，L2840）：BrowserRatingControlsBlock —— 浏览器评分控件
//   - Ag（V，L3077）：AccessPolicyBadge —— 访问策略徽章（loading 态）
//   - Lg（z，L3107）：IconButton —— 图标按钮（ariaLabel/className）
//   - Wg（L，L3237）：合并 interrupted/updated/completed 状态归约
//   - Kg（I，L3243）：子代理线程名收集（parentTurnKey 过滤 + 排序）
//   - qg（F，L3259）：ActivitySummaryRow —— 活动摘要行（后台代理名注解）
//   - Jg（P，L3282）：ActivitySummaryGroup —— 活动摘要分组（后台代理分组）
//   - $g（M，L3360）：SVG 图标（20x20）
//   - C_（A，L3788）：SummaryBlock —— 摘要块（summary + key）
//   - L_（O，L3918）：RtlIcon —— data-rtl-flip 图标
//   - Lv（E，L4385）：TimelineTargetsBlock —— 时间线目标块
//   - Xy（x，L5482）：ImageBlock —— 单图（src/conversationId）
//   - Zy（S，L5658）：ImageStackBlock —— 多图栈（srcs）
//   - Qy（b，L5690）：AppshotBlock —— appshot 附件块
//   - eb（C，L5749）：AttachmentBlock —— 附件块（upload/file 分支）
//   - tb（w，L5824）：PullRequestLink —— PR 链接
//   - kx（v，L7262）：ItemList —— 条目列表（className）
//   - dS（g，L7692）：DiffDonut —— diff 甜甜圈（挂载动画延迟 + 完成）
//   - GS（m，L8204）：InProgressDiffSummaryBlock
//   - EC（f，L8922）：WebSearchBlock —— web-search 块（action+query 文案）
//   - zC（u，L9120）：UserMessageBlock —— 用户消息块（600+ props 面）
//   - aw（s，L10023）/sw（c，L10125）：活动行/活动行组
//   - Gw（r，L10962）：TurnBlocks —— 拒绝操作计数 + 单元渲染
//   - Zw（n，L11086）：BlockList —— 块列表（content-visibility + final-
//     assistant 标记 + canOwnLatestTurnFollowContent ref 分发）

import { I3 as getJsxRuntime } from "@rchunk/app-shared";

let runtime: ReturnType<typeof getJsxRuntime> | undefined;
function jsx(): ReturnType<typeof getJsxRuntime> { runtime ??= getJsxRuntime(); return runtime; }

/** 兼容恢复期间仍被少量纯算法调用使用的视图描述。 */
export interface ViewNode {
  className?: string;
  data?: Record<string, unknown>;
  kind: string;
  props?: Record<string, unknown>;
}

/** 活动状态归约（原 `Wg`，导出 L）。 */
export function mergeActivityStatuses(statuses: string[]): "active" | "interrupted" | "updated" | "completed" {
  return statuses.some((status) => status === "interrupted")
    ? "interrupted"
    : statuses.some((status) => status === "updated")
      ? "updated"
      : statuses.length > 0 && statuses.every((status) => status === "completed" || status === "done")
        ? "completed"
        : "active";
}

/** 子代理线程名收集（原 `Kg`，导出 I）。 */
export function collectSubagentThreadNames(
  backgroundAgents: Array<{ displayName?: string; id: string; parentTurnKey?: string }>,
  parentTurnKey: string,
): string[] {
  const names = new Set(
    backgroundAgents
      .filter((agent) => agent.parentTurnKey === parentTurnKey && (agent.displayName ?? "").trim().length > 0)
      .map((agent) => (agent.displayName ?? "").trim()),
  );
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** AssistantMessageBlock（原 `rg`，导出 W）。 */
export function AssistantMessageBlock(props: { assistantCopyText?: string; item: Record<string, unknown> }): unknown {
  const content = props.item.content ?? props.item.text ?? "";
  return jsx().jsxs("article", { "data-conversation-block": "assistant-message", children: [jsx().jsx("div", { children: content as any }), props.assistantCopyText == null ? null : jsx().jsx("button", { type: "button", "aria-label": "Copy response", "data-copy-text": props.assistantCopyText, children: "Copy" })] });
}

/** BrowserRatingControlsBlock（原 `pg`，导出 U）。 */
export function BrowserRatingControlsBlock(props: { alwaysShowActions?: boolean; browserRatingControls?: unknown }): ViewNode {
  return { kind: "browser-rating-controls", props: props as Record<string, unknown> };
}

/** AccessPolicyBadge（原 `Ag`，导出 V）。 */
export function AccessPolicyBadge(props: { accessPolicy?: unknown; isLoading?: boolean }): unknown {
  if (props.isLoading) return jsx().jsx("span", { "aria-label": "Loading access policy", children: "…" });
  return props.accessPolicy == null ? null : jsx().jsx("span", { "data-access-policy": true, children: String(props.accessPolicy) });
}

/** IconButton（原 `Lg`，导出 z）。 */
export function IconButton(props: { ariaLabel?: string; className?: string; children?: unknown; onClick?(): void; [key: string]: unknown }): unknown {
  const { ariaLabel, children, ...rest } = props;
  return jsx().jsx("button", { ...rest, type: "button", "aria-label": ariaLabel, children });
}

/** SummaryBlock（原 `C_`，导出 A）。 */
export function SummaryBlock(props: { summary?: unknown; summaryKey?: string }): ViewNode {
  return { kind: "summary", props: props as Record<string, unknown> };
}

/** RtlIcon（原 `L_`，导出 O）。 */
export function RtlIcon(props: { label?: string }): ViewNode {
  return { kind: "rtl-icon", data: { "data-rtl-flip": true }, props: props as Record<string, unknown> };
}

/** TimelineTargetsBlock（原 `Lv`，导出 E）。 */
export function TimelineTargetsBlock(props: { conversationId: string; enableTimelineTargets?: boolean }): ViewNode {
  return { kind: "timeline-targets", props: props as Record<string, unknown> };
}

/** ImageBlock（原 `Xy`，导出 x）。 */
export function ImageBlock(props: { alt?: string; conversationId: string; src: string }): unknown {
  return jsx().jsx("img", { alt: props.alt ?? "", loading: "lazy", src: props.src, "data-conversation-id": props.conversationId });
}

/** ImageStackBlock（原 `Zy`，导出 S）。 */
export function ImageStackBlock(props: { alt?: string; conversationId: string; hostId: string; imageSource?: unknown; srcs: string[]; useImageDialog?: boolean }): unknown {
  return props.srcs.length === 0 ? null : jsx().jsx("div", { className: "grid grid-cols-2 gap-2", "data-image-stack": true, children: props.srcs.map((src, index) => jsx().jsx(ImageBlock, { alt: props.alt, conversationId: props.conversationId, src }, `${src}:${index}`)) });
}

/** AppshotBlock（原 `Qy`，导出 b）。 */
export function AppshotBlock(props: { appshotContext: Record<string, unknown>; conversationId: string }): ViewNode {
  return { kind: "appshot", props: props as Record<string, unknown> };
}

/** AttachmentBlock（原 `eb`，导出 C）。 */
export function AttachmentBlock(props: { attachment: Record<string, unknown>; cwd?: string; hostId?: string; isUploadedFileViewerEnabled?: boolean }): unknown {
  const name = props.attachment.name ?? props.attachment.filename ?? props.attachment.path ?? "Attachment";
  const href = props.attachment.url ?? props.attachment.path;
  return jsx().jsxs("div", { "data-attachment": true, children: [jsx().jsx("strong", { children: String(name) }), typeof href === "string" ? jsx().jsx("span", { children: href }) : null] });
}

/** PullRequestLink（原 `tb`，导出 w）。 */
export function PullRequestLink(props: { pullRequestNumber: number }): ViewNode {
  return { kind: "pull-request-link", props: props as Record<string, unknown> };
}

/** ItemList（原 `kx`，导出 v）。 */
export function ItemList(props: { className?: string; items: unknown[] }): unknown {
  return jsx().jsx("ul", { className: props.className, children: props.items.map((item, index) => jsx().jsx("li", { children: item as any }, index)) });
}

/** DiffDonut（原 `dS`，导出 g）。 */
export function DiffDonut(props: { donutAnimateOnMountDelayMs?: number; isComplete?: boolean; item: Record<string, unknown>; tooltipPortalContainer?: unknown }): ViewNode {
  return { kind: "diff-donut", props: { ...props, delay: props.donutAnimateOnMountDelayMs ?? 0 } };
}

/** InProgressDiffSummaryBlock（原 `GS`，导出 m）。 */
export function InProgressDiffSummaryBlock(props: { inProgressDiffSummary?: unknown; isInProgress?: boolean }): ViewNode {
  return { kind: "diff-summary-in-progress", props: props as Record<string, unknown> };
}

/** WebSearchBlock（原 `EC`，导出 f）。 */
export function WebSearchBlock(props: { icon?: unknown; item: { action?: string; query?: string } }): unknown {
  const query = props.item.query ?? "";
  return jsx().jsxs("div", { "data-web-search": props.item.action ?? "search", children: [props.icon, jsx().jsx("span", { children: query })] });
}

/** UserMessageBlock（原 `zC`，导出 u；400 号 memo-cache 主块）。 */
export function UserMessageBlock(props: { alwaysShowUserMessageActions?: boolean; item: Record<string, unknown> }): unknown {
  return jsx().jsx("article", { "data-conversation-block": "user-message", children: (props.item.content ?? props.item.text ?? "") as any });
}

/** TurnBlocks（原 `Gw`，导出 r；60 号 memo-cache）。 */
export function TurnBlocks(props: { deniedActionCount?: number; units: unknown[] }): unknown {
  const renderUnit = (unit: unknown, index: number): unknown => {
    if (unit == null || typeof unit === "string" || typeof unit === "number") return unit as any;
    const wrapper = unit as { item?: { item?: Record<string, unknown> }; node?: unknown };
    if (wrapper.node != null) return wrapper.node;
    const item = wrapper.item?.item ?? unit as Record<string, unknown>;
    const type = typeof item.type === "string" ? item.type : "activity";
    if (type === "assistant-message" || type === "assistantMessage") return jsx().jsx(AssistantMessageBlock, { item }, index);
    if (type === "user-message" || type === "userMessage") return jsx().jsx(UserMessageBlock, { item }, index);
    if (type === "web-search" || type === "webSearch") return jsx().jsx(WebSearchBlock, { item: item as { action?: string; query?: string } }, index);
    const content = item.content ?? item.summary ?? item.title;
    return jsx().jsx("div", { "data-turn-unit-type": type, children: typeof content === "string" || typeof content === "number" ? content : null }, (item.callId as string | undefined) ?? index);
  };
  return jsx().jsxs("section", { "data-turn-blocks": true, children: [(props.deniedActionCount ?? 0) > 0 ? jsx().jsx("span", { "data-denied-action-count": props.deniedActionCount, children: `${props.deniedActionCount} denied` }) : null, props.units.map(renderUnit)] });
}

/** 渲染块描述（BlockList 的输入）。 */
export interface RenderBlock {
  canOwnLatestTurnFollowContent?: boolean;
  key: string;
  node: ViewNode | null;
}

/** BlockList（原 `Zw`，导出 n）。 */
export function BlockList(blocks: RenderBlock[], latestFollowRef: unknown): ViewNode {
  if (blocks.length <= 1) {
    const only = blocks[0];
    return only == null
      ? { kind: "block-list-empty" }
      : {
          kind: "block-list",
          className: "flex flex-col gap-0 [contain-intrinsic-size:auto_240px] [content-visibility:auto] [&:has([data-mcp-app-expanded='true'])]:[content-visibility:visible]",
          data: {
            "data-local-conversation-final-assistant": only.key === "assistant-item" || undefined,
            "data-virtualized-turn-content": "",
          },
          props: { children: only.node, ref: only.canOwnLatestTurnFollowContent ? latestFollowRef : undefined },
        };
  }
  return {
    kind: "block-list",
    className: "flex flex-col gap-0",
    props: {
      children: blocks.flatMap((block, index) => {
        const previous = blocks[index - 1];
        return [
          ...(index > 0 ? [{ kind: "block-gap", data: { key: `block-gap-${previous?.key}-${block.key}` } }] : []),
          {
            kind: "block",
            className: "flex flex-col",
            data: { "data-local-conversation-final-assistant": block.key === "assistant-item" || undefined },
            props: { children: block.node, ref: block.canOwnLatestTurnFollowContent ? latestFollowRef : undefined },
          },
        ];
      }),
    },
  };
}

/** McpAppWidgets（原 `em`，导出 Y）。 */
export function McpAppWidgets(props: {
  conversationId: string;
  hostId: string;
  items: Array<{ type: string; isMcpAppWidgetSuperseded?: boolean }>;
  resolvedApps?: unknown[];
  shouldInitialize?: boolean;
  widgetStatePersistence?: unknown;
}): ViewNode[] {
  return props.items
    .filter((item) => item.type === "mcp-tool-call" && item.isMcpAppWidgetSuperseded !== true)
    .map((item) => ({ kind: "mcp-app-widget", props: { item } }));
}

/** WidgetCleanupEffect（原 `tm`，导出 J）。 */
export function widgetCleanupEffect(callIds: string[]): () => void {
  return () => {
    void callIds;
  };
}
