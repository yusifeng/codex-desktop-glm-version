// shared chunk：WSL 环境与路径换算（wsl-paths 分区，
// hosts-wsl-plugins 子区）。
//
// 对应 src-DldfpmrL.ts 的 L24,102-24,729 区段：
//   - Pj（Ui）：/mnt/<drive> 或 \\MNT\<drive> 判定
//   - Fj：Windows 路径判定（盘符或双斜杠）
//   - Ij（Hi）：WSL UNC 前缀判定（\\wsl$\ 或 \\wsl.localhost\，
//     含 \\?\UNC\ 变体）
//   - lre：UNC 前缀里的 distro 名提取
//   - Lj：/mnt/<drive> → <Drive>:\ 反向换算（含 \\MNT\ 与
//     C:\mnt\c 异常形态兜底）
//   - Rj（Vi）：Windows → WSL 路径（\\?\UNC\wsl$ 递归剥、
//     \\?\C:\ → /mnt/c/、wsl$ 前缀剥 distro、盘符 → /mnt/<c>/）
//   - zj：/ → \ 归一
//   - Bj（Bi）：进程 env 消毒（剥 BREAKPAD_DUMP_LOCATION/
//     CHROME_CRASHPAD_PIPE_NAME/CRASHPAD_HANDLER_PID/
//     ELECTRON_CRASH_REPORTER_PROCESS_TYPE/__CFBUNDLEIDENTIFIER）
//   - fre（Li）：setShouldSpawnInsideWsl（一次性注入）
//   - aM（Ri）：shouldSpawnInsideWsl 读取（test 环境 false、未注入抛错）
//   - pre（zi）：shouldUseWslPaths——非远程 host 且 WSL 内 spawn
//   - oM（Mi）：wslDistroName（同步缓存；wsl --list --verbose 的
//     * 标记行解析 + ubuntu 兜底 + UTF-16/UTF-8 BOM 嗅探）
//   - sM（Ni）：resolveWslDistro（异步缓存 + 并发去重）
//   - _re（Ai）：buildWslEnvDirective——WSLENV 追加（path/list/
//     unix-only/windows-only 四后缀）
//   - cM（Fi）：从 WSL bash 交互 shell 提取 PATH（标记对提取 +
//     per-distro 缓存 + 代际失效）
//   - bM（ji）：Linux 路径 → \\wsl$\<distro>\ Windows 形态
//   - xM（Oi）：resolveCodexHome（同步；preferWsl 时从 WSL env 读
//     CODEX_HOME 并 wslpath -w 换算，失败回退 host home）
//   - SM（ki）：resolveExecutionCodexHome（异步版）
//   - Z（Di）：app-server 文件系统门面（readFile/writeFile/mkdir/
//     stat/readdir/rm/copyFile/cp——经 ExecutionHost 转发）
//
// 兼容导出：Ui/Hi/Vi/Bi/Li/Ri/zi/Mi/Ni/Ai/Fi/ji/Oi/ki/Di。

import { execFile, execFileSync, spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

import { memoizedTaggedLogger } from "@chunk/logger";

import { isRemoteHostConfig } from "./host-config";

const log = memoizedTaggedLogger("wsl");

// ---------------------------------------------------------------------------
// 路径谓词与换算（原 `Pj`/`Fj`/`Ij`/`lre`/`Lj`/`Rj`/`zj`）
// ---------------------------------------------------------------------------

/** /mnt 路径判定（原 `Pj`，导出 `Ui`）。 */
export function isWslPath(path: string): boolean {
  return /^\/mnt\/[a-zA-Z](?:\/|$)/.test(path) ? true : /^\\{1,2}[Mm][Nn][Tt]\\[a-zA-Z](?:\\|$)/.test(path);
}

/** Windows 路径判定（原 `Fj`）。 */
function isWindowsPath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path) ? true : path.startsWith("\\\\") || path.startsWith("//");
}

/** WSL UNC 前缀判定（原 `Ij`，导出 `Hi`）。 */
export function isWslUncPath(path: string): boolean {
  return /^(\\\\|\/\/)(?:\?[\\/]UNC[\\/])?(wsl\$|wsl\.localhost)[\\/]/i.test(path);
}

