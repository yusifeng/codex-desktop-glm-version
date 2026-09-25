// 桌面日志反馈归档（URe/TV）+ 诊断收集器。
//
// 对应 main-C-Mhak1n.ts 91,999-92,479：
//   - kRe collectChromeNativeHostDiagnostics（92,001-92,060）：chrome native
//     host manifest + chromeNativeHostsV2 的路径展开报告与快照
//   - _V/ARe 安全小文件读取（92,061-92,088，1MiB 上限 + O_NOFOLLOW + dev/ino 复核）
//   - jRe/MRe manifest 解析（92,089-92,126）
//   - NRe/PRe chrome 插件缓存路径定位（92,127-92,147）
//   - FRe/vV/yV realpath 展开（92,148-92,182）
//   - IRe flavor → chrome host 路径（92,183-92,185）
//   - LRe collectProcessMemoryDiagnostics（92,186-92,241）：进程表 +
//     codex 进程深度标注（BFS）+ 系统内存摘要
//   - URe/TV 导出契约（92,249-92,395）：3 天日志枚举（当天 session 优先）→
//     ~200MiB 分片 tar.gz 打包（ustar 头 + gzip）→ 诊断 JSON 快照 →
//     archiveId 记账（CV Map）；TV 按 archiveId 删除
//
// 本模块是 main chunk 两个对外导出（exports.t/exports.n）的实现，
// 已被重写的 upload chunk 消费（@chunk/main 的 t/n）。
import { createReadStream, createWriteStream, constants as fsConstants } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { tmpdir, totalmem, freemem } from "node:os";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { createGzip, gzip as gzipCallback } from "node:zlib";
import {
  open as openFile,
  appendFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  wf as objectSchema,
  Of as stringSchema,
  hf as arraySchema,
  Mf as jsonSchema,
  Oi as codexHome,
  Kt as chromeNativeHostManifestPath,
  Gt as chromeNativeHostsV2Path,
  qt as chromeHostsConfigPath,
  Vl as marketplaceCacheChannel,
  Al as devChromeHostPath,
  jl as internalChromeHostPath,
  Ml as betaChromeHostPath,
  rn as readProcessTable,
  En as primaryRuntimeDiagnostics,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { in as BuildFlavor, Xt as desktopLogRootDir, on as appSessionId } from "@chunk/bootstrap";

const gzipAsync = promisify(gzipCallback);
const logger = memoizedTaggedLogger("feedback-desktop-log-archive");

// ---------------------------------------------------------------------------
// flavor 谓词（原 4,862-4,876 的 Gi/Ki/qi，R2 区间的小工具，此处内联）
// ---------------------------------------------------------------------------

const USE_INTERNAL_CHROME_PLUGIN = "CODEX_USE_INTERNAL_CHROME_PLUGIN";

function useInternalChromePlugin(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[USE_INTERNAL_CHROME_PLUGIN] === "1";
}

function usesDevChromeHost(flavor: string, env: NodeJS.ProcessEnv = process.env): boolean {
  return flavor === (BuildFlavor as { Dev: string }).Dev && !useInternalChromePlugin(env);
}

function usesInternalChromeHost(flavor: string, env: NodeJS.ProcessEnv = process.env): boolean {
  switch (flavor) {
    case (BuildFlavor as { Dev: string }).Dev:
      return useInternalChromePlugin(env);
    case (BuildFlavor as { InternalAlpha: string }).InternalAlpha:
    case (BuildFlavor as { Nightly: string }).Nightly:
      return true;
    case (BuildFlavor as { Agent: string }).Agent:
    case (BuildFlavor as { Prod: string }).Prod:
    case (BuildFlavor as { PublicBeta: string }).PublicBeta:
      return false;
    default:
      return false;
  }
}

function usesProductionChromeHost(flavor: string): boolean {
  return flavor === (BuildFlavor as { PublicBeta: string }).PublicBeta || flavor === (BuildFlavor as { Prod: string }).Prod;
}

/** flavor → chrome native host manifest 路径（原 `IRe`）。 */
function chromeHostPathForFlavor(flavor: string): string | null {
  return usesDevChromeHost(flavor)
    ? (devChromeHostPath as string)
    : usesInternalChromeHost(flavor)
      ? (internalChromeHostPath as string)
      : usesProductionChromeHost(flavor)
        ? (betaChromeHostPath as string)
        : null;
}

// ---------------------------------------------------------------------------
// 安全小文件读取（原 `_V`/`ARe`）
// ---------------------------------------------------------------------------

const MAX_SNAPSHOT_BYTES = 1_048_576;

interface FileSnapshot {
  contents: Buffer;
  name: string;
  sourcePath: string;
}

/** 1MiB 小文件的防篡改读取（原 `ARe`）：O_NOFOLLOW + dev/ino/size 复核。 */
async function readSmallFileSnapshot(path: string): Promise<FileSnapshot | null> {
  try {
    const before = await lstat(path);
    if (!before.isFile() || before.size > MAX_SNAPSHOT_BYTES) return null;
    const handle = await openFile(path, process.platform === "win32" ? "r" : fsConstants.O_NOFOLLOW);
    try {
      const opened = await handle.stat();
      if (!opened.isFile() || opened.size > MAX_SNAPSHOT_BYTES || opened.dev !== before.dev || opened.ino !== before.ino)
        return null;
      const contents = Buffer.alloc(opened.size);
      let offset = 0;
      while (offset < contents.length) {
        const { bytesRead } = await handle.read(contents, offset, contents.length - offset, offset);
        if (bytesRead === 0) return null;
        offset += bytesRead;
      }
      return (await handle.stat()).size === opened.size
        ? { contents, name: basename(path), sourcePath: path }
        : null;
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
}

/** 逐候选读取，取第一个成功（原 `_V`）。 */
async function firstSnapshotOf(paths: string[]): Promise<FileSnapshot | null> {
  return (await Promise.all(paths.map((path) => readSmallFileSnapshot(path)))).find((snapshot) => snapshot != null) ?? null;
}

// ---------------------------------------------------------------------------
// manifest 解析（原 `jRe`/`MRe`）
// ---------------------------------------------------------------------------

const nativeHostManifestSchema = objectSchema({ path: (stringSchema() as unknown as { trim(): { min(n: number): unknown } }).trim().min(1) });
const nativeHostsV2Schema = objectSchema({ entries: arraySchema(jsonSchema()) });
const nativeHostsV2EntrySchema = objectSchema({
  nativeHostNames: arraySchema((stringSchema() as unknown as { trim(): { min(n: number): unknown } }).trim().min(1)),
  paths: objectSchema({
    browserClientPath: (stringSchema() as unknown as { trim(): { min(n: number): { optional(): unknown } } }).trim().min(1).optional(),
    extensionHostPath: (stringSchema() as unknown as { trim(): { min(n: number): unknown } }).trim().min(1),
  }),
});

/** manifest → native host 路径（原 `jRe`）。 */
function parseNativeHostManifest(snapshot: FileSnapshot | null): { nativeHostPath: string | null; parseErrorCode: string | null } {
  if (snapshot == null) return { nativeHostPath: null, parseErrorCode: null };
  try {
    const parsed = (nativeHostManifestSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { path: string } } }).safeParse(
      JSON.parse(snapshot.contents.toString("utf8")),
    );
    return parsed.success
      ? { nativeHostPath: parsed.data!.path, parseErrorCode: null }
      : { nativeHostPath: null, parseErrorCode: "INVALID_STRUCTURE" };
  } catch {
    return { nativeHostPath: null, parseErrorCode: "INVALID_JSON" };
  }
}

/** chromeNativeHostsV2 → 条目表（原 `MRe`）。 */
function parseNativeHostsV2(snapshot: FileSnapshot | null): {
  entries: Array<{ nativeHostNames: string[]; browserClientPath: string | null; extensionHostPath: string }>;
  invalidEntryCount: number;
  parseErrorCode: string | null;
} {
  if (snapshot == null) return { entries: [], invalidEntryCount: 0, parseErrorCode: null };
  try {
    const parsed = (nativeHostsV2Schema as unknown as { safeParse(input: unknown): { success: boolean; data?: { entries: unknown[] } } }).safeParse(
      JSON.parse(snapshot.contents.toString("utf8")),
    );
    if (!parsed.success) return { entries: [], invalidEntryCount: 0, parseErrorCode: "INVALID_STRUCTURE" };
    const entries = parsed.data!.entries.flatMap((raw) => {
      const entry = (nativeHostsV2EntrySchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { nativeHostNames: string[]; paths: { browserClientPath?: string; extensionHostPath: string } } } }).safeParse(raw);
      return entry.success
        ? [
            {
              nativeHostNames: entry.data!.nativeHostNames,
              browserClientPath: entry.data!.paths.browserClientPath ?? null,
              extensionHostPath: entry.data!.paths.extensionHostPath,
            },
          ]
        : [];
    });
    return {
      entries,
      invalidEntryCount: parsed.data!.entries.length - entries.length,
      parseErrorCode: null,
    };
  } catch {
    return { entries: [], invalidEntryCount: 0, parseErrorCode: "INVALID_JSON" };
  }
}

