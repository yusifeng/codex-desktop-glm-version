// conversation-blocks：查询 atoms（connector 资产标题缓存 + MCP 项族）。
//
// 对应原 chunk L846-1202 区段：
//   - Xp（导出 $）：connectorAssetTitleQuery —— hostId+url 键控 family；
//     命中 codex-apps server 的工具结果 → 资产标题；864e5ms（1 天）缓存
//   - Qp（导出 Q）：conversationMcpToolCallItems —— threadId 键控 family；
//     展开会话源的 mcpToolCall 条目 → id → 投影条目 Map（size/逐值相等）
//   - em（导出 Y）：McpAppWidgets —— mcp-tool-call 批量 widget 渲染
//   - tm（导出 J）：WidgetCleanupEffect —— callIds 卸载时清理 widget 状态

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

/** 连接器资产标题缓存条目。 */
interface ConnectorAssetCacheEntry {
  resolvedAt: number;
  title: string;
}

/** 资产标题缓存（原 Jp：conversation-sources:connector-asset-title-cache）。 */
const connectorAssetTitleCache: Record<string, ConnectorAssetCacheEntry> = {};

/** 缓存 TTL（原 qp = 864e5）。 */
const ASSET_TITLE_CACHE_TTL_MS = 864e5;

/** url → 工具调用描述（原 Vp 语义）。 */
interface ToolCallDescriptor {
  arguments?: unknown;
  cacheKey: string;
  server: string;
  sourceAppId: string;
  tool: string;
}

/** url 解析为工具调用（原 Vp）。 */
function parseToolCallUrl(url: string): ToolCallDescriptor | null {
  const initial = appInitialChunk as unknown as Record<string, any>;
  try {
    const parsed = new URL(url);
    const source = typeof initial.Q0t === "function" ? initial.Q0t(url) : null;
    if (source?.appId !== "google-drive") return null;
    const linkId = typeof initial.R9t === "function" ? initial.R9t(parsed) : parsed.searchParams.get("link_id");
    const fileId = parsed.pathname.match(/\/(?:d|folders)\/(?:e\/)?([^/]+)/u)?.[1] ?? parsed.searchParams.get("id");
    if (linkId == null || fileId == null) return null;
    return {
      arguments: { fields: "id,name,mimeType,webViewLink", fileId },
      cacheKey: `google-drive:${linkId}:${fileId}`,
      server: "codex_apps",
      sourceAppId: "google-drive",
      tool: "google_drive.get_file_metadata",
    };
  } catch {
    return null;
  }
}

/** 工具结果 → 资产标题（原 Hp 语义）。 */
function assetTitleFromToolResult(descriptor: ToolCallDescriptor, toolResult: unknown): string | null {
  const initial = appInitialChunk as unknown as Record<string, any>;
  if (descriptor.sourceAppId === "google-drive" && typeof initial.F9t === "function") {
    const structured = initial.F9t((toolResult as { structuredContent?: unknown } | null)?.structuredContent);
    if (typeof structured?.title === "string" && structured.title.trim()) return structured.title;
  }
  if (typeof toolResult != "object" || toolResult == null) return null;
  const title = (toolResult as { title?: unknown; structuredContent?: { title?: unknown } }).title
    ?? (toolResult as { structuredContent?: { title?: unknown } }).structuredContent?.title;
  return typeof title == "string" && title.trim().length > 0 ? title : null;
}

/**
 * connectorAssetTitleQuery（原 Xp，导出 $）：
 * 查询 options（enabled/queryKey/staleTime 5min/retry false）；
 * 命中缓存（1 天内）直接返回；否则经工具调用取标题并写缓存。
 */
const fallbackConnectorAssetTitleQuery = {
  keyFor({ hostId, url }: { hostId: string; url: string }): string {
    return JSON.stringify([hostId, parseToolCallUrl(url)?.cacheKey ?? url]);
  },
  options({ hostId, url }: { hostId: string; url: string }) {
    const descriptor = parseToolCallUrl(url);
    const cacheKey = descriptor == null ? null : JSON.stringify([hostId, descriptor.cacheKey]);
    return {
      enabled: descriptor != null,
      queryKey: ["connector-asset-title", cacheKey ?? JSON.stringify([hostId, url])],
      retry: false,
      staleTime: 300_000,
    };
  },
  async queryFn({ hostId, url }: { hostId: string; url: string }): Promise<string | null> {
    const descriptor = parseToolCallUrl(url);
    const cacheKey = descriptor == null ? null : JSON.stringify([hostId, descriptor.cacheKey]);
    if (descriptor == null || cacheKey == null) return null;
    const cached = connectorAssetTitleCache[cacheKey];
    if (cached != null && Date.now() - cached.resolvedAt < ASSET_TITLE_CACHE_TTL_MS) return cached.title;
    // 工具调用执行在 app-server 连接接入后装配（原 Va）
    void descriptor;
    return null;
  },
};

export let connectorAssetTitleQuery: unknown = fallbackConnectorAssetTitleQuery;

