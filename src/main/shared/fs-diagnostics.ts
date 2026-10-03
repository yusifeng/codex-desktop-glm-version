// shared chunk：文件系统代理 + rollout 诊断 + Chrome 工具族（低层底座导出）。
//
// 对应 src-DldfpmrL.ts 的 L60,001-65,000 区段（41 导出）：
//   - Zie（et）：rollout 诊断统计——扫描 codexHome 的 rollout 文件
//     （Gie 参数解析/Uie 初始汇总/Yie 文件扫描/Xie 单文件解析：
//     completedTurn/estimatedTurn/outputTokens/reasoningOutputTokens/
//     observedCompletedTurnWallTimeMs）+ Wie 汇总
//   - Qie（$）：有界目录树遍历计数——readdir 递归 + symlink 跳过 +
//     上限短路（eE 深度预算）
//   - l5（Q）/n5（X）：`openai-internal-testing` 市场名常量 + 工具查找
//   - dae（J）/fae（Y）：KF sqlite db 打开 + flag 读写（enabled +
//     updatedAt）
//   - pae（K）/x5（q）：db 查询族
//   - eae（Z）：条目枚举（options + parentId 过滤）
//   - k5（G）/q5（H）/z5（W）/B5（U）：Chrome 工具族（chromeConfigHome/
//     xdgConfigHome 解析 ioe（I）+ 配置读写）
//   - Yae（B）/toe（L）/noe（R）：Chrome 原生宿主配置写入（configPath +
//     expectedRevision）
//   - Jae（V）/i7（z）：marketplace 管理器 + 打包（e.t 惰性 CJS）
//   - koe（A）/T7（F）/Aoe（j）：平台命令执行（platform + runCommand 注入）
//   - Uoe（k）：会话依赖打包上传（sessionId/turnId/deps）
//   - cse（D）：tarball 上传（uploadUrl + contentLength）
//   - Pse（C）/Nse（w）/Fse（S）/Lse（b）/Ise（x）：输出队列/快照工具
//   - Dse（T）：调试快照收集
//   - ise（O）/Qse（v）/s9（y）：worker 宿主类群
//   - tce（p）：Windows capture 桥（extends RpcTarget）
//   - _se（E）：Windows 环境 bridge（extends RpcTarget）
//   - v9（_）/y9（m）/nce（g）：worker 转发工具
//
// 本模块为语义骨架：zod/RPC 家族消费已就绪（rpc-core/zod-facade），
// sqlite/chrome/worker 的注入面按签名声明。

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 内部测试市场名（原 `n5` = X）。 */
export const INTERNAL_TESTING_MARKETPLACE = "openai-internal-testing";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** app-server 客户端面（文件系统代理）。 */
export interface AppServerFsClient {
  codexHome: string;
  platformPath(): Promise<{ join(...parts: string[]): string }>;
}

/** rollout 诊断参数。 */
export interface RolloutDiagnosticsRequest {
  codexHome: string;
  params: Record<string, unknown>;
}

/** rollout 诊断结果。 */
export interface RolloutDiagnostics {
  completedTurnCount: number;
  estimatedTurnCount: number;
  observedCompletedTurnWallTimeMs: number;
  outputTokens: number;
  parsedRolloutCount: number;
  reasoningOutputTokens: number;
  rolloutCountWithCompletedTurns: number;
  rolloutCountWithEstimatedTurns: number;
  scannedRolloutCount: number;
  totalOutputTokens: number;
  totalReasoningOutputTokens: number;
}

/** 平台命令执行器（原 koe/T7/Aoe 的 runCommand 注入）。 */
export type RunCommand = (command: string, args: string[]) => Promise<{ stdout: string }>;

// ---------------------------------------------------------------------------
// rollout 诊断（原 `Zie`，导出 et）
// ---------------------------------------------------------------------------

/**
 * rollout 诊断统计（原 `Zie`）：
 * 扫描 codexHome 下的 rollout 文件并汇总 turn/token 统计。
 */
export async function collectRolloutDiagnostics(request: RolloutDiagnosticsRequest): Promise<RolloutDiagnostics> {
  void request;
  return {
    completedTurnCount: 0,
    estimatedTurnCount: 0,
    observedCompletedTurnWallTimeMs: 0,
    outputTokens: 0,
    parsedRolloutCount: 0,
    reasoningOutputTokens: 0,
    rolloutCountWithCompletedTurns: 0,
    rolloutCountWithEstimatedTurns: 0,
    scannedRolloutCount: 0,
    totalOutputTokens: 0,
    totalReasoningOutputTokens: 0,
  };
}

// ---------------------------------------------------------------------------
// 有界目录遍历（原 `Qie`，导出 $）
// ---------------------------------------------------------------------------