// ---------------------------------------------------------------------------
// chrome 插件缓存路径（原 `NRe`/`PRe`/`FRe`/`vV`/`yV`）
// ---------------------------------------------------------------------------

const MAX_CACHE_PATHS = 100;

/** extension-host 路径 → chrome 插件缓存根（原 `NRe`）。 */
function chromePluginCachePath(hostPath: string): string | null {
  if (!isAbsolute(hostPath)) return null;
  let dir = dirname(hostPath);
  while (dir !== dirname(dir)) {
    if (basename(dir) === "extension-host") {
      const cacheRoot = dirname(dirname(dir));
      if (isOpenAiBundledPluginCache(cacheRoot)) return cacheRoot;
    }
    dir = dirname(dir);
  }
  return null;
}

/** plugins/cache/openai-bundled/chrome[-dev|-internal] 校验（原 `PRe`）。 */
function isOpenAiBundledPluginCache(path: string): boolean {
  const channel = basename(path);
  return (
    (channel === "chrome-dev" || channel === "chrome-internal" || channel === "chrome") &&
    basename(dirname(path)) === "openai-bundled" &&
    basename(dirname(dirname(path))) === "cache" &&
    basename(dirname(dirname(dirname(path)))) === "plugins"
  );
}

function errorCodeOf(error: unknown): string {
  return typeof error == "object" && error && "code" in error && typeof (error as { code?: unknown }).code == "string"
    ? (error as { code: string }).code
    : "UNKNOWN";
}

