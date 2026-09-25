// browser sidebar 注释模式站点状态：/aura/site_status 查询 + 24h 缓存。
//
// 对应 main-C-Mhak1n.ts 98,085-98,159：
//   - qBe：feature_status schema（Record<string, boolean>）
//   - ZBe：工厂（hostname 规范化 → 24h 缓存 Map + in-flight 去重；查询失败
//     仅告警并返回 false）
//   - QBe：空实现降级（remote/无后端环境）
//   - rU/$Be：hostname 规范化（去 www. 前缀）与查询路径构造
//
// 消费者：R8 IAB manager（123,491）。
// 模块加载期副作用：仅 logger。

import {
  wf as objectSchema,
  Ef as recordSchema,
  Of as stringSchema,
  gf as booleanSchema,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { vt as authedFetch, Tt as DESKTOP_ORIGINATOR, Et as DEV_API_BASE_URL, Kt as PROD_API_BASE_URL } from "@chunk/bootstrap";

const logger = memoizedTaggedLogger("browser-sidebar-comment-mode-site-status");

const SITE_STATUS_TTL_MS = 86_400_000;
const COMMENT_MODE_FEATURE = "agent";

const siteStatusSchema = objectSchema({ feature_status: recordSchema(stringSchema(), booleanSchema()) });

/** 默认 desktop API 选项（原 `XBe`）。 */
const DEFAULT_DESKTOP_API_OPTIONS = { desktopOriginator: DESKTOP_ORIGINATOR, devApiBaseUrl: DEV_API_BASE_URL, prodApiBaseUrl: PROD_API_BASE_URL };

/** app-server 客户端面（结构化子集，authedFetch 入参）。 */
export type SiteStatusAppServerClient = Parameters<typeof authedFetch>[0]["appServerClient"];

/** 站点状态查询面。 */
export interface CommentModeSiteStatus {
  cachedCommentModeBlocked(url: string): boolean | null;
  isCommentModeBlocked(url: string): Promise<boolean>;
}

/** hostname 规范化（原 `rU`）：http(s) 限定 + 小写 + 去 www. 前缀。 */
function normalizedHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const hostname = parsed.hostname.trim().toLowerCase();
    if (hostname.length === 0) return null;
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return null;
  }
}

/** 查询路径（原 `$Be`）：/aura/site_status?site_url=<url>）。 */
function siteStatusPath(url: string): string {
  return `/aura/site_status?${new URLSearchParams({ site_url: url }).toString()}`;
}

/**
 * 站点状态工厂（原 `ZBe`）：
 * 缓存命中且未过期直接返回；in-flight 去重共享同一次查询；查询失败告警并
 * 返回 false（不缓存）。
 */
export function createCommentModeSiteStatus({
  appServerClient,
  desktopApiOptions = DEFAULT_DESKTOP_API_OPTIONS,
  now = Date.now,
}: {
  appServerClient: SiteStatusAppServerClient;
  desktopApiOptions?: { desktopOriginator: unknown; devApiBaseUrl: unknown; prodApiBaseUrl: unknown };
  now?: () => number;
}): CommentModeSiteStatus {
  const cache = new Map<string, { blocked: boolean; timestampMs: number }>();
  const inFlight = new Map<string, Promise<boolean>>();

  function cachedCommentModeBlocked(url: string): boolean | null {
    const hostname = normalizedHostname(url);
    if (hostname == null) return false;
    const entry = cache.get(hostname);
    return entry == null || now() - entry.timestampMs >= SITE_STATUS_TTL_MS
      ? (entry != null && cache.delete(hostname), null)
      : entry.blocked;
  }

  async function isCommentModeBlocked(url: string): Promise<boolean> {
    const cached = cachedCommentModeBlocked(url);
    if (cached != null) return cached;
    const hostname = normalizedHostname(url);
    if (hostname == null) return false;
    const pending = inFlight.get(hostname);
    if (pending != null) return pending;
    const request = fetchSiteStatus(url, hostname).finally(() => {
      if (inFlight.get(hostname) === request) inFlight.delete(hostname);
    });
    inFlight.set(hostname, request);
    return request;
  }

  async function fetchSiteStatus(url: string, hostname: string): Promise<boolean> {
    try {
      const parsed = await loadSiteStatus(url);
      if (parsed == null) return false;
      const blocked = parsed.feature_status[COMMENT_MODE_FEATURE] === true;
      cache.set(hostname, { blocked, timestampMs: now() });
      return blocked;
    } catch (error) {
      logger().warning("failed to load browser sidebar comment mode site status", {
        safe: {},
        sensitive: { error },
      });
      return false;
    }
  }

  async function loadSiteStatus(url: string): Promise<{ feature_status: Record<string, unknown> } | null> {
    const response = (await authedFetch({
      action: "load browser site status",
      appServerClient,
      desktopApiOptions,
      path: siteStatusPath(url),
    })) as Response;
    if (!response.ok) {
      logger().warning("browser sidebar comment mode site status request failed", {
        safe: { status: response.status },
        sensitive: {},
      });
      return null;
    }
    return (siteStatusSchema as unknown as { parse(input: unknown): { feature_status: Record<string, unknown> } }).parse(JSON.parse(await response.text()));
  }

  return { cachedCommentModeBlocked, isCommentModeBlocked };
}

/** 空实现降级（原 `QBe`）。 */
export function createNoopCommentModeSiteStatus(): CommentModeSiteStatus {
  return { cachedCommentModeBlocked: () => false, isCommentModeBlocked: async () => false };
}
