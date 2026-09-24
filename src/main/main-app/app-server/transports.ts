// app-server transport 家族：shell 环境加载 + SSH websocket + WSL stdio + 工厂。
//
// 对应 main-C-Mhak1n.ts 66,070-67,251：
//   - Codex CLI 安装脚本与平台判定（_E/pDe/mDe/hDe，66,070-66,093）
//   - shell 引用族（vE/yE/bE/SDe + CLI 路径 yDe/bDe/xDe/xE，66,091-66,142）
//   - npm 环境清洗（CDe/wDe/SE，66,143-66,157）
//   - shell env 加载状态机（TDe/CE/wE/TE/EE + DE/DDe/OE/kE/ODe/kDe，66,158-66,245）
//     ——in-flight 去重 + loaded 短路 + 超时档位缓存，懒求值语义不可提前
//   - 超时表与 SSH 常量（AE/ADe/jDe/jE/ME/NE/PE/FE/IE/LE，66,246-66,270）
//   - VE AppServerTransportSshWebsocket（66,308-66,958，~650 行）：
//     connect 快路径（hasConnected 直连，失败才 ensureRemoteAppServer）→
//     ssh -G proxycommand 探测 → codex 路径探测/版本校验/nohup 启动 →
//     ws over ssh proxy stream → 心跳
//   - proxycommand 解析族（IDe~KDe，67,027-67,174）+ qE withTimeout（67,175）
//   - HE createTransport 工厂（66,985）+ WSL stdio（QDe，67,219-67,251）
import { Duplex } from "node:stream";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { delimiter as pathDelimiter } from "node:path";
import { app } from "electron";
import {
  $n as shellQuote,
  Zn as loadLoginShellEnv,
  Ta as shellEnvFlagKey,
  Kn as spawnProcess,
  er as shellSplit,
  Fi as toWslPath,
  qn as executableResolver,
  Bi as sanitizedProcessEnv,
  Yu as isSupportedAppServerVersion,
  qu as unsupportedVersionMessage,
  Ju as parseVersionOutput,
  _n as WebSocket,
  hn as attachHeartbeat,
  gn as wrapWebSocket,
  fr as AppServerSetupError,
  dn as StdioTransport,
  cn as hostConfigWithSshKey,
} from "@chunk/shared";
import { getLogger, createTaggedLogger } from "@chunk/logger";

// ---------------------------------------------------------------------------
// Codex CLI 安装脚本（原 `_E`/`pDe`/`mDe`/`hDe`，66,070-66,090）
// ---------------------------------------------------------------------------

const POSIX_INSTALL_SCRIPT_URL = "https://chatgpt.com/codex/install.sh";
const WINDOWS_INSTALL_SCRIPT_URL = "https://chatgpt.com/codex/install.ps1";

/** uname -s → 安装平台（原 `mDe`）。 */
function resolveInstallPlatform(uname: string): "windows" | "posix" {
  const lowered = uname.toLowerCase();
  if (lowered.startsWith("cygwin") || lowered.startsWith("mingw") || lowered.startsWith("msys")) return "windows";
  switch (lowered) {
    case "darwin":
    case "linux":
      return "posix";
    default:
      throw new Error(`Codex CLI installation is not supported on ${uname}`);
  }
}

/** 平台对应的远端安装命令（原 `hDe`）。 */
function buildRemoteInstallScript(platform: "windows" | "posix"): string {
  switch (platform) {
    case "posix":
      return `if command -v curl >/dev/null 2>&1; then installer_script="$(curl -fsSL ${POSIX_INSTALL_SCRIPT_URL})" || exit; elif command -v wget >/dev/null 2>&1; then installer_script="$(wget -qO- ${POSIX_INSTALL_SCRIPT_URL})" || exit; else echo 'curl or wget is required to install the Codex CLI' >&2; exit 127; fi; printf '%s\\n' "$installer_script" | CODEX_RELEASE=latest CODEX_NON_INTERACTIVE=1 sh`;
    case "windows":
      return `install_dir="$(cygpath -w "\${CODEX_INSTALL_DIR:-$HOME/.local/bin}")" || exit; CODEX_INSTALL_DIR="$install_dir" powershell -ExecutionPolicy ByPass -c ${shellQuote(`$env:CODEX_RELEASE = "latest"; $env:CODEX_NON_INTERACTIVE = "1"; irm ${WINDOWS_INSTALL_SCRIPT_URL} | iex`)}`;
  }
}

// ---------------------------------------------------------------------------
// CLI 路径与 shell 引用（原 `gDe`~`SDe`，66,091-66,142）
// ---------------------------------------------------------------------------

const CODEX_CLI_NAME = "codex";
const EXPORT_INSTALL_DIR_PATH = 'PATH="${CODEX_INSTALL_DIR:-$HOME/.local/bin}:$PATH"; export PATH';
const EXPORT_CODEX_HOME = 'CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"; export CODEX_HOME';

/** POSIX 单引号转义（原 `vE`）。 */
function posixQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** 八进制转义（原 `SDe`）。 */
function octalEscape(bytes: Buffer): string {
  return Array.from(bytes, (byte) => `\\${byte.toString(8).padStart(3, "0")}`).join("");
}

/**
 * 构造远端登录 shell 命令（原 `yE`）。
 * 按 $SHELL 分派：csh/tcsh 走 csh login；nu 用 env 变量；fish/xonsh 与 POSIX
 * 同形但 -i；默认 POSIX login shell。payload 经 CODEX_REMOTE_PAYLOAD 传递。
 */
function buildRemoteLoginShellCommand(command: string, sentinel: Buffer): string {
  const payloadWithInstallDir = `${EXPORT_INSTALL_DIR_PATH}; ${command}`;
  const payload = sentinel == null ? payloadWithInstallDir : `printf '%b' ${posixQuote(octalEscape(sentinel))}; ${payloadWithInstallDir}`;
  const execPayload = `exec /bin/sh -c "$CODEX_REMOTE_PAYLOAD"`;
  const cshPayload = [
    `set loginsh=1`,
    `if ( -r /etc/csh.login ) source /etc/csh.login`,
    `if ( -r ~/.login ) source ~/.login`,
    execPayload,
  ].join("; ");
  const posixPayload = `${EXPORT_CODEX_HOME}; ${execPayload}`;
  return `sh -c ${posixQuote([
    `if [ -z "$SHELL" ] || [ ! -x "$SHELL" ]; then echo "Codex remote SSH requires SHELL to point to an executable login shell" >&2; exit 127; fi;`,
    `CODEX_REMOTE_PAYLOAD="$1"; export CODEX_REMOTE_PAYLOAD;`,
    'case "${SHELL##*/}" in',
    `csh|tcsh) exec "$SHELL" -i -c ${posixQuote(cshPayload)} ;;`,
    `nu) exec "$SHELL" -l -i -c ${posixQuote(`exec /bin/sh -c $env.CODEX_REMOTE_PAYLOAD`)} ;;`,
    `fish|xonsh) exec "$SHELL" -l -i -c ${posixQuote(execPayload)} ;;`,
    `*) exec "$SHELL" -l -i -c ${posixQuote(posixPayload)} ;;`,
    `esac`,
  ].join(" "))} sh ${posixQuote(payload)}`;
}

