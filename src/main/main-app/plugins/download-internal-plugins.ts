// 内部插件下载与注册 + ripgrep 兜底搜索。
//
// 对应 main-C-Mhak1n.ts 92,666-92,769：
//   - lze downloadInternalPlugins：n.Z 下载 → realpath codex home →
//     addMarketplace（openai-internal-testing 校验）→ config/mcpServer/reload；
//     .download 临时文件的 ENOENT 静默（下载进行中）
//   - uze：fetch failed 的 60s 去重（per errorReporter per version）
//   - dze：addMarketplace 的 `#` 后缀回退（@/# 源的 ref 兼容）
//   - pze：ripgrep 兜底搜索（n.tt + resourcesPath 的 rg）
import { realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  Z as downloadPluginsAsset,
  Ho as internalPluginsConfigSchema,
  Q as pluginsDirectoryOf,
  X as INTERNAL_MARKETPLACE_KEY,
  Ef as recordSchema,
  Of as stringSchema,
  xf as looseObjectSchema,
  tt as ripgrepSearch,
  zn as rgExecutablePath,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { convertPathForExecutionHost } from "../misc/workspace-paths";

const logger = memoizedTaggedLogger("download-internal-plugins");
const FETCH_FAILED_DEDUPE_MS = 60_000;
/** fetch failed 去重账本（原 `DV`：errorReporter → version → 时间戳）。 */
const fetchFailedAtByReporter = new WeakMap<object, Map<string, number>>();

const marketplacesConfigSchema = (looseObjectSchema({
  marketplaces: (recordSchema(stringSchema(), looseObjectSchema({ source: stringSchema().optional(), source_type: stringSchema().optional() })) as unknown as {
    optional(): unknown;
  }).optional(),
}) as unknown as { parse(input: unknown): { marketplaces?: Record<string, { source?: string; source_type?: string }> } });

interface ErrorReporterLike {
  reportNonFatal(error: Error, context: { kind: string; tags: Record<string, unknown> }): void;
}

interface AppServerConnectionLike {
  getUserSavedConfiguration(): Promise<unknown>;
  addMarketplace(request: { source: string }): Promise<{ alreadyAdded: boolean; marketplaceName: string }>;
  sendAppServerRequest(method: string, params: unknown): Promise<unknown>;
}

/** 下载并注册内部插件市场（原 `lze`）。 */
async function downloadInternalPlugins({
  appServerConnection,
  config,
  codexHome,
  largeInternalPluginsConfig,
  downloadPlugins = downloadPluginsAsset as never,
  errorReporter,
  getInternalUpdateCdnRequestHeaders,
  shouldUseWslPaths = false,
}: {
  appServerConnection: AppServerConnectionLike;
  config: Record<string, unknown> & { version: string };
  codexHome: string;
  largeInternalPluginsConfig?: Record<string, unknown> | null;
  downloadPlugins?: (config: unknown, opts: Record<string, unknown>, largeConfig: unknown) => Promise<boolean>;
  errorReporter: ErrorReporterLike;
  getInternalUpdateCdnRequestHeaders?: () => Record<string, unknown>;
  shouldUseWslPaths?: boolean;
}): Promise<{ marketplaceUpdated: boolean }> {
  try {
    const downloaded = await downloadPlugins(
      (internalPluginsConfigSchema as unknown as { parse(input: unknown): unknown }).parse(config),
      { codexHome, getInternalUpdateCdnRequestHeaders },
      largeInternalPluginsConfig == null
        ? null
        : (internalPluginsConfigSchema as unknown as { parse(input: unknown): unknown }).parse(largeInternalPluginsConfig),
    );
    const pluginsDirectory = convertPathForExecutionHost(
      await realpath((pluginsDirectoryOf as (codexHome: string) => string)(codexHome)),
      shouldUseWslPaths,
    );
    if (!downloaded) {
      // 未下载（已是最新）：若市场已指向本地目录则无需更新。
      const { marketplaces } = marketplacesConfigSchema.parse(await appServerConnection.getUserSavedConfiguration());
      const internal = marketplaces?.[(INTERNAL_MARKETPLACE_KEY as string) as keyof typeof marketplaces];
      if (internal?.source_type === "local" && internal.source === pluginsDirectory)
        return { marketplaceUpdated: downloaded };
    }
    const { alreadyAdded, marketplaceName } = await addMarketplaceWithRefFallback(appServerConnection, pluginsDirectory);
    if (marketplaceName !== "openai-internal-testing")
      throw new Error("Internal plugins registered an unexpected marketplace.");
    const marketplaceUpdated = downloaded || !alreadyAdded;
    if (marketplaceUpdated) await appServerConnection.sendAppServerRequest("config/mcpServer/reload", undefined);
    return { marketplaceUpdated };
  } catch (error) {
    // 下载进行中的 .download 临时文件被清理：静默跳过本轮。
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT" &&
      "path" in error &&
      typeof (error as { path?: unknown }).path == "string" &&
      ((error as { path: string }).path).endsWith(".download") &&
      dirname((error as { path: string }).path) === (pluginsDirectoryOf as (codexHome: string) => string)(codexHome)
    )
      return { marketplaceUpdated: false };
    throw (
      shouldReportFetchFailed(error, errorReporter, config.version) &&
        errorReporter.reportNonFatal(error instanceof Error ? error : new Error(String(error)), {
          kind: "download-internal-plugins",
          tags: { version: config.version },
        }),
      logger().error("Failed to download internal plugins", {
        safe: { version: config.version },
        sensitive: { error },
      }),
      error
    );
  }
}