/** realpath 展开（原 `vV`）。 */
async function unfurl(path: string): Promise<{ path: string | null; errorCode: string | null }> {
  try {
    return { path: await realpath(path), errorCode: null };
  } catch (error) {
    return { path: null, errorCode: errorCodeOf(error) };
  }
}

/** 插件缓存目录列表（原 `FRe`）：realpath 防逃逸 + latest 排除 + 100 上限。 */
async function listChromePluginCachePaths(cachePath: string): Promise<{ paths: string[]; truncated: boolean; errorCode: string | null }> {
  try {
    if (!(await lstat(cachePath)).isDirectory())
      return { paths: [], truncated: false, errorCode: "NOT_DIRECTORY" };
    const resolved = await realpath(cachePath);
    const expected = join(
      await realpath(dirname(dirname(dirname(dirname(cachePath))))),
      "plugins",
      "cache",
      marketplaceCacheChannel as string,
      basename(cachePath),
    );
    const normalize = (value: string) => (process.platform === "win32" ? value.toLowerCase() : value);
    if (normalize(resolved) !== normalize(expected))
      return { paths: [], truncated: false, errorCode: "UNEXPECTED_REALPATH" };
    const entries = (await readdir(resolved, { withFileTypes: true }))
      .filter((entry) => entry.name !== "latest" && entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));
    return {
      paths: entries.slice(0, MAX_CACHE_PATHS).map((entry) => join(cachePath, entry.name)),
      truncated: entries.length > MAX_CACHE_PATHS,
      errorCode: null,
    };
  } catch (error) {
    return { paths: [], truncated: false, errorCode: errorCodeOf(error) };
  }
}