/** 探测登录 shell 的 sh 命令（原 `bE`）。 */
function loginShellProbeCommand(): [string, string, string] {
  return [
    "sh",
    "-c",
    `login_shell="\${SHELL:-}"
if [ -z "$login_shell" ] && command -v getent >/dev/null 2>&1; then
  login_shell="$(getent passwd "$(id -un)" | cut -d: -f7 || true)"
fi
if [ -z "$login_shell" ] || [ ! -x "$login_shell" ]; then
  login_shell="/bin/bash"
fi
exec "$login_shell" -il`,
  ];
}

/** CODEX_CLI_PATH 环境变量（原 `yDe`）。 */
function cliPathOverride(): string | null {
  const value = process.env.CODEX_CLI_PATH;
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** 是否带路径分隔符（原 `bDe`）。 */
function hasPathSeparator(value: string): boolean {
  return /[\\/]/.test(value) || /^[a-zA-Z]:/.test(value);
}

/** 仅当 CODEX_CLI_PATH 是裸名字时才采用（原 `xDe`）。 */
function cliNameOverride(): string | null {
  const value = cliPathOverride();
  return value == null || hasPathSeparator(value) ? null : value;
}

/** codex CLI 调用名（原 `xE`）。 */
function codexCliName(): string {
  return cliNameOverride() ?? CODEX_CLI_NAME;
}

// ---------------------------------------------------------------------------
// npm 环境清洗（原 `CDe`/`wDe`/`SE`，66,143-66,157）
// ---------------------------------------------------------------------------

const NPM_EXACT_ENV_KEYS = new Set([
  "INIT_CWD",
  "npm_command",
  "npm_execpath",
  "npm_node_execpath",
  "PNPM_PACKAGE_NAME",
  "PNPM_SCRIPT_SRC_DIR",
]);
const NPM_ENV_PREFIXES = ["npm_config_", "npm_lifecycle_", "npm_package_"];

/** 开发模式下清掉 npm 注入的环境变量（原 `SE`）。 */
function stripNpmEnv(env: Record<string, string | undefined>) {
  for (const key of Object.keys(env)) {
    const lowered = key.toLowerCase();
    if (NPM_EXACT_ENV_KEYS.has(key) || NPM_ENV_PREFIXES.some((prefix) => lowered.startsWith(prefix)))
      delete env[key];
  }
}

// ---------------------------------------------------------------------------
// shell env 加载状态机（原 66,158-66,245）
// ---------------------------------------------------------------------------

const SHELL_ENV_DEFAULT_TIMEOUT_MS = 5e3;
/** 独立 userData 时固定 CODEX_HOME（模块加载期求值，原 `CE`）。 */
const CODEX_HOME_SNAPSHOT = process.env.CODEX_ELECTRON_USER_DATA_PATH?.trim() ? process.env.CODEX_HOME : undefined;
/** in-flight promise 缓存（原 `wE`）。 */
let shellEnvPromise: Promise<ShellEnvResult> | null = null;
/** in-flight 的超时档位（原 `TE`）：同档位复用，更高档位重发。 */
let shellEnvTimeoutMs: number | null = null;
/** 最近结果缓存（原 `EE`）：loaded 短路。 */
let lastShellEnvResult: ShellEnvResult | null = null;

interface ShellEnvResult {
  status: "loaded" | "failed" | "timed_out" | "loading";
  caller?: string;
  detail?: string;
  path?: string | null;
  durationMs?: number;
  pathEntryCount?: number;
  resultSource?: string;
  timeoutMs?: number;
}

/** 启动期加载（原 `EDe`）。 */
async function loadShellEnvForStartup(): Promise<ShellEnvResult> {
  return loadShellEnv({ caller: "startup", retryFailed: false });
}

/** 加载登录 shell 环境（原 `DE`）：loaded 短路 + in-flight 去重 + 超时档位。 */
async function loadShellEnv({
  caller = "startup",
  retryFailed = true,
  timeoutMs = SHELL_ENV_DEFAULT_TIMEOUT_MS,
}: { caller?: string; retryFailed?: boolean; timeoutMs?: number } = {}): Promise<ShellEnvResult> {
  if (lastShellEnvResult?.status === "loaded" || (lastShellEnvResult != null && !retryFailed))
    return { ...lastShellEnvResult, caller, resultSource: "cache" };
  if (shellEnvPromise != null && shellEnvTimeoutMs != null && shellEnvTimeoutMs >= timeoutMs)
    return shellEnvPromise.then((result) => ({ ...result, caller }));
  const attempt = loadShellEnvOnce(caller, timeoutMs);
  shellEnvPromise = attempt;
  shellEnvTimeoutMs = timeoutMs;
  try {
    const result = await attempt;
    rememberShellEnvResult(result);
    return result;
  } finally {
    if (shellEnvPromise === attempt) {
      shellEnvPromise = null;
      shellEnvTimeoutMs = null;
    }
  }
}

async function loadShellEnvOnce(caller: string, timeoutMs: number): Promise<ShellEnvResult> {
  const startedAt = Date.now();
  if (!app.isPackaged) stripNpmEnv(process.env);
  const abort = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const outcome = await Promise.race([
    loadLoginShellEnv({ interactive: true, extraEnv: { [shellEnvFlagKey]: "1" }, signal: abort.signal })
      .then((userEnv) => ({ status: "loaded" as const, userEnv }))
      .catch((error) => ({ status: "failed" as const, error })),
    new Promise<{ status: "timed_out" }>((resolve) => {
      timeoutHandle = setTimeout(() => {
        abort.abort();
        resolve({ status: "timed_out" });
      }, timeoutMs);
      (timeoutHandle as ReturnType<typeof setTimeout> & { unref(): void }).unref();
    }),
  ]).finally(() => {
    if (timeoutHandle != null) clearTimeout(timeoutHandle);
  });
  if (outcome.status === "loaded") {
    Object.assign(process.env, outcome.userEnv);
    if (CODEX_HOME_SNAPSHOT != null) process.env.CODEX_HOME = CODEX_HOME_SNAPSHOT;
    if (!app.isPackaged) stripNpmEnv(process.env);
    return {
      status: "loaded",
      path: process.env.PATH ?? null,
      ...shellEnvMetrics(startedAt, caller, timeoutMs),
    };
  }
  const detail =
    outcome.status === "timed_out"
      ? `Timed out after ${timeoutMs}ms.`
      : (outcome as { error: unknown }).error instanceof Error
        ? ((outcome as { error: Error }).error.message)
        : String((outcome as { error: unknown }).error);
  getLogger().warning("Failed to load shell env", {
    safe: {
      caller,
      durationMs: Date.now() - startedAt,
      pathEntryCount: pathEntryCount(process.env.PATH ?? null),
      resultSource: "load",
      status: outcome.status,
      timeoutMs,
    },
    sensitive: { detail, path: process.env.PATH ?? null },
  });
  return {
    status: outcome.status,
    detail,
    path: process.env.PATH ?? null,
    ...shellEnvMetrics(startedAt, caller, timeoutMs),
  };
}

function shellEnvMetrics(startedAt: number, caller: string, timeoutMs: number) {
  const path = process.env.PATH ?? null;
  return {
    caller,
    durationMs: Date.now() - startedAt,
    pathEntryCount: pathEntryCount(path),
    resultSource: "load",
    timeoutMs,
  };
}

function pathEntryCount(path: string | null): number {
  return path == null || path === "" ? 0 : path.split(pathDelimiter).length;
}

/** 记住最近结果（原 `kDe`）：loaded 恒久记住，失败仅在尚无 loaded 时记住。 */
function rememberShellEnvResult(result: ShellEnvResult) {
  if (lastShellEnvResult?.status !== "loaded" || result.status === "loaded") lastShellEnvResult = result;
}

// ---------------------------------------------------------------------------
// 超时表与 SSH 常量（原 66,246-66,270）
// ---------------------------------------------------------------------------

const SSH_TIMEOUTS = {
  localSshConfigProbe: 5e3,
  proxyWebSocketOpen: 3e4,
  remoteLoginShellCommandMinimum: 6e4,
  remoteCodexInstall: 6e5,
  shellEnvLoad: 1e4,
} as const;

/** ws over ssh 的虚拟 URL（原 `ADe`）。 */
const REMOTE_RPC_WS_URL = "ws://codex-app-server/rpc";
const REMOTE_CONTROL_DIR = '"${CODEX_HOME:-$HOME/.codex}/app-server-control"';
const REMOTE_LOG_PATH = '"${CODEX_HOME:-$HOME/.codex}/app-server-control/app-server.log"';
const FORWARDED_AGENT_SOCK = '"${CODEX_HOME:-$HOME/.codex}/app-server-control/forwarded-ssh-agent.sock"';
/** ssh-agent 转发 sock 的维护片段（原 `NE`）。 */
const AGENT_SOCK_SETUP = [
  'if [ -S "${SSH_AUTH_SOCK:-}" ]; then ln -sfn -- "$SSH_AUTH_SOCK" ',
  FORWARDED_AGENT_SOCK,
  `; elif [ ! -S `,
  FORWARDED_AGENT_SOCK,
  ` ]; then rm -f -- `,
  FORWARDED_AGENT_SOCK,
  `; fi`,
].join("");
const SSH_BASE_OPTIONS = { batchMode: "BatchMode=yes", serverAliveIntervalSeconds: 15, serverAliveCountMax: 12 };
const CODEX_NOT_FOUND_EXIT_CODE = 86;
const SENTINEL_BYTES = 8;
/** 每个 ssh 连接的启动 gate 串行化（原 `LE`）。 */
const sshStartupGates = new Map<string, Promise<void>>();

/** ssh 公共参数（原 `RE`）。 */
function sshCommonArgs(connectTimeoutSeconds?: number | null): string[] {
  const args = ["-v", "-o", SSH_BASE_OPTIONS.batchMode];
  if (connectTimeoutSeconds != null) args.push("-o", `ConnectTimeout=${connectTimeoutSeconds}`);
  args.push(
    "-o",
    `ServerAliveInterval=${SSH_BASE_OPTIONS.serverAliveIntervalSeconds}`,
    "-o",
    `ServerAliveCountMax=${SSH_BASE_OPTIONS.serverAliveCountMax}`,
  );
  return args;
}

/** ssh -v 噪声清洗（原 `zE`）。 */
function cleanSshOutput(output: string): string {
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !/^debug\d+:/u.test(line))
    .join("\n")
    .trim();
}