/** UNC 里的 distro 名（原 `lre`）。 */
export function wslDistroFromUnc(path: string): string | null {
  return path.match(/^(?:\\\\|\/\/)(?:\?[\\/]UNC[\\/])?(?:wsl\$|wsl\.localhost)[\\/]([^\\/]+)/i)?.[1] ?? null;
}

/** /mnt → 盘符（原 `Lj`）。 */
function mntToWindows(path: string): string {
  const mntMatch = path.match(/^\/mnt\/([a-zA-Z])(?:\/(.*))?$/);
  if (mntMatch) return `${mntMatch[1].toUpperCase()}:\\${(mntMatch[2] ?? "").replace(/\//g, "\\")}`;
  const legacyMatch = path.match(/^\\{1,2}[Mm][Nn][Tt]\\([a-zA-Z])(?:\\(.*))?$/i);
  if (legacyMatch) return `${legacyMatch[1].toUpperCase()}:\\${(legacyMatch[2] ?? "").replace(/[\\/]/g, "\\")}`;
  const cMntMatch = path.match(/^C:\\mnt\\c(.*)$/i);
  return cMntMatch
    ? `C:\\${cMntMatch[1].replace(/^([\\/])+/, "").replace(/[\\/]/g, "\\")}`
    : path.replace(/\//g, "\\");
}

/** / → \（原 `zj`）。 */
function toBackslashes(path: string): string {
  return path.replace(/\//g, "\\");
}

/**
 * Windows → WSL 路径（原 `Rj`，导出 `Vi`）。
 * \\?\UNC\wsl$ 递归剥；\\?\C:\ → /mnt/c/；wsl$ 前缀剥 distro；
 * 盘符 → /mnt/<c>/。
 */
export function windowsToWslPath(path: string): string {
  const uncExtended = path.match(/^(?:\\\\|\/\/)\?[\\/]UNC[\\/](wsl\$|wsl\.localhost)[\\/](.*)$/i);
  if (uncExtended) return windowsToWslPath(`\\\\${uncExtended[1]}\\${uncExtended[2]}`);
  const driveExtended = path.match(/^(?:\\\\|\/\/)\?[\\/]([a-zA-Z]):[\\/](.*)$/);
  if (driveExtended) return `/mnt/${driveExtended[1].toLowerCase()}/${driveExtended[2].replace(/\\/g, "/")}`;
  if (/^(\\\\|\/\/)(wsl\$|wsl\.localhost)/i.test(path)) {
    const segments = path.replace(/^((\\\\|\/\/)(wsl\$|wsl\.localhost)[\\/]+)/i, "").split(/[\\/]/);
    segments.shift();
    const rest = segments.join("/").replace(/\\/g, "/");
    return rest.length === 0 ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
  }
  if (path.startsWith("\\\\") || path.startsWith("//")) return toBackslashes(path);
  if (path.startsWith("/")) return path;
  const driveMatch = path.match(/^([a-zA-Z]):[\\/](.*)$/);
  return driveMatch ? `/mnt/${driveMatch[1].toLowerCase()}/${driveMatch[2].replace(/\\/g, "/")}` : path.replace(/\\/g, "/");
}

// ---------------------------------------------------------------------------
// 进程 env 消毒（原 `dre`/`Bj`）
// ---------------------------------------------------------------------------

/** 崩溃相关 env（原 `dre`——传给子进程会导致 crashpad 冲突）。 */
const CRASH_RELATED_ENV = new Set([
  "BREAKPAD_DUMP_LOCATION",
  "CHROME_CRASHPAD_PIPE_NAME",
  "CRASHPAD_HANDLER_PID",
  "ELECTRON_CRASH_REPORTER_PROCESS_TYPE",
  "__CFBUNDLEIDENTIFIER",
]);

/** env 消毒（原 `Bj`，导出 `Bi`）。 */
export function sanitizedProcessEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const result = { ...env };
  for (const key of Object.keys(result)) if (CRASH_RELATED_ENV.has(key.toUpperCase())) delete result[key];
  return result;
}

// ---------------------------------------------------------------------------
// WSL spawn 策略（原 `fre`/`aM`/`pre`）
// ---------------------------------------------------------------------------

let shouldSpawnInsideWslProbe: (() => boolean) | undefined;

/** 注入 WSL spawn 策略（原 `fre`，导出 `Li`；只允许一次）。 */
export function setShouldSpawnInsideWsl(probe: () => boolean): void {
  if (shouldSpawnInsideWslProbe) throw new Error("shouldSpawnInsideWsl already set");
  shouldSpawnInsideWslProbe = probe;
}

/** 读取策略（原 `aM`，导出 `Ri`；test 环境恒 false，未注入抛错）。 */
export function shouldSpawnInsideWsl(): boolean {
  if (!shouldSpawnInsideWslProbe) {
    if (process.env.NODE_ENV === "test" || process.env.VITEST != null) return false;
    throw new Error("shouldSpawnInsideWsl not set");
  }
  return shouldSpawnInsideWslProbe();
}

/** host 是否应走 WSL 路径（原 `pre`，导出 `zi`：非远程 host 且 WSL 内）。 */
export function shouldUseWslPaths(hostConfig: { kind?: string | null } | null | undefined): boolean {
  return (hostConfig == null || !isRemoteHostConfig(hostConfig)) && shouldSpawnInsideWsl();
}

// ---------------------------------------------------------------------------
// distro 探测（原 `oM`/`sM` 及其辅助族）
// ---------------------------------------------------------------------------

/** wsl.exe 调用超时（原 `$j`）。 */
const WSL_COMMAND_TIMEOUT_MS = 30_000;
const WSL_STATUS_TIMEOUT_MS = 3_000;
/** WSL bash 路径（原 `Qj`）。 */
const WSL_BASH_PATH = "/usr/bin/bash";

let cachedDistroName: string | null | undefined;
let distroListCache: string[] = [];
let distroDetectionGeneration = 0;
let cachedAsyncDistro: Promise<string | null> | undefined;
let asyncDistroResolved: string | null | undefined;
let nextDistroRetryAt = 0;

/** 输出解码（原 `hM`：UTF-16LE/UTF-8 BOM 嗅探 + 双字节启发）。 */
function decodeWslOutput(output: Buffer | string): string {
  let text: string;
  if (Buffer.isBuffer(output)) {
    const buffer = output;
    if (buffer.length === 0) return "";
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) text = buffer.subarray(2).toString("utf16le");
    else if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf)
      text = buffer.subarray(3).toString("utf8");
    else {
      const probeLength = Math.min(buffer.length - (buffer.length % 2), 256);
      let looksUtf16 = false;
      if (probeLength > 0) {
        let pairs = 0;
        let zeros = 0;
        for (let index = 0; index < probeLength; index += 2) {
          pairs += 1;
          if (buffer[index + 1] === 0) zeros += 1;
        }
        looksUtf16 = pairs > 0 && zeros / pairs > 0.6;
      }
      text = looksUtf16 ? buffer.toString("utf16le") : buffer.toString("utf8");
    }
  } else text = output;
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
}