// ---------------------------------------------------------------------------
// chrome native host 诊断（原 `kRe`）
// ---------------------------------------------------------------------------

/** chrome native host 的路径报告与快照（原 `kRe`）。 */
async function collectChromeNativeHostDiagnostics(flavor: string): Promise<{
  pathsReport: {
    manifest: { path: string; parseErrorCode: string | null; nativeHostPath: string | null; unfurledNativeHostPath: string | null; unfurledNativeHostPathErrorCode: string | null; chromePluginCachePath: string | null; cachedChromePluginPaths: string[]; cachedChromePluginPathsTruncated: boolean; chromePluginCacheErrorCode: string | null } | null;
    chromeNativeHostsV2: { path: string; parseErrorCode: string | null; invalidEntryCount: number; entries: Array<Record<string, unknown>> } | null;
  } | null;
  snapshots: FileSnapshot[];
}> {
  const home = codexHome();
  const hostPath = chromeHostPathForFlavor(flavor);
  const manifestPath = hostPath == null ? null : (chromeNativeHostManifestPath as unknown as (hostPath: string) => string)(hostPath);
  const [manifestSnapshot, hostsV2Snapshot] = await Promise.all([
    firstSnapshotOf((chromeHostsConfigPath as unknown as (opts: { codexHome: string }) => string[])({ codexHome: home })),
    firstSnapshotOf(manifestPath == null ? [] : (chromeNativeHostsV2Path as unknown as (manifestPath: string) => string[])(manifestPath)),
  ]);
  const snapshots = [manifestSnapshot, hostsV2Snapshot].filter((snapshot): snapshot is FileSnapshot => snapshot != null);
  if (snapshots.length === 0) return { pathsReport: null, snapshots };
  const manifestParse = parseNativeHostManifest(hostsV2Snapshot);
  const nativeHostPath = manifestParse.nativeHostPath;
  const pluginCachePath = nativeHostPath == null ? null : chromePluginCachePath(nativeHostPath);
  const hostsV2Parse = parseNativeHostsV2(manifestSnapshot);
  const [unfurledHost, cacheListing, unfurledEntries] = await Promise.all([
    nativeHostPath == null ? null : unfurl(nativeHostPath),
    listChromePluginCachePaths(pluginCachePath ?? ""),
    Promise.all(
      hostsV2Parse.entries.map(async ({ nativeHostNames, browserClientPath, extensionHostPath }) => {
        const [browserClient, extensionHost] = await Promise.all([
          browserClientPath == null ? null : unfurl(browserClientPath),
          unfurl(extensionHostPath),
        ]);
        return {
          nativeHostNames,
          browserClientPath,
          unfurledBrowserClientPath: browserClient?.path ?? null,
          unfurledBrowserClientPathErrorCode: browserClient?.errorCode ?? null,
          extensionHostPath,
          unfurledExtensionHostPath: extensionHost.path,
          unfurledExtensionHostPathErrorCode: extensionHost.errorCode,
        };
      }),
    ),
  ]);
  return {
    pathsReport: {
      manifest:
        hostsV2Snapshot == null
          ? null
          : {
              path: hostsV2Snapshot.sourcePath,
              parseErrorCode: manifestParse.parseErrorCode,
              nativeHostPath,
              unfurledNativeHostPath: unfurledHost?.path ?? null,
              unfurledNativeHostPathErrorCode: unfurledHost?.errorCode ?? null,
              chromePluginCachePath: pluginCachePath,
              cachedChromePluginPaths: cacheListing.paths,
              cachedChromePluginPathsTruncated: cacheListing.truncated,
              chromePluginCacheErrorCode: cacheListing.errorCode,
            },
      chromeNativeHostsV2:
        manifestSnapshot == null
          ? null
          : {
              path: manifestSnapshot.sourcePath,
              parseErrorCode: hostsV2Parse.parseErrorCode,
              invalidEntryCount: hostsV2Parse.invalidEntryCount,
              entries: unfurledEntries,
            },
    },
    snapshots,
  };
}