/** ssh 目标参数（原 `BE`）：alias 优先，否则 identity/port/host。 */
function sshTargetArgs(connection: SshConnectionSpec): string[] {
  if (connection.alias?.trim()) return [connection.alias.trim()];
  const args: string[] = [];
  if (connection.identity?.trim()) args.push("-i", connection.identity.trim());
  if (connection.port != null) args.push("-p", String(connection.port));
  args.push(connection.host);
  return args;
}

/** hostConfig 里的 ssh 段（原 `MDe`：读 hostConfig[n.cn]，有 sshHost 才返回）。 */
function sshSpecOfHostConfig(hostConfig: Record<string, unknown>): {
  sshHost: string;
  sshAlias?: string;
  sshPort?: number;
  identity?: string;
} | null {
  const spec = hostConfig[hostConfigWithSshKey as unknown as string] as { sshHost?: string } | null;
  return spec?.sshHost ? (spec as never) : null;
}

interface SshConnectionSpec {
  alias?: string | null;
  host: string;
  port?: number | null;
  identity?: string | null;
}

// ---------------------------------------------------------------------------
// AppServerTransportSshWebsocket（原 `VE`，66,308-66,958）
// ---------------------------------------------------------------------------

interface SshTransportOptions {
  sshConnection: SshConnectionSpec;
  getConnectTimeoutSeconds?(): number | null | undefined;
}

/** SSH websocket transport（原 `VE`）。 */
class AppServerTransportSshWebsocket {
  options: SshTransportOptions;
  kind = "websocket";
  logger = createTaggedLogger("AppServerTransportSshWebsocket");
  proxyStreams = new Set<Duplex>();
  hasConnected = false;
  installedCodexVersion: string | null | undefined;

  constructor(options: SshTransportOptions) {
    this.options = options;
  }

  supportsReconnect(): boolean {
    return true;
  }

  onAppServerInitializationFailed() {
    this.hasConnected = false;
  }

  dispose() {
    for (const stream of this.proxyStreams) stream.destroy();
    this.proxyStreams.clear();
  }

  /** 连接：先等 shell env（proxycommand 依赖 PATH 时阻塞），hasConnected 走快路径。 */
  async connect() {
    const shellEnv = this.startShellEnvLoadForSsh();
    shellEnv.promise
      .then((result) => {
        this.logShellEnvLoadForSsh({ result, sshAttempted: true, sshPhase: "connect" });
      })
      .catch((error) => {
        this.logger.warning("ssh_websocket_v0.shell_env_load_unexpected_error", {
          safe: { ...shellEnvSafeTags(shellEnv.getState()), sshAttempted: true, sshPhase: "connect" },
          sensitive: {
            error,
            path: process.env.PATH ?? null,
            sshAlias: this.options.sshConnection.alias,
            sshHost: this.options.sshConnection.host,
            sshPort: this.options.sshConnection.port,
          },
        });
      });
    await this.waitForShellEnvIfProxyCommandNeedsPath(shellEnv, "connect");
    const context = { phase: "connect", shellEnv: shellEnv.getState() };
    if (this.hasConnected) {
      try {
        return await this.connectToRemoteAppServer(context);
      } catch (error) {
        this.logger.warning("ssh_websocket_v0.existing_app_server_reconnect_failed", {
          safe: { ...shellEnvSafeTags(context.shellEnv), sshPhase: context.phase },
          sensitive: {
            error,
            sshAlias: this.options.sshConnection.alias,
            sshHost: this.options.sshConnection.host,
            sshPort: this.options.sshConnection.port,
          },
        });
      }
    }
    this.installedCodexVersion = undefined;
    await this.ensureRemoteAppServer(context);
    return this.connectToRemoteAppServer(context);
  }

