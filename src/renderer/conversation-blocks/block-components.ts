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

import { I3 as getJsxRuntime, e6 as getReact } from "@rchunk/app-shared";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as mcpToolItemContent from "@rchunk/mcp-tool-item-content";
import * as planSummaryItemContent from "@rchunk/plan-summary-item-content";

let runtime: ReturnType<typeof getJsxRuntime> | undefined;
function jsx(): ReturnType<typeof getJsxRuntime> { runtime ??= getJsxRuntime(); return runtime; }
function renderableText(value: unknown, fallback = ""): string | number {
  if (typeof value === "string" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map(entry => renderableText(entry)).filter(Boolean).join("\n");
  if (value != null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    return renderableText(source.text ?? source.content ?? source.value ?? source.title, fallback);
  }
  return fallback;
}
function messageText(item: Record<string, unknown>): string | number {
  return renderableText(
    item.content ?? item.text ?? item.message ?? item.prompt ?? item.input ?? item.inputText ??
    item.output ?? item.outputText ?? item.response ?? item.body,
  );
}

/** 兼容恢复期间仍被少量纯算法调用使用的视图描述。 */
export interface ConversationBlockNode {
  className?: string;
  data?: Record<string, unknown>;
  kind: string;
  props?: Record<string, unknown>;
}
export type ViewNode = ConversationBlockNode;

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
  const content = messageText(props.item);
  return jsx().jsxs("article", { "data-conversation-block": "assistant-message", children: [jsx().jsx("div", { children: content }), props.assistantCopyText == null ? null : jsx().jsx("button", { type: "button", "aria-label": "Copy response", "data-copy-text": props.assistantCopyText, children: "Copy" })] });
}