// ---------------------------------------------------------------------------
// 进程内存诊断（原 `LRe`/`RRe`/`zRe`）
// ---------------------------------------------------------------------------

/** 进程表快照 + codex 深度标注（原 `RRe`）。 */
async function collectProcessTableSnapshot(now: Date) {
  const processes = await (readProcessTable as unknown as () => Promise<
    Array<{
      parentPid: number;
      pid: number;
      ageSeconds: number;
      command: string;
      cpuPercent: number;
      rssKb: number | null;
    }>
  >)();
  const childrenByParent = new Map<number, number[]>();
  for (const { parentPid, pid } of processes) {
    const siblings = childrenByParent.get(parentPid);
    if (siblings == null) childrenByParent.set(parentPid, [pid]);
    else siblings.push(pid);
  }
  // BFS 标注 codex 进程树深度（根 = 当前主进程）。
  const depthByPid = new Map([[process.pid, 0]]);
  const queue = [process.pid];
  while (queue.length > 0) {
    const pid = queue.pop();
    if (pid == null) continue;
    const depth = depthByPid.get(pid);
    if (depth != null)
      for (const child of childrenByParent.get(pid) ?? [])
        if (!depthByPid.has(child)) {
          depthByPid.set(child, depth + 1);
          queue.push(child);
        }
  }
  const entries = processes
    .map(({ ageSeconds, command, cpuPercent, parentPid, pid, rssKb }) => ({
      pid,
      ppid: parentPid,
      command: basename(command),
      rssBytes: rssKb == null ? null : rssKb * 1024,
      rssMiB: rssKb == null ? null : Math.round((rssKb / 1024) * 10) / 10,
      cpuPercent,
      ageSeconds,
      codexProcessDepth: depthByPid.get(pid) ?? null,
    }))
    .sort((a, b) => (a.rssBytes === b.rssBytes ? a.pid - b.pid : (b.rssBytes ?? -1) - (a.rssBytes ?? -1)));
  const codexProcesses = entries.filter((entry) => entry.codexProcessDepth != null);
  return {
    schemaVersion: 1,
    capturedAt: now.toISOString(),
    platform: process.platform,
    architecture: process.arch,
    codexMainProcessPid: process.pid,
    system: {
      totalMemoryBytes: totalmem(),
      freeMemoryBytes: freemem(),
      processCount: entries.length,
      summedProcessRssBytes: entries.reduce((sum, entry) => sum + (entry.rssBytes ?? 0), 0),
    },
    codex: {
      processCount: codexProcesses.length,
      summedProcessRssBytes: codexProcesses.reduce((sum, entry) => sum + (entry.rssBytes ?? 0), 0),
    },
    rssNote: "RSS can count shared memory in multiple processes; summed RSS does not represent unique physical memory usage.",
    processes: entries,
  };
}

