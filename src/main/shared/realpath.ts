// shared chunk：跨平台 realpath 解析（realpath 分区）。
//
// 对应 src-DldfpmrL.ts 的 L56,242-56,314 区段：
//   - o6 = 5000ms 超时；s6 = 16384B 输出上限
//   - u6（Lt）：resolveRealpaths——按 host.platformFamily() 分派：
//     windows 本地 → realpath（node fs）；windows 远程 → PowerShell
//     符号链接解析（f6，c6 固定 powershell.exe 路径 + l6 逐段解析
//     Target 的脚本）；其余 → `pwd -P`（d6；darwin 本地用 /bin/pwd）
//   - FC/NC/IC（L19,422-19,441）：spawn 完成 + 流式 stdout/stderr 收集
//
// 兼容导出：Lt=u6。

// ---------------------------------------------------------------------------
// 进程输出收集（原 `FC`/`NC`/`IC`）
// ---------------------------------------------------------------------------

/** 可等待的流式进程（spawn 返回形态）。 */
export interface SpawnedProcessLike {
  wait(): Promise<{ code: number; [key: string]: unknown }>;
  stdout: unknown;
  stderr: unknown;
}

/** 流 → 字节（原 `NC`：经 Response 桥读全量）。 */
async function streamBytes(stream: unknown): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream as BodyInit).arrayBuffer());
}

/** 字节 → utf8（原 `IC`，BOM 忽略）。 */
function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
}

/** 等待进程完成并收集输出（原 `FC`）。 */
export async function waitForProcessOutput(process: SpawnedProcessLike): Promise<{ code: number; stdout: string; stderr: string; [key: string]: unknown }> {
  const [status, stdout, stderr] = await Promise.all([process.wait(), streamBytes(process.stdout), streamBytes(process.stderr)]);
  return { ...status, stdout: decodeUtf8(stdout), stderr: decodeUtf8(stderr) };
}

// ---------------------------------------------------------------------------
// realpath 解析（原 `u6`/`d6`/`f6`）
// ---------------------------------------------------------------------------

/** 超时（原 `o6`）。 */
const SPAWN_TIMEOUT_MS = 5_000;

/** 输出上限（原 `s6`）。 */
const OUTPUT_BYTES_CAP = 16_384;

/** Windows 固定 PowerShell 路径（原 `c6`）。 */
const WINDOWS_POWERSHELL_PATH = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0";

/** 逐段解析符号链接的 PowerShell 脚本（原 `l6`）。 */
const POWERSHELL_REALPATH_SCRIPT = `$fullPath = [IO.Path]::GetFullPath($args[0])
$currentPath = [IO.Path]::GetPathRoot($fullPath)
foreach ($segment in $fullPath.Substring($currentPath.Length) -split '[\\\\/]') {
  if ($segment.Length -eq 0) {
    continue
  }
  $item = Get-Item -LiteralPath (Join-Path $currentPath $segment) -Force
  while ($null -ne $item.Target) {
    $target = @($item.Target)[0]
    if (-not [IO.Path]::IsPathRooted($target)) {
      $target = Join-Path $item.Parent.FullName $target
    }
    $item = Get-Item -LiteralPath $target -Force
  }
  $currentPath = $item.FullName
}
[Console]::Out.Write($currentPath)`;

/** spawn 宿主面（u6 依赖的最小接口）。 */
export interface RealpathHost {
  isLocal: boolean;
  platformFamily(): Promise<string>;
  spawn(request: { args: string[]; cwd: string; outputBytesCap: number | null; signal?: AbortSignal; timeoutMs: number }): Promise<SpawnedProcessLike>;
}

/** posix realpath（原 `d6`：pwd -P；darwin 本地用 /bin/pwd）。 */
async function posixRealpath(path: string, host: RealpathHost, signal?: AbortSignal): Promise<string | null> {
  const { code, stdout } = await waitForProcessOutput(
    await host.spawn({
      args: [host.isLocal && process.platform === "darwin" ? "/bin/pwd" : "pwd", "-P"],
      cwd: path,
      outputBytesCap: OUTPUT_BYTES_CAP,
      signal,
      timeoutMs: SPAWN_TIMEOUT_MS,
    }),
  );
  if (code !== 0) return null;
  const trimmed = stdout.replace(/\r?\n$/, "");
  return trimmed.length === 0 ? null : trimmed;
}

/** Windows 远程 realpath（原 `f6`：PowerShell 符号链接解析）。 */
async function windowsRemoteRealpath(path: string, host: RealpathHost, signal?: AbortSignal): Promise<string | null> {
  const { code, stdout } = await waitForProcessOutput(
    await host.spawn({
      args: [`${WINDOWS_POWERSHELL_PATH}\\powershell.exe`, "-NoProfile", "-NonInteractive", "-Command", POWERSHELL_REALPATH_SCRIPT, path],
      cwd: WINDOWS_POWERSHELL_PATH,
      outputBytesCap: OUTPUT_BYTES_CAP,
      signal,
      timeoutMs: SPAWN_TIMEOUT_MS,
    }),
  );
  return code === 0 ? (stdout.length === 0 ? null : stdout) : null;
}

/**
 * 批量 realpath（原 `u6`，导出 `Lt`）。
 * platformFamily 未知（抛错）时返回空映射；单条失败静默跳过。
 */
export async function resolveRealpaths(paths: string[], host: RealpathHost, signal?: AbortSignal): Promise<Record<string, string>> {
  let family: string;
  try {
    family = await host.platformFamily();
  } catch {
    return {};
  }
  const entries = await Promise.all(
    paths.map(async (path) => {
      try {
        const resolved =
          family === "windows"
            ? host.isLocal
              ? await realPathViaFs(path)
              : await windowsRemoteRealpath(path, host, signal)
            : await posixRealpath(path, host, signal);
        return resolved == null ? null : ([path, resolved] as const);
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry != null));
}

/** node fs realpath（windows 本地路径）。 */
async function realPathViaFs(path: string): Promise<string | null> {
  const { realpath } = await import("node:fs/promises");
  return realpath(path);
}

// ---------------------------------------------------------------------------
// 兼容导出（realpath 分区 1 个压缩名）
// ---------------------------------------------------------------------------

export { resolveRealpaths as Lt };