/** BrowserRatingControlsBlock（原 `pg`，导出 U）。 */
export function BrowserRatingControlsBlock(props: { alwaysShowActions?: boolean; browserRatingControls?: unknown }): unknown {
  if (props.browserRatingControls == null) return null;
  return jsx().jsx("div", { className: props.alwaysShowActions ? undefined : "opacity-0 group-hover:opacity-100", "data-browser-rating-controls": true, children: props.browserRatingControls });
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
export function SummaryBlock(props: { summary?: unknown; summaryKey?: string }): unknown {
  if (props.summary == null) return null;
  const content = typeof props.summary === "object" && props.summary != null
    ? (props.summary as Record<string, unknown>).content ?? (props.summary as Record<string, unknown>).text
    : props.summary;
  return jsx().jsx("section", { "data-summary-key": props.summaryKey, "data-conversation-summary": true, children: typeof content === "string" || typeof content === "number" ? content : null });
}

/** RtlIcon（原 `L_`，导出 O）。 */
export function RtlIcon(props: { label?: string }): unknown {
  return jsx().jsx("span", { "aria-label": props.label, "aria-hidden": props.label == null || undefined, "data-rtl-flip": true, children: "›" });
}

/** TimelineTargetsBlock（原 `Lv`，导出 E）。 */
export function TimelineTargetsBlock(props: { conversationId: string; enableTimelineTargets?: boolean; targets?: unknown[] }): unknown {
  if (props.enableTimelineTargets !== true) return null;
  return jsx().jsx("aside", { "data-timeline-targets": props.conversationId, children: (props.targets ?? []).map((target, index) => jsx().jsx("div", { children: typeof target === "string" ? target : null }, index)) });
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
export function AppshotBlock(props: { appshotContext: Record<string, unknown>; conversationId: string }): unknown {
  const src = props.appshotContext.src ?? props.appshotContext.url ?? props.appshotContext.imageUrl;
  const label = props.appshotContext.title ?? props.appshotContext.appName ?? "App screenshot";
  return jsx().jsxs("figure", { "data-appshot": props.conversationId, children: [typeof src === "string" ? jsx().jsx("img", { alt: String(label), loading: "lazy", src }) : null, jsx().jsx("figcaption", { children: String(label) })] });
}

/** AttachmentBlock（原 `eb`，导出 C）。 */
export function AttachmentBlock(props: { attachment: Record<string, unknown>; cwd?: string; hostId?: string; isUploadedFileViewerEnabled?: boolean }): unknown {
  const name = props.attachment.name ?? props.attachment.filename ?? props.attachment.path ?? "Attachment";
  const href = props.attachment.url ?? props.attachment.path;
  return jsx().jsxs("div", { "data-attachment": true, children: [jsx().jsx("strong", { children: String(name) }), typeof href === "string" ? jsx().jsx("span", { children: href }) : null] });
}

/** PullRequestLink（原 `tb`，导出 w）。 */
export function PullRequestLink(props: { href?: string; onClick?(): void; pullRequestNumber: number; title?: string }): unknown {
  const label = props.title ?? `Pull request #${props.pullRequestNumber}`;
  return props.href != null
    ? jsx().jsx("a", { href: props.href, rel: "noreferrer", target: "_blank", "data-pull-request-number": props.pullRequestNumber, children: label })
    : jsx().jsx("button", { type: "button", onClick: props.onClick, "data-pull-request-number": props.pullRequestNumber, children: label });
}

/** ItemList（原 `kx`，导出 v）。 */
export function ItemList(props: { className?: string; items: unknown[] }): unknown {
  return jsx().jsx("ul", { className: props.className, children: props.items.map((item, index) => jsx().jsx("li", { children: renderableText(item) }, index)) });
}

/** DiffDonut（原 `dS`，导出 g）。 */
export function DiffDonut(props: { donutAnimateOnMountDelayMs?: number; isComplete?: boolean; item: Record<string, unknown>; tooltipPortalContainer?: unknown }): unknown {
  const additions = Number(props.item.additions ?? props.item.added ?? 0);
  const deletions = Number(props.item.deletions ?? props.item.removed ?? 0);
  const total = Math.max(1, additions + deletions);
  const additionPercent = Math.round(additions / total * 100);
  return jsx().jsxs("span", { "aria-label": `${additions} additions, ${deletions} deletions`, "data-diff-complete": props.isComplete === true || undefined, "data-diff-donut": true, style: { "--diff-additions": `${additionPercent}%`, animationDelay: `${props.donutAnimateOnMountDelayMs ?? 0}ms` }, children: [jsx().jsx("span", { children: `+${additions}` }), jsx().jsx("span", { children: `−${deletions}` })] });
}

/** InProgressDiffSummaryBlock（原 `GS`，导出 m）。 */
export function InProgressDiffSummaryBlock(props: { inProgressDiffSummary?: unknown; isInProgress?: boolean }): unknown {
  if (props.inProgressDiffSummary == null) return null;
  const summary = props.inProgressDiffSummary as Record<string, unknown>;
  return jsx().jsxs("section", { "aria-busy": props.isInProgress === true, "data-in-progress-diff-summary": true, children: [jsx().jsx(DiffDonut, { isComplete: props.isInProgress !== true, item: summary }), jsx().jsx("span", { children: String(summary.label ?? summary.title ?? "Changes") })] });
}

/** WebSearchBlock（原 `EC`，导出 f）。 */
export function WebSearchBlock(props: { icon?: unknown; item: { action?: string; query?: string } }): unknown {
  const query = props.item.query ?? "";
  return jsx().jsxs("div", { "data-web-search": props.item.action ?? "search", children: [props.icon, jsx().jsx("span", { children: query })] });
}

/** UserMessageBlock（原 `zC`，导出 u；400 号 memo-cache 主块）。 */
export function UserMessageBlock(props: { alwaysShowUserMessageActions?: boolean; item: Record<string, unknown> }): unknown {
  return jsx().jsx("article", { "data-conversation-block": "user-message", children: messageText(props.item) });
}

/** TurnBlocks（原 `Gw`，导出 r；60 号 memo-cache）。 */
export function TurnBlocks(props: { conversationId?: string; cwd?: string; deniedActionCount?: number; hostId?: string; renderMcpApps?: boolean; turnId?: string; units: unknown[] }): unknown {
  const renderUnit = (unit: unknown, index: number): unknown => {
    if (unit == null || typeof unit === "string" || typeof unit === "number") return unit as any;
    const wrapper = unit as { item?: { item?: Record<string, unknown> }; node?: unknown };
    if (wrapper.node != null) return wrapper.node;
    const item = wrapper.item?.item ?? unit as Record<string, unknown>;
    const type = typeof item.type === "string" ? item.type : "activity";
    if (type === "assistant-message" || type === "assistantMessage" || type === "agentMessage") return jsx().jsx(AssistantMessageBlock, { item }, index);
    if (type === "user-message" || type === "userMessage") return jsx().jsx(UserMessageBlock, { item }, index);
    if (type === "web-search" || type === "webSearch") return jsx().jsx(WebSearchBlock, { item: item as { action?: string; query?: string } }, index);
    if (type === "mcp-tool-call" || type === "mcpToolCall") {
      const ToolItemContent = (mcpToolItemContent as any).t;
      return typeof ToolItemContent === "function" ? jsx().jsx(ToolItemContent, {
        conversationId: props.conversationId,
        hostId: props.hostId,
        item,
        renderMcpApps: props.renderMcpApps === true,
      }, (item.callId as string | undefined) ?? index) : null;
    }
    if (type === "plan") {
      const PlanSummary = (planSummaryItemContent as any).t;
      return typeof PlanSummary === "function" ? jsx().jsx(PlanSummary, {
        conversationId: props.conversationId ?? "",
        cwd: props.cwd,
        item,
        turnId: props.turnId,
      }, String(item.id ?? index)) : null;
    }
    if (type === "image" || type === "generated-image" || type === "imageGeneration") {
      const src = item.src ?? item.url ?? item.savedPath ?? item.result;
      const failure = item.failure ?? item.error;
      if (failure != null || item.status === "failed" || item.status === "error") return jsx().jsx("div", { role: "alert", "data-image-generation-error": true, children: renderableText(failure, "Image generation failed") }, index);
      if (typeof src !== "string") return item.status === "inProgress" || item.status === "in_progress"
        ? jsx().jsx("div", { role: "status", "data-image-generation-pending": true, children: "Generating image…" }, index)
        : null;
      return jsx().jsx(ImageBlock, { conversationId: props.conversationId ?? "", src }, index);
    }
    if (type === "attachment" || type === "file") return jsx().jsx(AttachmentBlock, { attachment: item, cwd: props.cwd, hostId: props.hostId }, index);
    if (type === "appshot") return jsx().jsx(AppshotBlock, { appshotContext: item, conversationId: props.conversationId ?? "" }, index);
    if (type === "diff-summary" || type === "diffSummary") return jsx().jsx(InProgressDiffSummaryBlock, { inProgressDiffSummary: item, isInProgress: item.completed !== true }, index);
    const content = item.content ?? item.message ?? item.text ?? item.output ?? item.summary ?? item.title;
    return jsx().jsx("div", { "data-turn-unit-type": type, children: typeof content === "string" || typeof content === "number" ? content : null }, (item.callId as string | undefined) ?? index);
  };
  return jsx().jsxs("section", { "data-turn-blocks": true, children: [(props.deniedActionCount ?? 0) > 0 ? jsx().jsx("span", { "data-denied-action-count": props.deniedActionCount, children: `${props.deniedActionCount} denied` }) : null, props.units.map(renderUnit)] });
}

/** 渲染块描述（BlockList 的输入）。 */
export interface RenderBlock {
  canOwnLatestTurnFollowContent?: boolean;
  key: string;
  node: unknown;
}

/** BlockList（原 `Zw`，导出 n）。 */
export function BlockList(blocks: RenderBlock[], latestFollowRef: unknown): unknown {
  if (blocks.length <= 1) {
    const only = blocks[0];
    return only == null ? null : jsx().jsx("div", {
      className: "flex flex-col gap-0 [contain-intrinsic-size:auto_240px] [content-visibility:auto] [&:has([data-mcp-app-expanded='true'])]:[content-visibility:visible]",
      "data-local-conversation-final-assistant": only.key === "assistant-item" || undefined,
      "data-virtualized-turn-content": "",
      ref: only.canOwnLatestTurnFollowContent ? latestFollowRef : undefined,
      children: only.node,
    });
  }
  return jsx().jsx("div", { className: "flex flex-col gap-0", children: blocks.flatMap((block, index) => {
    const previous = blocks[index - 1];
    return [
      ...(index > 0 ? [jsx().jsx("div", { "data-block-gap": true }, `block-gap-${previous?.key}-${block.key}`)] : []),
      jsx().jsx("div", {
        className: "flex flex-col",
        "data-local-conversation-final-assistant": block.key === "assistant-item" || undefined,
        ref: block.canOwnLatestTurnFollowContent ? latestFollowRef : undefined,
        children: block.node,
      }, block.key),
    ];
  }) });
}

/** McpAppWidgets（原 `em`，导出 Y）。 */
export function McpAppWidgets(props: {
  conversationId: string;
  hostId: string;
  items: Array<{ type: string; isMcpAppWidgetSuperseded?: boolean }>;
  resolvedApps?: unknown[];
  shouldInitialize?: boolean;
  widgetStatePersistence?: unknown;
}): unknown {
  const widgets = props.items
    .filter((item) => item.type === "mcp-tool-call" && item.isMcpAppWidgetSuperseded !== true)
    .map((item: any, index) => jsx().jsx(McpAppWidgetItem, {
      conversationId: props.conversationId,
      hostId: props.hostId,
      item,
      resolvedApps: props.resolvedApps,
      shouldInitialize: props.shouldInitialize === true,
      widgetStatePersistence: props.widgetStatePersistence,
    }, item.callId ?? index));
  return jsx().jsx(jsx().Fragment, { children: widgets });
}

let mcpAppRegisteredSignal: unknown;
function registeredMcpAppSignal(): unknown {
  if (mcpAppRegisteredSignal == null && typeof (appSharedChunk as any).rZ === "function") {
    mcpAppRegisteredSignal = (appSharedChunk as any).rZ((appInitialChunk as any).$en, (appId: string, helpers: { get(signal: unknown, parameter?: unknown): unknown }) =>
      Boolean(helpers.get((appInitialChunk as any).cct, appId)) || helpers.get((appInitialChunk as any).gct, appId) === appId);
  }
  return mcpAppRegisteredSignal;
}
function McpAppWidgetItem(props: { conversationId: string; hostId: string; item: any; resolvedApps?: unknown[]; shouldInitialize: boolean; widgetStatePersistence?: unknown }): unknown {
  const ToolItemContent = (mcpToolItemContent as any).t;
  const appId = typeof (appSharedChunk as any).eU === "function" ? (appSharedChunk as any).eU(props.item.callId) : props.item.callId;
  const descriptor = registeredMcpAppSignal();
  const registered = typeof (appSharedChunk as any).BX === "function" && descriptor != null
    ? Boolean((appSharedChunk as any).BX(descriptor, appId))
    : false;
  const react = getReact?.();
  const [openOnRegistration] = react?.useState?.(() => props.item.completed !== true) ?? [props.item.completed !== true];
  if (!registered && !props.shouldInitialize) return null;
  // The release resolver memoizes by the apps collection in a WeakMap and
  // therefore requires an object key.  During startup/plugin reconciliation
  // the route can legitimately render a persisted tool call before the apps
  // query has produced its first array.  Keep the release resolver contract
  // by supplying a stable collection instead of forwarding `undefined`.
  const resolvedApps = Array.isArray(props.resolvedApps) ? props.resolvedApps : EMPTY_RESOLVED_APPS;
  const matchingApp = typeof (appInitialChunk as any).Ern === "function"
    ? (appInitialChunk as any).Ern({
        appContext: props.item.appContext,
        apps: resolvedApps,
        functionName: typeof props.item.functionName === "string" ? props.item.functionName : props.item.invocation?.tool ?? "",
        serverName: props.item.invocation?.server,
        toolName: props.item.invocation?.tool,
      })
    : null;
  return typeof ToolItemContent === "function" ? jsx().jsx(ToolItemContent, {
    conversationId: props.conversationId,
    hostId: props.hostId,
    item: props.item,
    matchingApp,
    renderMcpApps: true,
    shouldAutoExpandMcpApp: openOnRegistration,
    widgetStatePersistence: props.widgetStatePersistence,
    widgetOnly: true,
  }) : null;
}

const EMPTY_RESOLVED_APPS: unknown[] = [];

/** WidgetCleanupEffect（原 `tm`，导出 J）。 */
export function widgetCleanupEffect({ callIds, onCleanup }: { callIds: string[]; onCleanup?(callId: string): void }): null {
  const react = getReact?.();
  const shared = appSharedChunk as unknown as Record<string, any>;
  const initial = appInitialChunk as unknown as Record<string, any>;
  const scope = typeof shared.LX === "function" ? shared.LX(initial.$en) : null;
  const registrations = typeof shared.HX === "function" ? shared.HX(initial.hct) : null;
  react?.useLayoutEffect?.(() => {
    for (const callId of callIds) {
      if (onCleanup != null) { onCleanup(callId); continue; }
      const appId = typeof shared.eU === "function" ? shared.eU(callId) : callId;
      const registrationId = scope?.get?.(initial.mct, appId);
      if ((registrationId == null || registrations?.get?.(registrationId)?.sourceMcpAppId !== appId) && typeof initial.xct === "function") initial.xct(scope, appId);
    }
  }, [callIds, onCleanup, registrations, scope]);
  return null;
}