  async connectToRemoteAppServer(context: { phase: string; shellEnv: ShellEnvResult }) {
    return this.runWithSshStartupGate(async () => {
      const currentStream = { current: null as Duplex | null };
      const socket = new WebSocket(REMOTE_RPC_WS_URL, {
        perMessageDeflate: false,
        createConnection: () => ((currentStream.current = this.createSshProxyStream(context)), currentStream.current),
      });
      socket.once("close", () => {
        currentStream.current?.destroy();
      });
      try {
        await waitForWebsocketOpen(socket);
      } catch (error) {
        socket.once("error", () => void 0);
        currentStream.current?.destroy();
        socket.terminate();
        throw error;
      }
      attachHeartbeat(socket, {
        onPongTimeout: () => {
          socket.terminate();
        },
      });
      this.hasConnected = true;
      return wrapWebSocket(socket);
    });
  }

  startShellEnvLoadForSsh() {
    let state: ShellEnvResult = {
      caller: "ssh_connect",
      pathEntryCount: pathEntryCount(process.env.PATH ?? null),
      resultSource: "pending",
      status: "loading",
    };
    return {
      getState: () => state,
      promise: loadShellEnv({ caller: "ssh_connect", timeoutMs: SSH_TIMEOUTS.shellEnvLoad }).then((result) => {
        state = pickShellEnvTags(result);
        return result;
      }),
    };
  }

  /** proxycommand 依赖 PATH 时等待 shell env 完成（原 `waitForShellEnvIfProxyCommandNeedsPath`）。 */
  async waitForShellEnvIfProxyCommandNeedsPath(
    shellEnv: { getState(): ShellEnvResult; promise: Promise<ShellEnvResult> },
    sshPhase: string,
  ) {
    await Promise.resolve();
    if (shellEnv.getState().status !== "loading") return;
    const dependency = await this.getSshProxyCommandShellEnvDependency();
    this.logger.info("ssh_websocket_v0.shell_env_wait_decision", {
      safe: {
        needsShellEnv: dependency.needsShellEnv,
        pathEntryCount: dependency.pathEntryCount,
        reason: dependency.reason,
        sshPhase,
        timeoutMs: SSH_TIMEOUTS.localSshConfigProbe,
      },
      sensitive: {
        commandName: dependency.commandName,
        path: process.env.PATH ?? null,
        proxyCommand: dependency.proxyCommand,
        sshAlias: this.options.sshConnection.alias,
        sshHost: this.options.sshConnection.host,
        sshPort: this.options.sshConnection.port,
      },
    });
    if (!dependency.needsShellEnv) return;
    const startedAt = Date.now();
    try {
      const result = await shellEnv.promise;
      this.logger.info("ssh_websocket_v0.shell_env_wait_completed", {
        safe: {
          durationMs: Date.now() - startedAt,
          pathEntryCount: result.pathEntryCount,
          reason: dependency.reason,
          resultSource: result.resultSource,
          sshPhase,
          status: result.status,
          timeoutMs: result.timeoutMs,
        },
        sensitive: {
          detail: result.status === "loaded" ? null : result.detail,
          path: result.path,
          proxyCommand: dependency.proxyCommand,
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
        },
      });
    } catch (error) {
      this.logger.warning("ssh_websocket_v0.shell_env_wait_unexpected_error", {
        safe: { durationMs: Date.now() - startedAt, reason: dependency.reason, sshPhase },
        sensitive: {
          error,
          proxyCommand: dependency.proxyCommand,
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
        },
      });
    }
  }

  /** ssh -G 探测 proxycommand 对 shell env 的依赖（原 `getSshProxyCommandShellEnvDependency`）。 */
  async getSshProxyCommandShellEnvDependency() {
    const startedAt = Date.now();
    try {
      const probe = await withTimeout({
        process: spawnProcess({
          args: ["ssh", "-G", ...sshTargetArgs(this.options.sshConnection)],
          spawnInsideWsl: false,
        }),
        timeoutMs: SSH_TIMEOUTS.localSshConfigProbe,
        timeoutMessage: "SSH: local ssh config probe timed out",
      });
      return probe.code === 0
        ? analyzeProxyCommand(probe.stdout, process.env.PATH ?? null)
        : (this.logger.warning("ssh_websocket_v0.ssh_config_probe_failed", {
            safe: { code: probe.code, durationMs: Date.now() - startedAt, timeoutMs: SSH_TIMEOUTS.localSshConfigProbe },
            sensitive: {
              sshAlias: this.options.sshConnection.alias,
              sshHost: this.options.sshConnection.host,
              sshPort: this.options.sshConnection.port,
              stderr: probe.stderr,
              stdout: probe.stdout,
            },
          }),
          proxyCommandProbeFailed());
    } catch (error) {
      return (
        this.logger.warning("ssh_websocket_v0.ssh_config_probe_failed", {
          safe: { durationMs: Date.now() - startedAt, timeoutMs: SSH_TIMEOUTS.localSshConfigProbe },
          sensitive: {
            error,
            sshAlias: this.options.sshConnection.alias,
            sshHost: this.options.sshConnection.host,
            sshPort: this.options.sshConnection.port,
          },
        }),
        proxyCommandProbeFailed()
      );
    }
  }

  logShellEnvLoadForSsh({
    result,
    sshAttempted,
    sshPhase,
  }: {
    result: ShellEnvResult;
    sshAttempted: boolean;
    sshPhase: string;
  }) {
    this.logger.info("ssh_websocket_v0.shell_env_load_completed", {
      safe: {
        caller: result.caller,
        durationMs: result.durationMs,
        pathEntryCount: result.pathEntryCount,
        resultSource: result.resultSource,
        sshAttempted,
        sshPhase,
        status: result.status,
        timeoutMs: result.timeoutMs,
      },
      sensitive: {
        detail: result.status === "loaded" ? null : result.detail,
        path: result.path,
        sshAlias: this.options.sshConnection.alias,
        sshHost: this.options.sshConnection.host,
        sshPort: this.options.sshConnection.port,
      },
    });
  }

  async ensureRemoteAppServer(context: { phase: string; shellEnv: ShellEnvResult }) {
    this.logger.info("ssh_websocket_v0.ensure_remote_app_server", {
      safe: { ...shellEnvSafeTags(context.shellEnv), sshAttempted: true, sshPhase: context.phase },
      sensitive: {
        sshAlias: this.options.sshConnection.alias,
        sshHost: this.options.sshConnection.host,
        sshPort: this.options.sshConnection.port,
      },
    });
    await this.startRemoteAppServer(context);
  }