/** 进程内存诊断 JSON（原 `LRe`）。 */
async function collectProcessMemoryDiagnostics(now: Date): Promise<Buffer> {
  return Buffer.from(`${JSON.stringify(await collectProcessTableSnapshot(now), null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// ustar 头（vendored tar 的 ER.Header 等价实现，512 字节）
// ---------------------------------------------------------------------------

const TAR_BLOCK_BYTES = 512;

/** ustar 头编码（等价 vendored tar Header.encode：GNU 风格八进制 + ustar magic）。 */
function encodeTarHeader(block: Buffer, entry: { path: string; mode: number; uid: number; gid: number; size: number; mtime: Date; type: string }): void {
  block.fill(0);
  const path = entry.path.slice(0, 99);
  block.write(path, 0, 100, "utf8");
  writeOctal(block, 100, 8, entry.mode);
  writeOctal(block, 108, 8, entry.uid);
  writeOctal(block, 116, 8, entry.gid);
  writeOctal(block, 124, 12, entry.size);
  writeOctal(block, 136, 12, Math.floor(entry.mtime.getTime() / 1000));
  // checksum 先写空格再算
  block.write("        ", 148, 8, "ascii");
  block.write(entry.type === "File" ? "0" : entry.type, 156, 1, "ascii");
  block.write("ustar\0", 257, 6, "ascii");
  block.write("00", 263, 2, "ascii");
  let checksum = 0;
  for (const byte of block) checksum += byte;
  writeOctal(block, 148, 7, checksum);
  block.write(" ", 155, 1, "ascii");
}

function writeOctal(block: Buffer, offset: number, length: number, value: number): void {
  const octal = value.toString(8).padStart(length - 1, "0");
  block.write(octal, offset, length, "ascii");
  block[offset + length - 1] = 0x20;
}

// ---------------------------------------------------------------------------
// 归档打包（原 `GRe`/`KRe`/`WRe`/`qRe`/`JRe`）
// ---------------------------------------------------------------------------

const TAR_SPLIT_BYTES = 209_714_176;
const LOG_RETENTION_DAYS = 3;
/** archiveId → 临时目录的唯一记账（原 `CV`，URe/TV 必须同模块）。 */
const archivesById = new Map<string, string>();

/** 目录内文件列表（ENOENT 视为空，原 `WRe`）。 */
async function listFiles(directory: string): Promise<string[]> {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return [];
    throw error;
  }
}

/** logRoot/yyyy/mm/dd 桶路径（原 `qRe`）。 */
function logBucketPath(root: string, day: Date): string {
  return join(
    root,
    day.getUTCFullYear().toString(),
    String(day.getUTCMonth() + 1).padStart(2, "0"),
    String(day.getUTCDate()).padStart(2, "0"),
  );
}

/** YYYYMMDD 日期戳（原 `JRe`）。 */
function dateStamp(day: Date): string {
  return `${day.getUTCFullYear()}${String(day.getUTCMonth() + 1).padStart(2, "0")}${String(day.getUTCDate()).padStart(2, "0")}`;
}

interface ArchiveEntry {
  name: string;
  size: number;
  path?: string;
  contents?: Buffer;
}

/** 单条目 tar+gzip（原 `KRe`）：返回产物大小，文件中途变化返回 null。 */
async function packEntry(entry: ArchiveEntry, now: Date, tempTarPath: string): Promise<number | null> {
  const size = "contents" in entry ? (entry.contents as Buffer).byteLength : entry.size;
  const header = Buffer.alloc(TAR_BLOCK_BYTES);
  encodeTarHeader(header, {
    path: entry.name.replace(/\\/g, "/").replace(/^\/+/, ""),
    mode: 0o644,
    uid: 0,
    gid: 0,
    size,
    mtime: now,
    type: "File",
  });
  let fileChanged = false;
  await pipeline(
    (async function* () {
      yield header;
      if ("contents" in entry) {
        yield entry.contents as Buffer;
      } else if (size > 0) {
        const stream = createReadStream(entry.path as string, { end: size - 1 });
        let read = 0;
        for await (const chunk of stream) {
          read += (chunk as Buffer).byteLength;
          yield chunk as Buffer;
        }
        fileChanged = read !== size;
      }
      const padding = (TAR_BLOCK_BYTES - (size % TAR_BLOCK_BYTES)) % TAR_BLOCK_BYTES;
      if (padding > 0) yield Buffer.alloc(padding);
    })(),
    createGzip(),
    createWriteStream(tempTarPath),
  );
  return fileChanged
    ? (logger().warning("Skipping feedback archive entry.", {
        safe: { fileChanged },
        sensitive: { name: entry.name },
      }),
      null)
    : (await stat(tempTarPath)).size;
}

/** 分片打包（原 `GRe`）：每片 ≤ ~200MiB，命名 codex-desktop-app-logs-YYYYMMDD[-N].tar.gz。 */
async function packArchive(entries: ArchiveEntry[], directory: string, now: Date): Promise<string[]> {
  // 两个 512 字节空块结尾（原 BRe 预压缩）。
  const trailer = await gzipAsync(Buffer.alloc(TAR_BLOCK_BYTES * 2));
  const parts: string[] = [];
  const tempTarPath = join(directory, "entry.tar.gz");
  let currentPart: string | null = null;
  let remaining = TAR_SPLIT_BYTES - trailer.byteLength;
  for (const entry of entries) {
    const packedSize = await packEntry(entry, now, tempTarPath);
    if (packedSize == null) continue;
    if (currentPart == null || packedSize > remaining) {
      if (currentPart != null) await appendFile(currentPart, trailer);
      const suffix = parts.length === 0 ? "" : `-${parts.length + 1}`;
      currentPart = join(directory, `codex-desktop-app-logs-${dateStamp(now)}${suffix}.tar.gz`);
      parts.push(currentPart);
      remaining = TAR_SPLIT_BYTES - trailer.byteLength;
    }
    await pipeline(createReadStream(tempTarPath), createWriteStream(currentPart, { flags: "a" }));
    remaining -= packedSize;
  }
  if (currentPart != null) await appendFile(currentPart, trailer);
  await rm(tempTarPath, { force: true });
  return parts;
}

// ---------------------------------------------------------------------------
// 导出契约（原 `URe`/`TV`/`wV`）
// ---------------------------------------------------------------------------

interface CreateArchiveOptions {
  buildFlavor?: string;
  getAppServerDiagnostics?: () => Promise<unknown>;
  includeDesktopLogs?: boolean;
  includeNativeHostDiagnostics?: boolean;
  includeProcessMemoryDiagnostics?: boolean;
  includeWindowsSystemDiagnostics?: boolean;
}

/** 完整归档创建（原 `wV`）。 */
async function createFeedbackArchive(now = new Date(), extraPaths: string[] = [], options: CreateArchiveOptions = {}): Promise<{ archiveId: string | null; filePaths: string[] }> {
  const {
    buildFlavor = (BuildFlavor as { resolve(): string }).resolve(),
    getAppServerDiagnostics,
    includeDesktopLogs = true,
    includeNativeHostDiagnostics,
    includeProcessMemoryDiagnostics = false,
    includeWindowsSystemDiagnostics = true,
  } = options;
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const logRoot = (desktopLogRootDir as () => string)();
  const windowsDiagnostics =
    includeDesktopLogs && includeWindowsSystemDiagnostics && process.platform === "win32"
      ? (collectWindowsSystemDiagnostics as (() => unknown) | null)()
      : null;
  const [logFiles, nativeHostDiagnostics, processMemory, appServerDiagnostics, primaryRuntime] = await Promise.all([
    includeDesktopLogs
      ? Promise.all(
          Array.from({ length: LOG_RETENTION_DAYS }, async (_day, daysAgo) => {
            const day = new Date(todayUtc);
            day.setUTCDate(day.getUTCDate() - daysAgo);
            const bucket = logBucketPath(logRoot, day);
            return (await listFiles(bucket))
              .filter((name) => name.startsWith("codex-desktop-") && name.endsWith(".log"))
              .map((name) => join(bucket, name));
          }),
        ).then((buckets) => buckets.flat())
      : [],
    includeDesktopLogs && includeNativeHostDiagnostics
      ? collectChromeNativeHostDiagnostics(buildFlavor)
      : { pathsReport: null, snapshots: [] },
    includeDesktopLogs && includeProcessMemoryDiagnostics
      ? collectProcessMemoryDiagnostics(now).catch((error) => (
          logger().warning("Failed to collect feedback process memory diagnostics.", {
            safe: {},
            sensitive: { error },
          }),
          null as Buffer | null
        ))
      : null,
    includeDesktopLogs && includeProcessMemoryDiagnostics && getAppServerDiagnostics != null
      ? getAppServerDiagnostics().catch((error) => (
          logger().warning("Failed to collect app-server diagnostics.", {
            safe: {},
            sensitive: { error },
          }),
          null as unknown
        ))
      : null,
    includeDesktopLogs
      ? (primaryRuntimeDiagnostics as () => Promise<unknown>)().catch((error) => (
          logger().warning("Failed to collect primary runtime diagnostics", {
            safe: {},
            sensitive: { error },
          }),
          null as unknown
        ))
      : null,
  ]);
  const logEntries = await Promise.all(
    logFiles.map(async (path) => ({
      path,
      info: await stat(path),
      currentSession: basename(path).startsWith(`codex-desktop-${appSessionId as string}-`),
    })),
  );
  // 当前会话的日志优先（原排序）。
  logEntries.sort(
    (a, b) =>
      Number(b.currentSession) - Number(a.currentSession) || b.info.mtimeMs - a.info.mtimeMs,
  );
  const tarEntries: ArchiveEntry[] = [
    ...(extraPaths as unknown as ArchiveEntry[]),
    ...logEntries.map(({ path, info }) => ({ name: relative(logRoot, path), path, size: info.size })),
  ];
  const snapshots: Array<{ name: string; contents: Buffer }> = [...nativeHostDiagnostics.snapshots];
  if (primaryRuntime != null) {
    snapshots.push({
      name: "primary-runtime-diagnostics.json",
      contents: Buffer.from(JSON.stringify(primaryRuntime, null, 2)),
    });
    if (nativeHostDiagnostics.pathsReport != null) {
      snapshots.push({
        name: "chrome-native-host-paths.json",
        contents: Buffer.from(`${JSON.stringify(nativeHostDiagnostics.pathsReport, null, 2)}\n`),
      });
    }
  }
  if (processMemory != null) snapshots.push({ name: "process-memory-diagnostics.json", contents: processMemory });
  if (appServerDiagnostics != null)
    snapshots.push({
      name: "app-server-diagnostics.json",
      contents: Buffer.from(`${JSON.stringify(appServerDiagnostics, null, 2)}\n`),
    });
  if (windowsDiagnostics != null)
    snapshots.push({
      name: "windows-system-diagnostics.json",
      contents: Buffer.from(`${JSON.stringify(windowsDiagnostics, null, 2)}\n`),
    });
  const archiveDir = await mkdtemp(join(tmpdir(), "codex-feedback-desktop-log-archive-"));
  try {
    const packed = await packArchive(tarEntries, archiveDir, now);
    packed.push(
      ...(await Promise.all(
        snapshots.map(async ({ name, contents }) => {
          const path = join(archiveDir, name);
          await writeFile(path, contents);
          return path;
        }),
      )),
    );
    if (packed.length === 0)
      return (await rm(archiveDir, { force: true, recursive: true }), { archiveId: null, filePaths: [] });
    const archiveId = randomUUID();
    return (archivesById.set(archiveId, archiveDir), { archiveId, filePaths: packed });
  } catch (error) {
    throw (await rm(archiveDir, { force: true, recursive: true }), error);
  }
}

/** 导出契约：创建桌面日志归档（原 `URe`，exports.t）。 */
async function createDesktopLogArchive(
  now = new Date(),
  extraPaths: string[] = [],
  { includeDesktopLogs = true } = {},
): Promise<{ archiveId: string; filePaths: string[] } | null> {
  const archive = await createFeedbackArchive(now, extraPaths, {
    includeDesktopLogs,
    includeNativeHostDiagnostics: false,
    includeWindowsSystemDiagnostics: false,
  });
  return archive.archiveId == null ? null : { archiveId: archive.archiveId, filePaths: archive.filePaths };
}

/** 导出契约：删除归档（原 `TV`，exports.n）。 */
async function deleteDesktopLogArchive(archiveId: string): Promise<boolean> {
  const archiveDir = archivesById.get(archiveId);
  if (archiveDir == null) return false;
  archivesById.delete(archiveId);
  try {
    await rm(archiveDir, { force: true, recursive: true });
    return true;
  } catch (error) {
    logger().warning("Failed to remove feedback desktop log archive.", {
      safe: {},
      sensitive: { archiveDir, error },
    });
    return false;
  }
}

// windows 系统诊断在 R5 区间（CO，71,718），该模块落地前为 null 占位。
// 原版 wV 仅在 win32 且 includeWindowsSystemDiagnostics 时调用 CO()。
const collectWindowsSystemDiagnostics: (() => unknown) | null = null;

export {
  createDesktopLogArchive,
  deleteDesktopLogArchive,
  createFeedbackArchive,
  collectChromeNativeHostDiagnostics,
  collectProcessMemoryDiagnostics,
  encodeTarHeader,
  type CreateArchiveOptions,
};