/** fetch failed 去重（原 `uze`）：同一 version 60s 内只报一次。 */
function shouldReportFetchFailed(error: unknown, errorReporter: ErrorReporterLike, version: string): boolean {
  if (!(error instanceof TypeError && error.message === "fetch failed")) return true;
  const now = Date.now();
  let byVersion = fetchFailedAtByReporter.get(errorReporter);
  const previous = byVersion?.get(version);
  return previous != null && now >= previous && now - previous < FETCH_FAILED_DEDUPE_MS
    ? false
    : (byVersion ?? (byVersion = new Map(), fetchFailedAtReporterSet(errorReporter, byVersion)),
      byVersion.set(version, now),
      true);
}

function fetchFailedAtReporterSet(errorReporter: ErrorReporterLike, byVersion: Map<string, number>): void {
  fetchFailedAtByReporter.set(errorReporter as object, byVersion);
}

/** addMarketplace 的 ref 兼容回退（原 `dze`）：@/# 源追加 `#`。 */
async function addMarketplaceWithRefFallback(appServerConnection: AppServerConnectionLike, source: string): Promise<{ alreadyAdded: boolean; marketplaceName: string }> {
  try {
    return await appServerConnection.addMarketplace({ source });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== "--ref is only supported for git marketplace sources" ||
      (!source.includes("@") && !source.includes("#"))
    )
      throw error;
    return appServerConnection.addMarketplace({ source: `${source}#` });
  }
}

/** host 校验（原 `fze`）。 */
function assertLocalHost(hostId: string): void {
  if (hostId !== "local")
    throw new Error("Internal plugins download is currently only supported on the local host.");
}

/** ripgrep 兜底搜索（原 `pze`）：无 rg 时返回空结果。 */
async function searchWithRipgrep({ query, cwd, limit }: { query: string; cwd: string | null; limit: number }): Promise<unknown[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0 || !cwd) return [];
  const directory = resolve(cwd);
  const rgPath = ripgrepPathOf();
  return (
    (await (ripgrepSearch as (query: string, paths: string[], limit: number, opts: Record<string, unknown>) => Promise<unknown[]>)(trimmed, [directory], limit, {
      rgPath: rgPath ?? undefined,
      runCommand: rgPath == null ? emptyRipgrepFallback : undefined,
    })) ?? []
  );
}

function emptyRipgrepFallback(): Promise<{ stdout: string; code: number }> {
  return Promise.resolve({ stdout: "", code: 2 });
}

function ripgrepPathOf(): string | null {
  return (rgExecutablePath as (resourcesPath: string) => string | null)(process.resourcesPath);
}

export {
  downloadInternalPlugins,
  assertLocalHost,
  searchWithRipgrep,
};