  /** 远端 app-server 启动：codex 探测 → 版本校验 → nohup 启动。 */
  async startRemoteAppServer(context: { phase: string; shellEnv: ShellEnvResult }) {
    const cli = codexCliName();
    let probe;
    try {
      probe = await this.runRemoteLoginShellCommand({
        command: [
          `if command -v `,
          shellQuote(cli),
          ` >/dev/null 2>&1; then exit 0; fi; exit `,
          String(CODEX_NOT_FOUND_EXIT_CODE),
        ].join(""),
        context,
        operation: "codex_path_probe",
        timeoutMessage: "SSH: codex path probe timed out",
      });
    } catch (error) {
      throw this.createSshSetupError("remote_codex_lookup", error);
    }
    if (probe.code === CODEX_NOT_FOUND_EXIT_CODE)
      throw new AppServerSetupError({
        failureReason: "remote-codex-not-found",
        message: "No `codex` found in PATH. Please install the Codex CLI on the remote machine.",
        stage: "remote_codex_lookup",
      });
    if (probe.code !== 0)
      throw this.createSshSetupError("remote_codex_lookup", new Error(await this.getSshCommandFailureMessage(probe)));
    const installedVersion = await this.getInstalledCodexVersion(context);
    if (installedVersion != null && !isSupportedAppServerVersion(installedVersion))
      throw new Error(unsupportedVersionMessage + installedVersion);
    const bootstrapCommand = [
      'if [ "${CODEX_SSH_SKIP_APP_SERVER_BOOT:-}" = "true" ]; then exit 0; fi; ',
      `(umask 077; mkdir -p -- `,
      REMOTE_CONTROL_DIR,
      ` && (pkill -9 -U "$(id -u)" -f `,
      shellQuote(`${cli}.*[d]esktop-ssh-websocket-v0.sock`),
      ` || true) && `,
      AGENT_SOCK_SETUP,
      ` && : >`,
      REMOTE_LOG_PATH,
      `) && { SSH_AUTH_SOCK=`,
      FORWARDED_AGENT_SOCK,
      ` nohup `,
      shellQuote(cli),
      ` -c features.code_mode_host=true`,
      ` app-server --listen `,
      shellQuote(`unix://`),
      ` </dev/null >${REMOTE_LOG_PATH} 2>&1 & }`,
    ].join("");
    let bootstrap;
    try {
      bootstrap = await this.runRemoteLoginShellCommand({
        command: bootstrapCommand,
        context,
        operation: "app_server_bootstrap",
        timeoutMessage: "SSH: app-server bootstrap timed out",
      });
    } catch (error) {
      throw this.createSshSetupError("remote_app_server_start", error);
    }
    const { code, stdout, stderr } = bootstrap;
    if (code !== 0) {
      this.logger.warning("ssh_websocket_v0.remote_app_server_bootstrap_failed", {
        safe: { code },
        sensitive: {
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
          identity: this.options.sshConnection.identity,
          remoteLogPath: REMOTE_LOG_PATH,
          stdout,
          stderr,
        },
      });
      const message = await this.getSshCommandFailureMessage(bootstrap);
      throw this.createSshSetupError("remote_app_server_start", new Error(message));
    }
  }

  createSshSetupError(stage: string, error: unknown): unknown {
    if (error instanceof AppServerSetupError) return error;
    const message = error instanceof Error ? error.message : `SSH-backed app-server setup failed: ${String(error)}`;
    return new AppServerSetupError({ message, stage });
  }

  async getSshCommandFailureMessage(result: { code: number | null; stdout: string; stderr: string }): Promise<string> {
    return (
      cleanSshOutput([result.stderr, result.stdout].join("\n")) ||
      (result.code == null
        ? "Remote SSH failed without an exit code or stderr"
        : `Remote SSH failed with exit code ${result.code} and did not return stderr`)
    );
  }

  /** 远端 codex --version（缓存，原 `getInstalledCodexVersion`）。 */
  async getInstalledCodexVersion(context?: { phase: string; shellEnv: ShellEnvResult }): Promise<string | null> {
    if (this.installedCodexVersion !== undefined) return this.installedCodexVersion;
    const { code, stdout, stderr } = await this.runRemoteLoginShellCommand({
      command: `${shellQuote(codexCliName())} --version`,
      context,
      operation: "codex_version_probe",
      timeoutMessage: "SSH: codex --version check timed out",
    });
    return code === 0
      ? ((this.installedCodexVersion = parseVersionOutput(stdout || stderr)), this.installedCodexVersion)
      : (this.logger.warning("ssh_websocket_v0.remote_codex_version_probe_failed", {
          safe: { code },
          sensitive: {
            sshAlias: this.options.sshConnection.alias,
            sshHost: this.options.sshConnection.host,
            sshPort: this.options.sshConnection.port,
            stdout,
            stderr,
          },
        }),
        (this.installedCodexVersion = null),
        null);
  }

  /** 在远端安装 codex CLI（原 `installCodex`）。 */
  async installCodex(): Promise<void> {
    const startedAt = Date.now();
    let stage = "platform_probe";
    let stageStartedAt = startedAt;
    let platform: "windows" | "posix" | null = null;
    this.logger.info("ssh_websocket_v0.remote_codex_install_started", {
      safe: {},
      sensitive: {
        sshAlias: this.options.sshConnection.alias,
        sshHost: this.options.sshConnection.host,
        sshPort: this.options.sshConnection.port,
      },
    });
    try {
      platform = await this.getRemoteCodexInstallPlatform() as "windows" | "posix";
      this.logger.info("ssh_websocket_v0.remote_codex_install_platform_ready", {
        safe: { durationMs: Date.now() - stageStartedAt, platform },
        sensitive: {
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
        },
      });
      stage = "remote_install_command";
      stageStartedAt = Date.now();
      this.logger.info("ssh_websocket_v0.remote_codex_install_remote_command_started", {
        safe: { platform, timeoutMs: SSH_TIMEOUTS.remoteCodexInstall },
        sensitive: {
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
        },
      });
      const install = await this.runRemoteLoginShellCommand({
        command: buildRemoteInstallScript(platform),
        operation: "remote_codex_install",
        timeoutMessage: "SSH: codex install timed out",
        timeoutMs: SSH_TIMEOUTS.remoteCodexInstall,
      });
      if (install.code !== 0) throw new Error(await this.getSshCommandFailureMessage(install));
      this.logger.info("ssh_websocket_v0.remote_codex_install_completed", {
        safe: { durationMs: Date.now() - startedAt, platform, remoteCommandDurationMs: Date.now() - stageStartedAt },
        sensitive: {
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
        },
      });
    } catch (error) {
      this.logRemoteCodexInstallFailed({
        error,
        platform,
        stage,
        stageStartedAtMs: stageStartedAt,
        startedAtMs: startedAt,
      });
      throw error;
    }
  }

  logRemoteCodexInstallFailed({
    error,
    platform,
    stage,
    stageStartedAtMs,
    startedAtMs,
  }: {
    error: unknown;
    platform: string | null;
    stage: string;
    stageStartedAtMs: number;
    startedAtMs: number;
  }) {
    const now = Date.now();
    this.logger.warning("ssh_websocket_v0.remote_codex_install_failed", {
      safe: { durationMs: now - startedAtMs, platform, stage, stageDurationMs: now - stageStartedAtMs },
      sensitive: {
        error,
        sshAlias: this.options.sshConnection.alias,
        sshHost: this.options.sshConnection.host,
        sshPort: this.options.sshConnection.port,
      },
    });
  }