/** * 标记行解析（原 `_M`）。 */
function defaultDistroFromVerbose(listOutput: string): string | null {
  const starred = listOutput
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("*"));
  return (starred && starred.slice(1).trim().split(/\s{2,}|\t+/)[0]) || null;
}

/** 版本 2 distro 列表（原 `vM`：默认 distro 优先）。 */
function versionTwoDistros(listOutput: string): string[] {
  const defaultDistro = defaultDistroFromVerbose(listOutput);
  const distros = listOutput
    .split("\n")
    .slice(1)
    .map((line) => line.replace(/^\s*\*?\s*/, "").split(/\s{2,}|\t+/))
    .filter(([, , version]) => version === "2")
    .map(([name]) => name)
    .filter((name) => name != null);
  return defaultDistro == null || !distros.includes(defaultDistro) ? distros : [defaultDistro, ...distros.filter((name) => name !== defaultDistro)];
}

/** ubuntu 兜底（原 `fM`）。 */
function pickDistroFromQuiet(verboseResult: string | null, quietList: string): string | null {
  return (
    verboseResult ??
    (quietList
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.toLowerCase().startsWith("ubuntu")) ?? null)
  );
}

/** 同步执行 wsl.exe（原 `pM`）。 */
function execWslSync(args: string[]): string {
  log().debug("[execWindowsCommand] executing", { safe: { command: "wsl.exe", args: args.join(" ") }, sensitive: {} });
  return decodeWslOutput(
    execFileSync("wsl.exe", args, {
      timeout: WSL_STATUS_TIMEOUT_MS,
      env: sanitizedProcessEnv(process.env),
      windowsHide: true,
      encoding: "buffer",
      maxBuffer: 10_240,
    }) as Buffer,
  );
}