/**
 * 有界目录树遍历计数（原 `Qie`）：
 * readdir 递归 + symlink 跳过 + 文件数上限短路（深度预算耗尽返回 null）。
 */
export async function countFilesWithBudget(
  root: string,
  limit: number,
  client: AppServerFsClient,
  fsProxy: {
    readdir(path: string, options: { withFileTypes: true }, client: unknown): Promise<Array<{ isDirectory(): boolean; isFile(): boolean; name: string }>>;
    stat(path: string, client: unknown, options: { followSymlinks: false }): Promise<{ isSymbolicLink(): boolean }>;
  },
  depthBudget = 20,
): Promise<number | null> {
  const path = await client.platformPath();
  let remaining = depthBudget;
  async function walk(directory: string, allowance: number): Promise<number | null> {
    const entries = await fsProxy.readdir(directory, { withFileTypes: true }, client);
    let count = 0;
    for (const entry of entries) {
      if (entry.isFile()) {
        count += 1;
        if (count === allowance) return count;
        continue;
      }
      if (!entry.isDirectory()) continue;
      if (remaining === 0) return null;
      --remaining;
      const childPath = path.join(directory, entry.name);
      if ((await fsProxy.stat(childPath, client, { followSymlinks: false })).isSymbolicLink()) continue;
      const childCount = await walk(childPath, allowance - count);
      if (childCount == null) return null;
      count += childCount;
      if (count === allowance) return count;
    }
    return count;
  }
  return walk(root, limit);
}

import { isAbsolute, join } from "node:path";

// ---------------------------------------------------------------------------
// Chrome / 插件 / 应用发现低层工具
// ---------------------------------------------------------------------------

export interface ApplicationEntry {
  appPath: string;
  bundleId: string;
  displayName: string;
  isRunning?: boolean;
  lastUsedDateRanking?: number;
  processKeys?: string[];
  useCount?: number;
}

export type PlatformCommand = (argv: string[]) => Promise<{ code: number; stdout: string }>;

const defaultRunCommand: PlatformCommand = async (argv) => {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve, reject) => {
    const child = spawn(argv[0], argv.slice(1), { stdio: ["ignore", "pipe", "ignore"] });
    let stdout = ``;
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code: code ?? 1, stdout }));
  });
};

/** 内部插件 marketplace 目录（原 `l5`，导出 Q）。 */
export function pluginsDirectoryOf(codexHome: string): string {
  if (!isAbsolute(codexHome)) throw new Error(`Internal plugins require an absolute local Codex home.`);
  return join(codexHome, `.tmp`, `marketplaces`, INTERNAL_TESTING_MARKETPLACE);
}

/** Chrome 配置路径解析（原 `ioe`，导出 I）。 */
export function resolveChromePaths({ chromeConfigHome, homeDir, xdgConfigHome }: { chromeConfigHome?: string; homeDir: string; xdgConfigHome?: string }): string {
  return chromeConfigHome || xdgConfigHome || join(homeDir, `.config`);
}

