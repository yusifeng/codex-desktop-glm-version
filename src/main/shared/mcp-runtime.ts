import { accessSync, constants, existsSync, readdirSync, statSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { getPrimaryRuntimeFrameworkRoot, setPrimaryRuntimeFrameworkRoot } from "./runtime-state";

/** 原 mcp-rpc 的 Windows core 注册状态。 */
export function setWindowsCoreRoot(root: string | null): void {
  setPrimaryRuntimeFrameworkRoot(root);
  bundledPluginsRoot = root;
}

let bundledPluginsRoot: string | null = null;
let shouldSpawnInsideWsl = false;

/** 注册当前 primary runtime 的插件根目录（原 dY）。 */
export function setBundledPluginsRoot(root: string | null): void {
  bundledPluginsRoot = root;
}

export function bundledPluginNames(): string[] {
  if (bundledPluginsRoot == null) return [];
  try {
    return readdirSync(join(bundledPluginsRoot, "plugins"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name.toLowerCase());
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

function isFile(path: string): boolean {
  try { return statSync(path).isFile(); } catch { return false; }
}
function isDirectory(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}
function localAppPath(...parts: string[]): string {
  return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), ...parts);
}
function runtimeRoot(resourcesPath?: string): string | null {
  const root = resourcesPath ?? getPrimaryRuntimeFrameworkRoot();
  if (root == null) return null;
  const candidates = [join(root, "dependencies"), root];
  return candidates.find((candidate) => isDirectory(join(candidate, "bin"))) ?? null;
}
function executableFromRuntime(name: string, resourcesPath?: string): string | null {
  const root = runtimeRoot(resourcesPath);
  if (root == null) return null;
  const candidate = join(root, "bin", name);
  return isFile(candidate) ? candidate : null;
}

/** 原 gY：当前 runtime 中的 ripgrep。 */
export function resolveRipgrepPath(resourcesPath?: string): string | null {
  return executableFromRuntime(process.platform === "win32" ? "rg.exe" : "rg", resourcesPath);
}

/** 原 vY：当前 runtime 中的 node。 */
export function resolveNodePath(resourcesPath?: string): string | null {
  return executableFromRuntime(process.platform === "win32" ? "node.exe" : "node", resourcesPath);
}

/** 原 _Y：当前 runtime 中的 node repl。 */
export function resolveNodeReplPath(resourcesPath?: string): string | null {
  return executableFromRuntime(process.platform === "win32" ? "node_repl.exe" : "node_repl", resourcesPath);
}

/** 原 yY：primary runtime 的 node_modules 路径。 */
export function resolveNodeModuleDirs(resourcesPath?: string): string[] {
  const node = resolveNodePath(resourcesPath);
  if (node == null) return [];
  const root = dirname(dirname(node));
  const modules = join(root, process.platform === "win32" ? "bin" : "lib", "node_modules");
  return isDirectory(modules) ? [modules] : [];
}

/** 原 bY：Windows computer-use helper。 */
export function resolveWindowsComputerUseHelperPath(resourcesPath?: string, arch = process.arch): string | null {
  const modules = resolveNodeModuleDirs(resourcesPath)[0];
  if (modules == null) return null;
  const root = join(modules, "@oai", "sky", "bin", "windows", arch === "arm64" ? "codex-computer-use-arm64.exe" : "codex-computer-use.exe");
  return isFile(root) ? root : null;
}

/** 原 SY：Windows helper transport module。 */
export function resolveWindowsComputerUseHelperTransportModulePath(resourcesPath?: string): string | null {
  const modules = resolveNodeModuleDirs(resourcesPath)[0];
  if (modules == null) return null;
  const file = join(modules, "@oai", "sky", "dist", "project", "cua", "sky_js", "src", "targets", "windows", "internal", "helper_transport.js");
  return isFile(file) ? file : null;
}

/** 原 CY：Codex CLI 路径。 */
export function resolveCodexPath(resourcesPath?: string): string | null {
  const name = process.platform === "win32" ? "codex.exe" : "codex";
  const candidate = executableFromRuntime(name, resourcesPath);
  if (candidate != null) return candidate;
  if (process.platform === "win32") {
    const local = localAppPath("OpenAI", "Codex", "bin", name);
    return isFile(local) ? local : null;
  }
  return null;
}

/** 原 hX：runtime 安装根目录。 */
export function resolveRuntimeInstallRoot(options: { installRoot?: string } = {}): string {
  return options.installRoot ?? join(homedir(), ".cache", "codex-runtimes");
}

/** 原 wX：校验 node 与 node_modules 均存在的 runtime 快照。 */
export async function resolveInstalledRuntime(options: { installRoot?: string; target?: { platform: NodeJS.Platform } } = {}) {
  const root = resolveRuntimeInstallRoot(options);
  const node = resolveNodePath(root);
  const nodeModules = resolveNodeModuleDirs(root)[0] ?? null;
  if (node == null || nodeModules == null || !isDirectory(nodeModules)) return null;
  return { nodePath: node, nodeModulesPath: nodeModules, runtimeRoot: root };
}

/** 原 DX：primary runtime 诊断快照。 */
export async function primaryRuntimeDiagnostics(): Promise<Record<string, unknown>> {
  const runtimeRoot = getPrimaryRuntimeFrameworkRoot();
  const diagnostics = await resolveInstalledRuntime({ installRoot: runtimeRoot ?? undefined });
  return {
    runtimeSource: runtimeRoot == null ? "archive" : "framework",
    runtimeRoot,
    diagnostics,
    validation: diagnostics == null ? null : { installed: true, problems: [] },
  };
}

/** 原 tY：core gate。 */
export function setCoreGate(root: string | null): void {
  shouldSpawnInsideWsl = root != null;
}

function executableOnPath(command: string, options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): string | undefined {
  if (command.includes("/") || (process.platform === "win32" && command.includes("\\"))) return command;
  const env = options.env ?? process.env;
  const pathValue = env.PATH ?? env.Path;
  if (pathValue == null) return undefined;
  for (const entry of pathValue.split(delimiter)) {
    const candidate = resolve(options.cwd ?? process.cwd(), entry, command);
    if (isFile(candidate)) {
      try { accessSync(candidate, constants.X_OK); return candidate; } catch { /* continue */ }
    }
  }
  return undefined;
}

/** 原 sJ：带 PATH 解析的 executable resolver。 */
export const executableResolver = {
  resolve(command: string, options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
    return executableOnPath(command, options);
  },
};

export interface SpawnProcessOptions {
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
  collectOutput?: boolean;
  detached?: boolean;
  streamStdin?: boolean;
  spawnInsideWsl?: boolean;
  allowedNonZeroExitCodes?: number[];
  stdoutChunkHandler?: (chunk: Buffer) => void;
  stderrChunkHandler?: (chunk: Buffer) => void;
  onExitHandler?: () => void;
}
export interface SpawnResult { stdout: string; stderr: string; code: number | null; signal: NodeJS.Signals | null; gitErrorKind?: string; }

class ProcessHandle {
  private result: Promise<SpawnResult>;
  private settled: SpawnResult | null = null;
  constructor(private child: ChildProcess, stdout: Buffer[], stderr: Buffer[], collect: boolean, result: Promise<SpawnResult>) {
    this.result = result.then((value) => { this.settled = value; return value; });
    child.stdin?.on("error", (error) => { if (!child.killed) child.kill(); this.child.emit("error", error); });
    this.stdout = stdout; this.stderr = stderr; this.collect = collect;
  }
  private stdout: Buffer[]; private stderr: Buffer[]; private collect: boolean;
  wait(): Promise<SpawnResult> { return this.result; }
  getStdout(): Buffer { return this.collect ? Buffer.concat(this.stdout) : Buffer.alloc(0); }
  getStderr(): Buffer { return this.collect ? Buffer.concat(this.stderr) : Buffer.alloc(0); }
  getExitCode(): number | null { return this.settled?.code ?? null; }
  isDone(): boolean { return this.settled != null; }
  getPid(): number | null { return this.child.pid ?? null; }
  kill(signal?: NodeJS.Signals | number): void { this.child.kill(signal); }
  writeStdin(data: string | Uint8Array, options: { closeStdin?: boolean } = {}): Promise<void> {
    const stdin = this.child.stdin;
    if (stdin == null) return Promise.reject(new Error("Process stdin is unavailable"));
    return new Promise((resolveWrite, reject) => {
      const callback = (error?: Error | null) => error == null ? resolveWrite() : reject(error);
      options.closeStdin ? stdin.end(data, callback) : stdin.write(data, callback);
    });
  }
}

/** 原 xJ：统一 spawn 入口，保留 output/abort/stream 回调语义。 */
export function spawnProcess(options: SpawnProcessOptions): ProcessHandle {
  const collect = options.collectOutput !== false;
  const stdout: Buffer[] = [], stderr: Buffer[] = [];
  const [command, ...args] = options.args;
  if (command == null) throw new Error("Cannot spawn an empty command");
  const env = { ...process.env, ...options.env };
  const child = spawn(executableResolver.resolve(command, { cwd: options.cwd, env }) ?? command, args, {
    cwd: options.cwd,
    detached: options.detached ?? false,
    env,
    stdio: [options.streamStdin ? "pipe" : "ignore", "pipe", "pipe"],
  });
  if (options.signal) {
    const abort = () => child.kill();
    options.signal.addEventListener("abort", abort, { once: true });
    child.once("close", () => options.signal?.removeEventListener("abort", abort));
  }
  const result = new Promise<SpawnResult>((resolveResult, rejectResult) => {
    child.stdout?.on("data", (chunk: Buffer) => { if (collect) stdout.push(chunk); options.stdoutChunkHandler?.(chunk); });
    child.stderr?.on("data", (chunk: Buffer) => { if (collect) stderr.push(chunk); options.stderrChunkHandler?.(chunk); });
    child.once("error", rejectResult);
    child.once("close", (code, signal) => {
      options.onExitHandler?.();
      resolveResult({ stdout: collect ? Buffer.concat(stdout).toString("utf8") : "", stderr: collect ? Buffer.concat(stderr).toString("utf8") : "", code, signal });
    });
  });
  return new ProcessHandle(child, stdout, stderr, collect, result);
}

/** 原 Uq：从 login shell 获取环境变量。 */
export async function loadLoginShellEnv(options: { shell?: string; interactive?: boolean; extraEnv?: NodeJS.ProcessEnv; signal?: AbortSignal } = {}): Promise<NodeJS.ProcessEnv> {
  const shell = options.shell ?? (process.platform === "win32" ? process.env.COMSPEC ?? "cmd.exe" : (() => { try { return userInfo().shell; } catch { return undefined; } })() ?? process.env.SHELL ?? "/bin/sh");
  const isPowerShell = /(?:pwsh|powershell)(?:\.exe)?$/i.test(basename(shell));
  const command = process.platform === "win32" && isPowerShell
    ? "Get-ChildItem Env: | ForEach-Object { \"$($_.Name)=$($_.Value)\" }"
    : "env";
  const result = await spawnProcess({ args: [shell, ...(options.interactive ? ["-ilc"] : ["-lc"]), command], env: options.extraEnv, signal: options.signal }).wait();
  if (result.code !== 0) throw new Error(result.stderr || `Login shell exited with ${result.code}`);
  const environment: NodeJS.ProcessEnv = {};
  for (const line of result.stdout.split(/\0|\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator > 0) environment[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return environment;
}

export {
  primaryRuntimeDiagnostics as En,
  setWindowsCoreRoot as Hn,
  resolveCodexPath as In,
  spawnProcess as Kn,
  resolveNodePath as Ln,
  resolveNodeModuleDirs as Mn,
  resolveWindowsComputerUseHelperPath as Nn,
  resolveRuntimeInstallRoot as On,
  resolveWindowsComputerUseHelperTransportModulePath as Pn,
  resolveNodeReplPath as Rn,
  resolveInstalledRuntime as Sn,
  setCoreGate as Un,
  recordExecutableResolution as Vn,
  loadLoginShellEnv as Zn,
  executableResolver as qn,
  resolveRipgrepPath as zn,
};

/** 原 mY：Windows runtime executable telemetry hook. */
export function recordExecutableResolution(_entry: { component: string; executablePath: string | null; source?: string; consumer?: string }): void {
  executableResolutionLog.set(`${_entry.consumer ?? "resolver"}:${_entry.component}`, {
    ..._entry,
    recordedAt: Date.now(),
  });
}

const executableResolutionLog = new Map<string, { component: string; executablePath: string | null; source?: string; consumer?: string; recordedAt: number }>();