/** 异步执行 wsl.exe（原 `mM`）。 */
function execWslAsync(args: string[]): Promise<string> {
  log().debug("[execWindowsCommand] executing", { safe: { command: "wsl.exe", args: args.join(" ") }, sensitive: {} });
  return new Promise((resolve, reject) => {
    execFile(
      "wsl.exe",
      args,
      {
        timeout: WSL_STATUS_TIMEOUT_MS,
        env: sanitizedProcessEnv(process.env),
        windowsHide: true,
        encoding: "buffer",
        maxBuffer: 10_240,
      },
      (error, stdout) => {
        if (error != null) {
          reject(new Error(error.message, { cause: error }));
          return;
        }
        resolve(decodeWslOutput(stdout as Buffer));
      },
    );
  });
}

/** 同步 distro 探测核心（原 `Dre`）。 */
function detectDistroSync(generation: number): string | null {
  try {
    execWslSync(["--status"]);
    const verbose = execWslSync(["--list", "--verbose"]);
    if (generation === distroDetectionGeneration) distroListCache = versionTwoDistros(verbose);
    const defaultDistro = defaultDistroFromVerbose(verbose);
    const quietList = defaultDistro == null ? execWslSync(["--list", "--quiet"]) : "";
    log().info("[wsl] eligible distro list", { safe: { listResult: verbose }, sensitive: {} });
    return defaultDistro ?? pickDistroFromQuiet("", quietList);
  } catch (error) {
    if (generation === distroDetectionGeneration) distroListCache = [];
    log().error("[wsl] error retrieving eligible distro", { safe: { error: String(error) }, sensitive: {} });
    return null;
  }
}

/** 异步 distro 探测核心（原 `Ore`）。 */
async function detectDistroAsync(generation: number): Promise<string | null> {
  try {
    await execWslAsync(["--status"]);
    const verbose = await execWslAsync(["--list", "--verbose"]);
    if (generation === distroDetectionGeneration) distroListCache = versionTwoDistros(verbose);
    const defaultDistro = defaultDistroFromVerbose(verbose);
    const quietList = defaultDistro == null ? await execWslAsync(["--list", "--quiet"]) : "";
    log().info("[wsl] eligible distro list", { safe: { listResult: verbose }, sensitive: {} });
    return defaultDistro ?? pickDistroFromQuiet("", quietList);
  } catch (error) {
    if (generation === distroDetectionGeneration) distroListCache = [];
    log().error("[wsl] error retrieving eligible distro", { safe: { error: String(error) }, sensitive: {} });
    return null;
  }
}

/** distro 名（原 `oM`，导出 `Mi`；同步缓存，非 win32 → null）。 */
export function wslDistroName(force = false): string | null {
  if (process.platform !== "win32") return null;
  if (!force && cachedDistroName !== undefined) return cachedDistroName;
  distroDetectionGeneration += 1;
  cachedDistroName = detectDistroSync(distroDetectionGeneration);
  return cachedDistroName;
}

/** distro 名（原 `sM`，导出 `Ni`；异步缓存 + 并发去重）。 */
export async function resolveWslDistro(force = false): Promise<string | null> {
  if (process.platform !== "win32") return null;
  if (!force && cachedDistroName !== undefined) return cachedDistroName;
  if (!force && cachedAsyncDistro != null) return cachedAsyncDistro;
  const generation = ++distroDetectionGeneration;
  const detection = detectDistroAsync(generation);
  cachedAsyncDistro = detection;
  try {
    const distro = await detection;
    if (generation === distroDetectionGeneration) cachedDistroName = distro;
    return distro;
  } finally {
    if (cachedAsyncDistro === detection) cachedAsyncDistro = undefined;
  }
}