/** 原 Zp 初始化后装配真实 scoped query family。 */
export function initializeConnectorAssetTitleQueryRuntime(): void {
  if (connectorAssetTitleQuery !== fallbackConnectorAssetTitleQuery) return;
  const shared = appSharedChunk as unknown as Record<string, any>;
  const initial = appInitialChunk as unknown as Record<string, any>;
  if (typeof shared.QX !== "function" || shared.ZI == null || typeof initial.dun !== "function") return;
  const cacheSignal = initial.dun("conversation-sources:connector-asset-title-cache", {});
  const cacheAvailable = typeof shared.sZ === "function"
    ? shared.sZ(shared.ZI, ({ get }: { get(signal: unknown): unknown }) => get(cacheSignal) != null)
    : null;
  connectorAssetTitleQuery = shared.QX(
    shared.ZI,
    ({ hostId, url }: { hostId: string; url: string }, { get, scope }: { get(signal: unknown): any; scope: { get(signal: unknown): any; set(signal: unknown, value: unknown): void } }) => {
      const descriptor = parseToolCallUrl(url);
      const cacheKey = descriptor == null ? null : JSON.stringify([hostId, descriptor.cacheKey]);
      const hasCache = cacheAvailable == null ? true : get(cacheAvailable);
      return {
        enabled: descriptor != null && hasCache,
        queryFn: async () => {
          const cache = scope.get(cacheSignal) as Record<string, ConnectorAssetCacheEntry> | null;
          if (descriptor == null || cacheKey == null || cache == null) return null;
          const cached = cache[cacheKey];
          if (cached != null && Date.now() - cached.resolvedAt < ASSET_TITLE_CACHE_TTL_MS) return cached.title;
          try {
            if (typeof initial.Rdt !== "function") return null;
            const raw = await initial.Rdt(scope, hostId, descriptor.server, descriptor.tool, descriptor.arguments);
            const toolResult = typeof initial.sXt === "function"
              ? initial.sXt({ isCodexAppsServer: descriptor.server === "codex_apps", toolResult: raw })
              : raw;
            const title = assetTitleFromToolResult(descriptor, toolResult);
            if (title != null) scope.set(cacheSignal, { ...scope.get(cacheSignal), [cacheKey]: { resolvedAt: Date.now(), title } });
            return title;
          } catch {
            return null;
          }
        },
        queryKey: ["connector-asset-title", cacheKey ?? JSON.stringify([hostId, url])],
        retry: false,
        staleTime: (shared.$O?.FIVE_MINUTES as number | undefined) ?? 300_000,
      };
    },
    { key: ({ hostId, url }: { hostId: string; url: string }) => JSON.stringify([hostId, parseToolCallUrl(url)?.cacheKey ?? url]) },
  );
}

/** MCP 工具调用投影条目。 */
export interface McpToolCallProjection {
  id: string;
  type: string;
  [key: string]: unknown;
}

/**
 * conversationMcpToolCallItems（原 Qp，导出 Q）：
 * threadId 键控 family；展开会话源条目中的 mcpToolCall → id → 投影 Map。
 */
export function createConversationMcpToolCallItems(
  conversationItems: Array<{ items?: Array<{ id?: string; type?: string }> } | null> | null,
  projectItem: (item: { id?: string }) => { type?: string } | null,
): Map<string, McpToolCallProjection> {
  const projections = new Map<string, McpToolCallProjection>();
  if (conversationItems == null) return projections;
  for (const source of conversationItems) {
    if (source == null) continue;
    for (const item of source.items ?? []) {
      if (item.type !== "mcpToolCall" || item.id == null) continue;
      const projected = projectItem(item);
      if (projected != null) projections.set(item.id, { id: item.id, ...(projected as Record<string, unknown>) } as McpToolCallProjection);
    }
  }
  return projections;
}

const fallbackConversationMcpToolCallItems = {
  resolve: createConversationMcpToolCallItems,
};
export let conversationMcpToolCallItems: unknown = fallbackConversationMcpToolCallItems;

/** 原 $p 初始化后装配 thread-keyed MCP item family。 */
export function initializeConversationMcpToolCallItemsRuntime(): void {
  if (conversationMcpToolCallItems !== fallbackConversationMcpToolCallItems) return;
  const shared = appSharedChunk as unknown as Record<string, any>;
  const initial = appInitialChunk as unknown as Record<string, any>;
  if (typeof shared.rZ !== "function" || shared.ZI == null) return;
  conversationMcpToolCallItems = shared.rZ(
    shared.ZI,
    (threadKey: { threadId: string }, { get, scope }: { get(signal: unknown, parameter?: unknown): any; scope: unknown }) => {
      const projections = new Map<string, McpToolCallProjection>();
      const sources = get(initial.I_t, threadKey);
      if (sources == null) return projections;
      for (const source of sources) {
        get(initial.V_t, source);
        const thread = typeof initial.j_t === "function" ? initial.j_t(scope, source) : null;
        const items = typeof initial.w$t === "function" ? initial.w$t(thread?.items ?? []) : (thread?.items ?? []);
        for (const item of items) {
          if (item?.type !== "mcpToolCall" || item.id == null) continue;
          const projected = get(initial.A_t, { ...source, itemId: item.id });
          projections.set(item.id, projected?.type === "mcpToolCall" ? projected : item);
        }
      }
      return projections;
    },
    {
      owner: (key: { threadId: string }) => key.threadId,
      isEqual: (left: Map<string, unknown>, right: Map<string, unknown>) => {
        if (left.size !== right.size) return false;
        for (const [key, value] of left) if (right.get(key) !== value) return false;
        return true;
      },
    },
  );
}