/** bundle id → 应用（原 `koe`，导出 A）。 */
export async function resolveApplication(
  bundleId: string,
  { platform = process.platform, runCommand = defaultRunCommand }: { platform?: NodeJS.Platform; runCommand?: PlatformCommand } = {},
): Promise<ApplicationEntry | null> {
  if (bundleId.trim() === `` || platform !== `darwin`) return null;
  const result = await runCommand([`/usr/bin/mdfind`, `kMDItemCFBundleIdentifier == "${bundleId.replace(/"/g, `\\"`)}"`]);
  const appPath = result.code === 0 ? result.stdout.split(/\r?\n/).find((line) => line.endsWith(`.app`)) : undefined;
  if (appPath == null) return null;
  const infoPlist = join(appPath, `Contents`, `Info.plist`);
  const displayName =
    (await readPlistValue(infoPlist, `CFBundleDisplayName`, { platform, runCommand })) ??
    (await readPlistValue(infoPlist, `CFBundleName`, { platform, runCommand })) ??
    appPath.split(`/`).pop()?.replace(/\.app$/, ``) ?? bundleId;
  return { appPath, bundleId, displayName };
}

/** plist 字段读取（原 `T7`，导出 F）。 */
export async function readPlistValue(
  plistPath: string,
  key: string,
  { platform = process.platform, runCommand = defaultRunCommand }: { platform?: NodeJS.Platform; runCommand?: PlatformCommand } = {},
): Promise<string | null> {
  if (platform !== `darwin`) return null;
  try {
    const result = await runCommand([`/usr/libexec/PlistBuddy`, `-c`, `Print :${key}`, plistPath]);
    const value = result.stdout.trim();
    return result.code === 0 && value !== `` ? value : null;
  } catch {
    return null;
  }
}

/** macOS 应用清单（原 `C7`，导出 M）。 */
export async function listInstalledApplications(
  { lastUsedWithinDays, order }: { lastUsedWithinDays?: number; order?: string } = {},
  { nowMs = Date.now(), platform = process.platform, runCommand = defaultRunCommand }: { nowMs?: number; platform?: NodeJS.Platform; runCommand?: PlatformCommand } = {},
): Promise<ApplicationEntry[]> {
  if (platform !== `darwin`) return [];
  const result = await runCommand([
    `/usr/bin/mdfind`, `-0`,
    `kMDItemContentType == "com.apple.application-bundle" && kMDItemFSName == "*.app"`,
    `-attr`, `kMDItemDisplayName`, `-attr`, `kMDItemCFBundleIdentifier`,
    `-attr`, `kMDItemLastUsedDate_Ranking`, `-attr`, `kMDItemUseCount`,
  ]);
  if (result.code !== 0) return [];
  const metadataPattern = /^(.*?)\s+kMDItemDisplayName = (.*?)\s+kMDItemCFBundleIdentifier = (.*?)\s+kMDItemLastUsedDate_Ranking = (.*?)\s+kMDItemUseCount = (.*)$/;
  const excluded = new Set([`com.apple.finder.Open-Computer`, `com.openai.sky.CUAService`, `com.spotify.installer`]);
  const entries = result.stdout.split(`\0`).flatMap((record): ApplicationEntry[] => {
    const match = record.match(metadataPattern);
    if (match == null || !match[1].endsWith(`.app`) || match[3] === `(null)` || excluded.has(match[3])) return [];
    const lastUsedDateRanking = Date.parse(match[4]);
    const useCount = Number.parseInt(match[5], 10);
    return [{
      appPath: match[1], bundleId: match[3],
      displayName: (match[2] === `(null)` ? match[1].split(`/`).pop() : match[2])?.replace(/\.app$/, ``) ?? match[3],
      lastUsedDateRanking: Number.isNaN(lastUsedDateRanking) ? 0 : lastUsedDateRanking,
      useCount: Number.isNaN(useCount) ? 0 : useCount,
    }];
  });
  const cutoff = lastUsedWithinDays == null ? null : nowMs - lastUsedWithinDays * 86_400_000;
  const filtered = cutoff == null ? entries : entries.filter((entry) => (entry.lastUsedDateRanking ?? 0) >= cutoff);
  if (order === `display-name`) entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
  else if (order === `usage`) entries.sort((a, b) => (b.lastUsedDateRanking ?? 0) - (a.lastUsedDateRanking ?? 0) || (b.useCount ?? 0) - (a.useCount ?? 0) || a.displayName.localeCompare(b.displayName));
  return filtered.filter((entry, index) => filtered.findIndex((candidate) => candidate.appPath === entry.appPath) === index);
}

/** 已知 web 浏览器清单（原 `Ooe` 的 known fallback，导出 P）。 */
export async function listWebBrowsers(
  options: { discovery?: string; limit?: number; order?: string } = {},
  dependencies: { platform?: NodeJS.Platform; runCommand?: PlatformCommand } = {},
): Promise<ApplicationEntry[]> {
  if ((dependencies.platform ?? process.platform) !== `darwin` || options.limit === 0) return [];
  const applications = await listInstalledApplications({ order: options.order }, dependencies);
  const browsers: ApplicationEntry[] = [];
  for (const application of applications) {
    if (options.limit != null && browsers.length >= options.limit) break;
    const command = dependencies.runCommand ?? defaultRunCommand;
    const result = await command([`/usr/bin/plutil`, `-convert`, `json`, `-o`, `-`, join(application.appPath, `Contents`, `Info.plist`)]);
    if (result.code !== 0) continue;
    try {
      const plist = JSON.parse(result.stdout) as { CFBundleURLTypes?: Array<{ CFBundleURLSchemes?: string[] }> };
      if (plist.CFBundleURLTypes?.some((entry) => entry.CFBundleURLSchemes?.some((scheme) => scheme === `http` || scheme === `https`))) browsers.push(application);
    } catch { /* malformed plist is not a browser candidate */ }
  }
  return options.limit == null ? browsers : browsers.slice(0, options.limit);
}

// ---------------------------------------------------------------------------
// 压缩名兼容导出（41 别名中已实现/已声明的核心 12 个）
// ---------------------------------------------------------------------------

export {
  collectRolloutDiagnostics as et,
  countFilesWithBudget as $,
  resolveApplication as A,
  readPlistValue as F,
  resolveChromePaths as I,
  listInstalledApplications as M,
  listWebBrowsers as P,
  pluginsDirectoryOf as Q,
  INTERNAL_TESTING_MARKETPLACE as X,
};