// ---------------------------------------------------------------------------
// WSLENV 指令（原 `iM`/`_re`/`gM`/`kre`/`Are`）
// ---------------------------------------------------------------------------

/** WSLENV 追加项（原 `iM`）。 */
const WSLENV_ENTRIES: ({ name: string; type: "path" | "list" | "unix-only" | "windows-only" } | string)[] = [
  { name: "PATHEXT", type: "list" },
  { name: "COMSPEC", type: "path" },
  { name: "SYSTEMROOT", type: "path" },
  "SYSTEMDRIVE",
  "USERNAME",
  "USERDOMAIN",
  { name: "USERPROFILE", type: "path" },
  { name: "PROGRAMFILES", type: "path" },
  { name: "PROGRAMFILES(X86)", type: "path" },
  { name: "PROGRAMW6432", type: "path" },
  { name: "PROGRAMDATA", type: "path" },
  { name: "LOCALAPPDATA", type: "path" },
  { name: "APPDATA", type: "path" },
  "POWERSHELL",
  "PWSH",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "NODE_TLS_REJECT_UNAUTHORIZED",
];

/** 条目 → WSLENV 片段（原 `gM`）。 */
function wslenvEntry(entry: { name: string; type: string } | string): string | undefined {
  if (typeof entry == "string") return entry;
  switch (entry.type) {
    case "path":
      return `${entry.name}/p`;
    case "list":
      return `${entry.name}/l`;
    case "unix-only":
      return `${entry.name}/u`;
    case "windows-only":
      return `${entry.name}/w`;
  }
}

/** 条目名（原 `kre`）。 */
function wslenvEntryName(entry: { name: string } | string): string {
  return typeof entry == "string" ? entry : entry.name;
}

/** 条目前缀（原 `Are`）。 */
function wslenvEntryPrefix(entry: string): string {
  return entry.split("/", 1)[0] ?? entry;
}

/**
 * WSLENV 指令（原 `_re`，导出 `Ai`）。
 * 把 Windows env 项以 /p /l /u /w 后缀声明进 WSLENV。
 */
export function buildWslEnvDirective(entries = WSLENV_ENTRIES): string {
  return entries.map(wslenvEntry).filter((entry): entry is string => entry != null).join(":");
}

// ---------------------------------------------------------------------------
// WSL bash PATH 提取（原 `cM`/`yM` 及标记对）
// ---------------------------------------------------------------------------

const PATH_MARKER_START = "__CODEX_WSL_PATH_START__";
const PATH_MARKER_END = "__CODEX_WSL_PATH_END__";

const interactivePathCache = new Map<string, string | null>();
const interactivePathGeneration = new Map<string, number>();

/** 标记对提取（原 `yM`）。 */
function extractBetweenMarkers(output: string, start: string, end: string): string | null {
  if (output == null) return null;
  const lines = output.split("\n");
  const startIndex = lines.indexOf(start);
  if (startIndex === -1) return null;
  const endIndex = lines.indexOf(end, startIndex + 1);
  return endIndex === -1 || endIndex <= startIndex + 1 ? null : lines.slice(startIndex + 1, endIndex).join("\n");
}

/** 同步执行 WSL bash 命令（原 `uM`）。 */
function execWslBashSync(args: string[], context: string): string | undefined {
  try {
    const result = spawnSync("wsl.exe", args, {
      encoding: "utf8",
      env: sanitizedProcessEnv(process.env),
      windowsHide: true,
    });
    if (result.error) {
      log().debug("WSL command error", { safe: { context }, sensitive: { error: result.error } });
      return undefined;
    }
    if (result.status !== 0) {
      log().debug("WSL command non-zero exit", { safe: { context }, sensitive: { status: result.status, stderr: result.stderr ?? "" } });
      return undefined;
    }
    const stdout = (result.stdout ?? "").trim();
    if (!stdout) {
      log().warning("WSL command returned empty output", { safe: { context }, sensitive: {} });
      return undefined;
    }
    return stdout;
  } catch (error) {
    log().warning("WSL command unexpected error", { safe: { context }, sensitive: { error } });
    return undefined;
  }
}