  async getRemoteCodexInstallPlatform(): Promise<string> {
    const probe = await this.runRemoteLoginShellCommand({
      command: "uname -s",
      operation: "remote_codex_platform_probe",
      timeoutMessage: "SSH: remote platform probe timed out",
    });
    if (probe.code !== 0) throw new Error(await this.getSshCommandFailureMessage(probe));
    const os = probe.stdout.trim();
    if (!os) throw new Error("Remote platform probe did not return an OS");
    return resolveInstallPlatform(os);
  }

  async killCodexProcess(): Promise<void> {
    const { code, stdout, stderr } = await this.runRemoteLoginShellCommand({
      command: `pkill -9 -U "$(id -u)" -f ${shellQuote(`${codexCliName()}.* app-server.* --listen`)}`,
      operation: "remote_codex_kill",
      timeoutMessage: "SSH: codex pkill timed out",
    });
    if (code === 0 || code === 1) {
      this.logger.info("ssh_websocket_v0.remote_codex_kill_completed", {
        safe: { matchedProcess: code === 0 },
        sensitive: {
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
          stdout,
          stderr,
        },
      });
      return;
    }
    throw new Error(stderr || stdout || `pkill failed with exit code ${code}`);
  }

  async runRemoteLoginShellCommand({
    command,
    context,
    operation,
    timeoutMessage,
    timeoutMs = SSH_TIMEOUTS.remoteLoginShellCommandMinimum,
  }: {
    command: string;
    context?: { phase: string; shellEnv: ShellEnvResult };
    operation: string;
    timeoutMessage: string;
    timeoutMs?: number;
  }) {
    return this.runWithSshStartupGate(() =>
      this.runRemoteLoginShellCommandWithoutGate({ command, context, operation, timeoutMessage, timeoutMs }),
    );
  }

  async runRemoteLoginShellCommandWithoutGate({
    command,
    context,
    operation,
    timeoutMessage,
    timeoutMs = SSH_TIMEOUTS.remoteLoginShellCommandMinimum,
  }: {
    command: string;
    context?: { phase: string; shellEnv: ShellEnvResult };
    operation: string;
    timeoutMessage: string;
    timeoutMs?: number;
  }) {
    const startedAt = Date.now();
    const sentinel = randomBytes(SENTINEL_BYTES);
    const connectTimeout = this.options.getConnectTimeoutSeconds?.();
    const effectiveTimeout = Math.max(SSH_TIMEOUTS.remoteLoginShellCommandMinimum, (connectTimeout ?? 0) * 1e3, timeoutMs);
    const child = spawnProcess({
      args: ["ssh", ...sshCommonArgs(connectTimeout), ...sshTargetArgs(this.options.sshConnection), buildRemoteLoginShellCommand(command, sentinel)],
      spawnInsideWsl: false,
    });
    const result = await withTimeout({ process: child, timeoutMs: effectiveTimeout, timeoutMessage });
    const stdout = stripSentinel(child.getStdout(), sentinel);
    this.logger.info("ssh_websocket_v0.remote_login_shell_command_completed", {
      safe: {
        code: result.code,
        durationMs: Date.now() - startedAt,
        operation,
        shellEnvCaller: context?.shellEnv.caller ?? "unknown",
        shellEnvPathEntryCount: context?.shellEnv.pathEntryCount ?? pathEntryCount(process.env.PATH ?? null),
        shellEnvResultSource: context?.shellEnv.resultSource ?? "unknown",
        shellEnvStatus: context?.shellEnv.status ?? "unknown",
        sshCommandKind: "remote_login_shell",
        sshPhase: context?.phase ?? "standalone",
        timeoutMs: effectiveTimeout,
      },
      sensitive: {
        sshAlias: this.options.sshConnection.alias,
        sshHost: this.options.sshConnection.host,
        sshPort: this.options.sshConnection.port,
        stdout,
        stderr: result.stderr,
      },
    });
    return { ...result, stdout };
  }

  /** ssh proxy 流（原 `createSshProxyStream`）：ssh -T + sentinel 同步 + Duplex 适配。 */
  createSshProxyStream(context: { phase: string; shellEnv: ShellEnvResult }): Duplex {
    const cli = codexCliName();
    const command = `${AGENT_SOCK_SETUP} && exec ${shellQuote(cli)} app-server proxy`;
    const sentinel = randomBytes(SENTINEL_BYTES);
    this.logger.info("ssh_websocket_v0.proxy_command_starting", {
      safe: {
        operation: "app_server_proxy",
        ...shellEnvSafeTags(context.shellEnv),
        sshCommandKind: "app_server_proxy",
        sshPhase: context.phase,
      },
      sensitive: {
        sshAlias: this.options.sshConnection.alias,
        sshHost: this.options.sshConnection.host,
        sshPort: this.options.sshConnection.port,
      },
    });
    const child = spawn(
      executableResolver.resolve("ssh") ?? "ssh",
      [
        "-T",
        ...sshCommonArgs(this.options.getConnectTimeoutSeconds?.()),
        ...sshTargetArgs(this.options.sshConnection),
        buildRemoteLoginShellCommand(command, sentinel),
      ],
      { env: sanitizedProcessEnv(process.env), stdio: ["pipe", "pipe", "pipe"] },
    );
    const { stdin, stdout, stderr } = child;
    if (stdin == null || stdout == null || stderr == null)
      throw (child.kill(), new Error("ssh proxy stdio was unavailable"));
    let stderrTail = "";
    stderr.on("data", (chunk) => {
      stderrTail = `${stderrTail}${chunk.toString("utf8")}`.slice(-4e3);
    });
    const stream = new Duplex({
      read() {
        stdout.resume();
      },
      write(chunk, encoding, callback) {
        stdin.write(chunk, encoding, callback);
      },
      final(callback) {
        stdin.end();
        callback();
      },
      destroy(error, callback) {
        child.kill();
        callback(error);
      },
    });
    Object.assign(stream, {
      setKeepAlive: () => stream,
      setNoDelay: () => stream,
      setTimeout: () => stream,
    });
    const onStdinError = (error: Error) => {
      stream.destroy(error);
    };
    stdin.on("error", onStdinError);
    this.proxyStreams.add(stream);
    stream.once("close", () => {
      this.proxyStreams.delete(stream);
    });
    let sentinelSeen = false;
    let pending = Buffer.alloc(0);
    stdout.on("data", (chunk: Buffer) => {
      let data = chunk;
      if (!sentinelSeen) {
        const combined = Buffer.concat([pending, chunk]);
        const index = combined.indexOf(sentinel);
        if (index === -1) {
          pending = combined.subarray(Math.max(0, combined.length - (sentinel.length - 1)));
          return;
        }
        sentinelSeen = true;
        data = combined.subarray(index + sentinel.length);
        pending = Buffer.alloc(0);
      }
      if (data.length !== 0 && !stream.push(data)) stdout.pause();
    });
    stdout.on("end", () => {
      stream.push(null);
    });
    child.on("error", (error) => {
      stream.destroy(error);
    });
    child.on("close", (code, signal) => {
      stdin.removeListener("error", onStdinError);
      if (code === 0) {
        stream.push(null);
        return;
      }
      const message = cleanSshOutput(stderrTail);
      this.logger.warning("ssh_websocket_v0.proxy_command_failed", {
        safe: {
          code,
          operation: "app_server_proxy",
          ...shellEnvSafeTags(context.shellEnv),
          signal,
          sshCommandKind: "app_server_proxy",
          sshPhase: context.phase,
        },
        sensitive: {
          sshAlias: this.options.sshConnection.alias,
          sshHost: this.options.sshConnection.host,
          sshPort: this.options.sshConnection.port,
          stderr: stderrTail,
        },
      });
      stream.destroy(new Error(`ssh app-server proxy exited with code ${code}, signal ${signal}: ${message}`));
    });
    queueMicrotask(() => {
      stream.emit("connect");
    });
    return stream;
  }

