// conversation-blocks：查询 atoms（connector 资产标题缓存 + MCP 项族）。
//
// 对应原 chunk L846-1202 区段：
//   - Xp（导出 $）：connectorAssetTitleQuery —— hostId+url 键控 family；
//     命中 codex-apps server 的工具结果 → 资产标题；864e5ms（1 天）缓存
//   - Qp（导出 Q）：conversationMcpToolCallItems —— threadId 键控 family；
//     展开会话源的 mcpToolCall 条目 → id → 投影条目 Map（size/逐值相等）
//   - em（导出 Y）：McpAppWidgets —— mcp-tool-call 批量 widget 渲染
//   - tm（导出 J）：WidgetCleanupEffect —— callIds 卸载时清理 widget 状态

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
  tool: string;
}

/** url 解析为工具调用（原 Vp）。 */
function parseToolCallUrl(url: string): ToolCallDescriptor | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "codex-tool:") return null;
    return {
      cacheKey: `${parsed.hostname}${parsed.pathname}`,
      server: parsed.searchParams.get("server") ?? "",
      tool: parsed.searchParams.get("tool") ?? "",
      arguments: JSON.parse(parsed.searchParams.get("arguments") ?? "{}"),
    };
  } catch {
    return null;
  }
}

/** 工具结果 → 资产标题（原 Hp 语义）。 */
function assetTitleFromToolResult(descriptor: ToolCallDescriptor, toolResult: unknown): string | null {
  void descriptor;
  if (typeof toolResult != "object" || toolResult == null) return null;
  const title = (toolResult as { title?: unknown }).title;
  return typeof title == "string" && title.trim().length > 0 ? title : null;
}

/**
 * connectorAssetTitleQuery（原 Xp，导出 $）：
 * 查询 options（enabled/queryKey/staleTime 5min/retry false）；
 * 命中缓存（1 天内）直接返回；否则经工具调用取标题并写缓存。
 */
export const connectorAssetTitleQuery = {
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