/**
 * 从 WSL bash 交互 shell 提取 PATH（原 `cM`，导出 `Fi`）。
 * per-distro 缓存 + 代际失效。
 */
export function getInteractivePathFromWslBash(distro: string, force = false): string | null {
  if (process.platform !== "win32") return null;
  if (!force && interactivePathCache.has(distro)) return interactivePathCache.get(distro) ?? null;
  const generation = (interactivePathGeneration.get(distro) ?? 0) + 1;
  interactivePathGeneration.set(distro, generation);
  const output =
    execWslBashSync(
      ["-d", distro, "--", WSL_BASH_PATH, "-ilc", `printf '%s\n' '${PATH_MARKER_START}'; printf '%s\n' "$PATH"; printf '%s\n' '${PATH_MARKER_END}'`],
      `getInteractivePathFromWslBash(${distro})`,
    ) ?? null;
  const extracted = extractBetweenMarkers(output, PATH_MARKER_START, PATH_MARKER_END);
  if (interactivePathGeneration.get(distro) === generation) interactivePathCache.set(distro, extracted);
  return extracted;
}

// ---------------------------------------------------------------------------
// Linux → \\wsl$（原 `bM`）
// ---------------------------------------------------------------------------

/**
 * Linux 路径 → Windows 形态（原 `bM`，导出 `ji`）。
 * Windows/WSL UNC 直通（反斜杠归一）；/mnt 先转盘符；其余挂到
 * \\wsl$\<distro>\ 下。
 */
export function wslToWindowsPath(path: string, distro: string | null = wslDistroName()): string {
  if (isWindowsPath(path) || isWslUncPath(path)) return toBackslashes(path);
  if (isWslPath(path)) return toBackslashes(mntToWindows(path));
  if (!path.startsWith("/") || distro == null) return path;
  const rest = path.replace(/^\/+/, "").replace(/\//g, "\\");
  return rest.length === 0 ? `\\\\wsl$\\${distro}\\` : `\\\\wsl$\\${distro}\\${rest}`;
}

// ---------------------------------------------------------------------------
// codex home（原 `bre`/`xre`/`Cre`/`wre`/`Tre`/`Ere`/`xM`/`SM`）
// ---------------------------------------------------------------------------

const codexHomeFromWslCache: { value?: string | null; retryAt?: number } = {};
const CODEX_HOME_RETRY_MS = 30_000;

/** WSL 内 CODEX_HOME（同步，原 `bre`：缓存 + 30s 重试节流）。 */
function codexHomeFromWslSync(): string | undefined {
  if (codexHomeFromWslCache.value !== undefined) return codexHomeFromWslCache.value;
  if (Date.now() < codexHomeFromWslCache.retryAt) return undefined;
  const linuxPath = execWslBashSync(
    ["/usr/bin/env", "bash", "-lc", 'printf %s "${CODEX_HOME:-$HOME/.codex}"'],
    "readCodexHomePathFromWslEnv",
  );
  if (!linuxPath) {
    codexHomeFromWslCache.retryAt = Date.now() + CODEX_HOME_RETRY_MS;
    return undefined;
  }
  if (isWindowsPath(linuxPath)) {
    codexHomeFromWslCache.value = toBackslashes(linuxPath);
    return codexHomeFromWslCache.value;
  }
  if (isWslPath(linuxPath)) {
    codexHomeFromWslCache.value = toBackslashes(mntToWindows(linuxPath));
    return codexHomeFromWslCache.value;
  }
  const translated = execWslBashSync(["wslpath", "-w", linuxPath], `resolveCodexHomeFromWsl:wslpath(${linuxPath})`);
  if (translated) {
    codexHomeFromWslCache.value = toBackslashes(translated);
    return codexHomeFromWslCache.value;
  }
  log().warning("[resolveCodexHomeFromWsl] Unable to translate Linux path", { safe: {}, sensitive: { linuxPath } });
  codexHomeFromWslCache.retryAt = Date.now() + CODEX_HOME_RETRY_MS;
  return undefined;
}

/** WSL 内 CODEX_HOME（异步，原 `xre`）。 */
async function codexHomeFromWslAsync(): Promise<string | undefined> {
  if (codexHomeFromWslCache.value !== undefined) return codexHomeFromWslCache.value;
  if (Date.now() < codexHomeFromWslCache.retryAt) return undefined;
  const linuxPath = await execWslBashAsync(
    ["/usr/bin/env", "bash", "-lc", 'printf %s "${CODEX_HOME:-$HOME/.codex}"'],
    "readCodexHomePathFromWslEnv",
  );
  if (!linuxPath) return undefined;
  if (isWindowsPath(linuxPath)) {
    codexHomeFromWslCache.value = toBackslashes(linuxPath);
    return codexHomeFromWslCache.value;
  }
  if (isWslPath(linuxPath)) {
    codexHomeFromWslCache.value = toBackslashes(mntToWindows(linuxPath));
    return codexHomeFromWslCache.value;
  }
  const translated = await execWslBashAsync(["wslpath", "-w", linuxPath], `resolveCodexHomeFromWsl:wslpath(${linuxPath})`);
  if (translated) {
    codexHomeFromWslCache.value = toBackslashes(translated);
    return codexHomeFromWslCache.value;
  }
  log().warning("[resolveCodexHomeFromWsl] Unable to translate Linux path", { safe: {}, sensitive: { linuxPath } });
  return undefined;
}

/** 异步执行 WSL bash 命令（原 `dM`）。 */
function execWslBashAsync(args: string[], context: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile(
      "wsl.exe",
      args,
      { encoding: "utf8", env: sanitizedProcessEnv(process.env), timeout: WSL_COMMAND_TIMEOUT_MS, windowsHide: true },
      (error, stdout) => {
        if (error != null) {
          log().debug("WSL command error", { safe: { context }, sensitive: { error, stderr: "" } });
          resolve(undefined);
          return;
        }
        const trimmed = (stdout ?? "").trim();
        if (!trimmed) {
          log().warning("WSL command returned empty output", { safe: { context }, sensitive: {} });
          resolve(undefined);
          return;
        }
        resolve(trimmed);
      },
    );
  });
}