  /** 同一 ssh 连接的启动操作串行化（原 `runWithSshStartupGate`）。 */
  async runWithSshStartupGate<T>(run: () => Promise<T>): Promise<T> {
    const key = sshGateKey(this.options.sshConnection);
    const previous = sshStartupGates.get(key);
    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = (previous ?? Promise.resolve()).catch(() => void 0).then(() => current);
    sshStartupGates.set(key, chained);
    await previous?.catch(() => void 0);
    try {
      return await run();
    } finally {
      release();
      if (sshStartupGates.get(key) === chained) sshStartupGates.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// 工具（原 `NDe`/`PDe`/`FDe`/`UE`/`WE`/`KDe`/`qE`）
// ---------------------------------------------------------------------------

/** 等待 ws open（原 `NDe`）。 */
function waitForWebsocketOpen(socket: InstanceType<typeof WebSocket>): Promise<void> {
  if (socket.readyState === (WebSocket as unknown as { OPEN: number }).OPEN) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      if (timer != null) clearTimeout(timer);
      socket.off("open", onOpen);
      socket.off("error", onError);
      socket.off("close", onClose);
    };
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onClose = () => {
      cleanup();
      reject(new Error("SSH websocket closed before opening"));
    };
    socket.once("open", onOpen);
    socket.once("error", onError);
    socket.once("close", onClose);
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("SSH websocket open timed out"));
    }, SSH_TIMEOUTS.proxyWebSocketOpen);
    (timer as ReturnType<typeof setTimeout> & { unref(): void }).unref();
  });
}

/** ssh gate 的 key（原 `PDe`）。 */
function sshGateKey(connection: SshConnectionSpec): string {
  const alias = connection.alias?.trim();
  return alias
    ? `alias:${alias}`
    : ["direct", connection.host, String(connection.port ?? ""), connection.identity?.trim() ?? ""].join("\n");
}

/** shell env 结果的日志子集（原 `FDe`）。 */
function pickShellEnvTags(result: ShellEnvResult): ShellEnvResult {
  return {
    caller: result.caller,
    durationMs: result.durationMs,
    pathEntryCount: result.pathEntryCount,
    resultSource: result.resultSource,
    status: result.status,
    timeoutMs: result.timeoutMs,
  };
}

/** shell env 的 safe 标签形态（原 `UE`）。 */
function shellEnvSafeTags(result: ShellEnvResult) {
  return {
    shellEnvCaller: result.caller,
    shellEnvPathEntryCount: result.pathEntryCount,
    shellEnvResultSource: result.resultSource,
    shellEnvStatus: result.status,
  };
}

// ---------------------------------------------------------------------------
// proxycommand 解析族（原 `IDe`~`KDe`，67,027-67,174）
// ---------------------------------------------------------------------------

interface ProxyCommandDependency {
  commandName: string | null;
  needsShellEnv: boolean;
  pathEntryCount: number;
  proxyCommand: string | null;
  reason: string;
}

/** 判定 proxycommand 是否依赖 shell env（原 `IDe`）。 */
function analyzeProxyCommand(sshConfigOutput: string, path: string | null): ProxyCommandDependency {
  const proxyCommand = extractProxyCommand(sshConfigOutput);
  const entryCount = pathEntryCount(path);
  if (proxyCommand == null)
    return { commandName: null, needsShellEnv: false, pathEntryCount: entryCount, proxyCommand: null, reason: "no_proxy_command" };
  if (proxyCommand.toLowerCase() === "none")
    return { commandName: null, needsShellEnv: false, pathEntryCount: entryCount, proxyCommand, reason: "proxy_command_none" };
  const commandName = resolveProxyCommandName(proxyCommand);
  if (commandName == null)
    return { commandName: null, needsShellEnv: false, pathEntryCount: entryCount, proxyCommand, reason: "proxy_command_unparsed" };
  if (proxyCommandHasPath(commandName))
    return { commandName, needsShellEnv: false, pathEntryCount: entryCount, proxyCommand, reason: "proxy_command_has_path" };
  if (isResolvableInPath(commandName, path))
    return { commandName, needsShellEnv: false, pathEntryCount: entryCount, proxyCommand, reason: "proxy_command_resolved_in_path" };
  return { commandName, needsShellEnv: true, pathEntryCount: entryCount, proxyCommand, reason: "proxy_command_unresolved_in_path" };
}

/** 探测失败时的兜底（原 `GE`）。 */
function proxyCommandProbeFailed(): ProxyCommandDependency {
  return {
    commandName: null,
    needsShellEnv: false,
    pathEntryCount: pathEntryCount(process.env.PATH ?? null),
    proxyCommand: null,
    reason: "ssh_config_probe_failed",
  };
}

/** 从 ssh -G 输出提取 proxycommand（原 `LDe`）。 */
function extractProxyCommand(output: string): string | null {
  let found: string | null = null;
  for (const line of output.split(/\r?\n/u)) {
    const match = /^proxycommand\s+(?<command>.*)$/iu.exec(line.trim());
    if (match?.groups?.command != null) found = match.groups.command.trim();
  }
  return found;
}

/** proxycommand 的主命令名（原 `RDe`/`KE`：剥 env 前缀，sh -c 递归两层）。 */
function resolveProxyCommandName(command: string): string | null {
  return findCommandName(command, 0);
}

function findCommandName(command: string, depth: number): string | null {
  const words = tryShellSplit(command);
  if (words == null) return null;
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    if (!isEnvAssignment(word) && word !== "exec" && word !== "command" && word !== "env") {
      if (depth < 2 && isShellProgram(word)) {
        const inner = shellDashCArgument(words, i + 1);
        if (inner != null) return findCommandName(inner, depth + 1);
      }
      return word;
    }
  }
  return null;
}

/** sh/bash/zsh/dash/ksh（原 `zDe`）。 */
function isShellProgram(word: string): boolean {
  const normalized = word.replace(/\\/gu, "/").toLowerCase();
  const name = normalized.slice(normalized.lastIndexOf("/") + 1);
  return name === "sh" || name === "bash" || name === "zsh" || name === "dash" || name === "ksh";
}

/** 找 -c 的参数（原 `BDe`）。 */
function shellDashCArgument(words: string[], from: number): string | null {
  for (let i = from; i < words.length; i += 1) {
    const word = words[i];
    if (word === "-c" || /^-[^-]*c/u.test(word)) return words[i + 1] ?? null;
    if (!word.startsWith("-") || word === "--") return null;
  }
  return null;
}