/** host 侧 codex home。 */
function hostCodexHome(): string {
  return process.env.CODEX_HOME ?? join(homedir(), ".codex");
}

/**
 * codex home（原 `xM`，导出 `Oi`；同步）。
 * preferWsl 时优先 WSL 内 CODEX_HOME（wslpath 换算），失败回退 host。
 */
export function resolveCodexHome({ preferWsl = false } = {}): string {
  if (preferWsl && process.platform === "win32") {
    const fromWsl = codexHomeFromWslSync();
    if (fromWsl) return fromWsl;
    log().info("[resolveCodexHome] Falling back to host home directory because WSL CODEX_HOME could not be resolved");
  }
  return hostCodexHome();
}

/** codex home（原 `SM`，导出 `ki`；异步版）。 */
export async function resolveExecutionCodexHome({ preferWsl = false } = {}): Promise<string> {
  if (preferWsl && process.platform === "win32") {
    const fromWsl = await codexHomeFromWslAsync();
    if (fromWsl) return fromWsl;
    log().info("[resolveCodexHome] Falling back to host home directory because WSL CODEX_HOME could not be resolved");
  }
  return hostCodexHome();
}

// ---------------------------------------------------------------------------
// app-server 文件系统门面（原 `Z`，导出 `Di`）
// ---------------------------------------------------------------------------

/** ExecutionHost 文件系统面。 */
export interface ExecutionHostFs {
  readFile(path: string): Promise<unknown>;
  writeFile(path: string, contents: string | Uint8Array): Promise<void>;
  createDirectory(path: string, options?: Record<string, unknown>): Promise<void>;
  stat(path: string, options?: Record<string, unknown>): Promise<unknown>;
  readDirectory(path: string): Promise<{ name: string; isDirectory(): boolean; isSymbolicLink?(): boolean; isFile?(): boolean }[]>;
  remove(path: string, options?: Record<string, unknown>): Promise<void>;
  copyFile(from: string, to: string, options?: Record<string, unknown>): Promise<void>;
  copy(from: string, to: string, options?: Record<string, unknown>): Promise<void>;
}

/** 流式读全量（原 `wM`）。 */
async function streamToBuffer(stream: unknown, limit = Number.POSITIVE_INFINITY): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const reader = (stream as { getReader(): { read(): Promise<{ done: boolean; value: Uint8Array }> } & { releaseLock(): void; cancel?(): Promise<void> } }).getReader();
  let total = 0;
  try {
    while (total < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      const bounded = Number.isFinite(limit) ? chunk.subarray(0, limit - total) : chunk;
      chunks.push(bounded);
      total += bounded.byteLength;
    }
    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
    if (total >= limit) await (stream as { cancel?: () => Promise<void> }).cancel?.();
  }
}

/** 目录读取（原 `CM`：withFileTypes 选项透传）。 */
async function readDirectory(path: string, optionsOrHost: Record<string, unknown> | ExecutionHostFs, host?: ExecutionHostFs): Promise<unknown[]> {
  const withFileTypes = "withFileTypes" in (optionsOrHost as Record<string, unknown>);
  const effectiveHost = withFileTypes ? host : (optionsOrHost as ExecutionHostFs);
  if (effectiveHost == null) throw new Error("fsUtils.readdir requires an ExecutionHost");
  const entries = await effectiveHost.readDirectory(path);
  return withFileTypes ? entries : entries.map((entry) => entry.name);
}

/** app-server 文件系统门面（原 `Z`，导出 `Di`）。 */
export const appServerFileSystem = {
  async readFile(path: string, host: ExecutionHostFs): Promise<string> {
    return new Response((await host.readFile(path)) as BodyInit).text();
  },
  async readFileBase64(path: string, host: ExecutionHostFs): Promise<string> {
    return (await streamToBuffer(await host.readFile(path))).toString("base64");
  },
  async readFileSampleBytes(path: string, host: ExecutionHostFs, limit: number): Promise<string> {
    return (await streamToBuffer(await host.readFile(path), limit)).toString("base64");
  },
  async writeFile(path: string, contents: string, host: ExecutionHostFs): Promise<void> {
    await host.writeFile(path, contents);
  },
  async writeFileBuffer(path: string, contents: Uint8Array, host: ExecutionHostFs): Promise<void> {
    await host.writeFile(path, contents);
  },
  async mkdir(path: string, options: Record<string, unknown> = {}, host: ExecutionHostFs): Promise<void> {
    await host.createDirectory(path, options);
  },
  stat(path: string, host: ExecutionHostFs, options: { bypassCache?: boolean; followSymlinks?: boolean } = {}): Promise<unknown> {
    return host.stat(path, { bypassCache: options.bypassCache ?? false, followSymlinks: options.followSymlinks ?? true });
  },
  readdir: readDirectory,
  async rm(path: string, options: Record<string, unknown> = {}, host: ExecutionHostFs): Promise<void> {
    await host.remove(path, options);
  },
  async copyFile(from: string, to: string, host: ExecutionHostFs, options: Record<string, unknown> = {}): Promise<void> {
    await host.copyFile(from, to, options);
  },
  async cp(from: string, to: string, options: Record<string, unknown> = {}, host: ExecutionHostFs): Promise<void> {
    await host.copy(from, to, options);
  },
};

// ---------------------------------------------------------------------------
// 兼容导出（wsl-paths 分区 15 个压缩名）
// ---------------------------------------------------------------------------

export {
  isWslPath as Ui,
  wslDistroFromUnc as Hi,
  windowsToWslPath as Vi,
  sanitizedProcessEnv as Bi,
  setShouldSpawnInsideWsl as Li,
  shouldSpawnInsideWsl as Ri,
  shouldUseWslPaths as zi,
  wslDistroName as Mi,
  resolveWslDistro as Ni,
  buildWslEnvDirective as Ai,
  getInteractivePathFromWslBash as Fi,
  wslToWindowsPath as ji,
  resolveCodexHome as Oi,
  resolveExecutionCodexHome as ki,
  appServerFileSystem as Di,
};