/** shell 词法拆分（原 `VDe`）：含 shell 操作符的命令拒绝解析。 */
function tryShellSplit(command: string): string[] | null {
  if (hasShellOperators(command)) return null;
  try {
    return shellSplit(command);
  } catch {
    return null;
  }
}

/** 引号感知的 shell 操作符检测（原 `HDe`）。 */
function hasShellOperators(command: string): boolean {
  let quote: string | null = null;
  let escaped = false;
  for (let i = 0; i < command.length; i += 1) {
    const char = command[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote != null) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (/[;&|<>]/u.test(char)) return true;
  }
  return false;
}

/** VAR=value 形式（原 `UDe`）。 */
function isEnvAssignment(word: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*=/u.test(word);
}

/** 命令名自带路径（原 `WDe`）。 */
function proxyCommandHasPath(commandName: string): boolean {
  return commandName.includes("/") || commandName.includes("\\") || /^[A-Za-z]:/u.test(commandName);
}

/** 命令名在 PATH 中可解析（原 `GDe`）。 */
function isResolvableInPath(commandName: string, path: string | null): boolean {
  return path == null || path === ""
    ? false
    : executableResolver.resolve(commandName, { env: { PATH: path, PATHEXT: process.env.PATHEXT } }) != null;
}

/** stdout 里剥掉 sentinel 之前的部分（原 `KDe`）。 */
function stripSentinel(stdout: Buffer, sentinel: Buffer): string {
  const index = stdout.indexOf(sentinel);
  return index === -1 ? stdout.toString("utf8") : stdout.subarray(index + sentinel.length).toString("utf8");
}

/** 带超时的子进程等待（原 `qE`）。 */
async function withTimeout({
  process: child,
  timeoutMs,
  timeoutMessage,
}: {
  process: { wait(): Promise<{ code: number; stdout: string; stderr: string }>; kill(): void };
  timeoutMs: number;
  timeoutMessage: string;
}) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      child.wait(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          child.kill();
          reject(new Error(`${timeoutMessage} after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// WSL stdio transport（原 `QDe`，67,190-67,251）
// ---------------------------------------------------------------------------

const WSL_BASH = "/usr/bin/bash";
const WSL_PATH_EXPORT = 'PATH="${CODEX_INSTALL_DIR:-$HOME/.local/bin}:$PATH"; export PATH';
const WSL_NOT_FOUND_MESSAGE = `Codex CLI was not found in this WSL distribution. Install Codex in WSL, add it to your shell PATH, or set CODEX_INSTALL_DIR.`;

/** wsl.exe 的 codex 启动命令（原 `XDe`）。 */
function wslAppServerArgs(distro: string): string[] {
  return wslCommand(distro, ["-c", "features.code_mode_host=true", "app-server", "--analytics-default-enabled"]);
}

/** wsl.exe 的 --version 命令（原 `ZDe`）。 */
function wslVersionArgs(distro: string): string[] {
  return wslCommand(distro, ["--version"]);
}

function wslCommand(distro: string, cliArgs: string[]): string[] {
  const cli = shellQuote(codexCliName());
  const command = [
    `if ! command -v ${cli} >/dev/null 2>&1; then`,
    `printf '%s\\n' ${shellQuote(WSL_NOT_FOUND_MESSAGE)} >&2;`,
    `exit 127;`,
    `fi;`,
    `exec ${[cli, ...cliArgs].join(" ")}`,
  ].join(" ");
  const windowsPath = toWslPath(distro);
  return [
    "wsl.exe",
    "-d",
    distro,
    "--",
    WSL_BASH,
    "-lc",
    `${windowsPath == null ? WSL_PATH_EXPORT : `PATH="\${CODEX_INSTALL_DIR:-$HOME/.local/bin}":${shellQuote(windowsPath)}; export PATH`}; ${command}`,
  ];
}

interface WslTransportOptions {
  hostConfig: { distro: string };
}

/** WSL stdio transport（原 `QDe`）。 */
class AppServerTransportWslStdio {
  options: WslTransportOptions;
  kind = "stdio";
  stdioTransport: InstanceType<typeof StdioTransport>;
  installedCodexVersion: string | null | undefined;

  constructor(options: WslTransportOptions) {
    this.options = options;
    this.stdioTransport = new StdioTransport(options as never);
  }

  supportsReconnect(): boolean {
    return true;
  }

  async connect() {
    this.installedCodexVersion = undefined;
    const version = await this.getInstalledCodexVersion();
    if (version != null && !isSupportedAppServerVersion(version)) throw new Error(unsupportedVersionMessage + version);
    return this.stdioTransport.connect();
  }

  async getInstalledCodexVersion(): Promise<string | null> {
    if (this.installedCodexVersion !== undefined) return this.installedCodexVersion;
    const { code, stdout, stderr } = await spawnProcess({
      args: wslVersionArgs(this.options.hostConfig.distro),
      spawnInsideWsl: false,
    }).wait();
    return (this.installedCodexVersion = code === 0 ? parseVersionOutput(stdout || stderr) : null), this.installedCodexVersion;
  }

  getIoStatsSnapshot() {
    return this.stdioTransport.getIoStatsSnapshot();
  }
}

// ---------------------------------------------------------------------------
// transport 工厂（原 `HE`，66,985-66,998）
// ---------------------------------------------------------------------------

/** 从 hostConfig 构造 ssh transport（原 `HE`）；非 ssh 或 FORCE_CLI 时返回 null。 */
function createTransport(hostConfig: { kind: string } & Record<string, unknown>): {
  sshConnection: { alias?: string; host: string; port?: number; identity?: string };
} | null {
  if (process.env.CODEX_APP_SERVER_FORCE_CLI === "1" || hostConfig.kind !== "ssh") return null;
  const sshSpec = sshSpecOfHostConfig(hostConfig as never);
  return sshSpec
    ? {
        sshConnection: {
          alias: (sshSpec as { sshAlias?: string }).sshAlias,
          host: (sshSpec as { sshHost: string }).sshHost,
          port: (sshSpec as { sshPort?: number }).sshPort,
          identity: (sshSpec as { identity?: string }).identity,
        },
      }
    : null;
}

export {
  POSIX_INSTALL_SCRIPT_URL,
  WINDOWS_INSTALL_SCRIPT_URL,
  resolveInstallPlatform,
  buildRemoteInstallScript,
  codexCliName,
  loginShellProbeCommand,
  stripNpmEnv,
  loadShellEnv,
  loadShellEnvForStartup,
  SSH_TIMEOUTS,
  sshCommonArgs,
  sshTargetArgs,
  cleanSshOutput,
  AppServerTransportSshWebsocket,
  AppServerTransportWslStdio,
  createTransport,
  wslAppServerArgs,
  wslVersionArgs,
  waitForWebsocketOpen,
  withTimeout,
  analyzeProxyCommand,
  buildRemoteLoginShellCommand,
  type SshConnectionSpec,
  type ShellEnvResult,
};
