// 日志导出 + 调试服务 + demo 工具。
//
// 对应 main-C-Mhak1n.ts 80,874-81,189：
//   - export-logs（80,874-80,998）：scope（today/last7days/session）→ 日期桶
//     枚举 → saveDialog → 按时间戳归并写出。深析建议合并碎函数为
//     collectLogFiles + mergeAndWrite 两个纯管道。
//   - zje DebugService（80,998-81068）：per-origin RPC 门面；memory 诊断
//     方法全抛错（该 flavor 不含内存诊断，保留同样形 stub）。
//   - demo-tools（81069-81189）：Bje ChatGPTAppDemoBackend（安装状态探测
//     prod-internal 轨道 + /usr/bin/open 独立 CODEX_HOME 启动）、Hje DemoTools、
//     Uje per-origin 服务、Wje 工厂（仅打包非 Dev darwin）。
import { execFile } from "node:child_process";
import { readFile, writeFile, readdir, access, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { promisify } from "node:util";
import { app, BrowserWindow, dialog } from "electron";
import { cu as BUILD_FLAVOR_VALUES, Uf as EventEmitterBase, Bi as sanitizedProcessEnv } from "@chunk/shared";
import { createTaggedLogger, memoizedTaggedLogger } from "@chunk/logger";
import { Xt as desktopLogRootDir, on as appSessionId, an as readPackageMetadataField } from "@chunk/bootstrap";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// export-logs（原 `HN`~`Rje`）
// ---------------------------------------------------------------------------

type ExportScope = "today" | "last7days" | "session";

const exportLogsLogger = memoizedTaggedLogger("export-logs");

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/** logRoot/yyyy/mm/dd 桶路径（原 `Dje`）。 */
function logDayBucket(rootDir: string, day: Date): string {
  return join(rootDir, day.getUTCFullYear().toString(), pad2(day.getUTCMonth() + 1), pad2(day.getUTCDate()));
}

/** UTC 当天零点（原 `Oje`）。 */
function utcMidnight(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** scope → 日期列表（原 `Aje`）。 */
function scopeDays(now: Date, scope: ExportScope): Date[] {
  const today = utcMidnight(now);
  switch (scope) {
    case "today":
      return [today];
    case "last7days":
    case "session":
      return Array.from({ length: 7 }, (_day, daysAgo) => {
        const day = new Date(today);
        day.setUTCDate(day.getUTCDate() - daysAgo);
        return day;
      });
  }
}

/** 文件名是否在 scope 内（原 `jje`）：session 按当前 sessionId 前缀。 */
function fileNameInScope(scope: ExportScope, sessionId: string, fileName: string): boolean {
  switch (scope) {
    case "today":
    case "last7days":
      return true;
    case "session":
      return fileName.startsWith(`codex-desktop-${sessionId}-`);
  }
}

/** 收集日志文件（原 `Mje`）：日期桶 → 过滤 → 排序。 */
async function collectLogFiles({
  rootDir,
  now,
  scope,
  appSessionId: sessionId,
}: {
  rootDir: string;
  now: Date;
  scope: ExportScope;
  appSessionId: string;
}): Promise<string[]> {
  const days = scopeDays(now, scope);
  return (
    await Promise.all(
      days.map(async (day) => {
        const bucket = logDayBucket(rootDir, day);
        try {
          return (await readdir(bucket, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && fileNameInScope(scope, sessionId, entry.name))
            .map((entry) => join(bucket, entry.name));
        } catch (error) {
          exportLogsLogger().error("Failed to read log dir", { safe: {}, sensitive: { dir: bucket, error } });
          return [];
        }
      }),
    )
  )
    .flat()
    .sort();
}

/** 建议文件名（原 `Nje`）。 */
function suggestedFileName(scope: ExportScope, sessionId: string): string {
  switch (scope) {
    case "today":
      return "codex-logs-today.txt";
    case "last7days":
      return "codex-logs-last7days.txt";
    case "session":
      return `codex-logs-session-${sessionId.slice(0, 8)}.txt`;
  }
}

/** saveDialog（原 `Pje`）：取消返回 null，非 .txt 后缀自动补。 */
async function pickSavePath({ parentWindow, suggestedName }: { parentWindow?: BrowserWindow | null; suggestedName: string }): Promise<string | null> {
  const options = { defaultPath: suggestedName, filters: [{ name: "Text", extensions: ["txt"] }] };
  const result = parentWindow
    ? await dialog.showSaveDialog(parentWindow, options)
    : await dialog.showSaveDialog(options);
  if (result.canceled || !result.filePath) return null;
  return extname(result.filePath).toLowerCase() === ".txt" ? result.filePath : `${result.filePath}.txt`;
}

/** 行首时间戳（原 `Ije`）。 */
function lineTimestampMs(line: string): number | null {
  const spaceIndex = line.indexOf(" ");
  if (spaceIndex <= 0) return null;
  const parsed = Date.parse(line.slice(0, spaceIndex));
  return Number.isFinite(parsed) ? parsed : null;
}

/** 多文件按时间戳归并（原 `Lje`）：无时间戳的行排最后，保持文件内顺序。 */
async function mergeAndWrite(paths: string[]): Promise<string> {
  const contents = await Promise.all(paths.sort().map((path) =>
    readFile(path, "utf8").catch((error) => (
      exportLogsLogger().error("Failed to read log file", { safe: {}, sensitive: { error } }),
      ""
    )),
  ));
  const lines: Array<{ order: number; timestampMs: number | null; text: string }> = [];
  let order = 0;
  for (const content of contents)
    for (const line of content.split(/\r?\n/))
      if (line.length !== 0) {
        lines.push({ order, timestampMs: lineTimestampMs(line), text: line });
        order += 1;
      }
  lines.sort((a, b) => {
    const aTs = a.timestampMs;
    const bTs = b.timestampMs;
    return aTs != null && bTs != null
      ? aTs - bTs || a.order - b.order
      : aTs == null
        ? bTs == null
          ? a.order - b.order
          : 1
        : -1;
  });
  return lines.length > 0 ? `${lines.map((line) => line.text).join("\n")}\n` : "";
}

/** 导出入口（原 `Rje`）。 */
async function exportLogs({
  scope,
  parentWindow,
  appSessionId: sessionId,
}: {
  scope: ExportScope;
  parentWindow?: BrowserWindow | null;
  appSessionId: string;
}): Promise<void> {
  const now = new Date();
  const files = await collectLogFiles({ rootDir: (desktopLogRootDir as () => string)(), now, scope, appSessionId: sessionId });
  const savePath = await pickSavePath({ parentWindow, suggestedName: suggestedFileName(scope, sessionId) });
  if (!savePath) return;
  const merged = await mergeAndWrite(files);
  await writeFile(savePath, merged, "utf8");
}

// ---------------------------------------------------------------------------
// DebugService（原 `zje`）
// ---------------------------------------------------------------------------

/** per-origin 的调试 RPC 门面（原 `zje`）：memory 诊断全 stub 抛错。 */
class DebugService extends (EventEmitterBase as new () => {}) {
  debugWindowManager: {
    show(origin: Electron.WebContents): Promise<void>;
    chatGptConversations: {
      registerSource(originId: number, source: unknown): unknown;
      runAction(originId: number, action: unknown): boolean | undefined;
      subscribe(ownerId: number, originId: number, listener: unknown): unknown;
    };
    getOwnerWebContentsId(originId: number): number | null;
  } | null;
  browserHostManager: { getDebugSnapshot(): Promise<unknown>; openDebugTabOwner(target: unknown): Promise<unknown> };
  origin: Electron.WebContents;
  windowManager: unknown;

  constructor(
    debugWindowManager: DebugService["debugWindowManager"],
    browserHostManager: DebugService["browserHostManager"],
    origin: Electron.WebContents,
    windowManager: unknown,
  ) {
    super();
    this.debugWindowManager = debugWindowManager;
    this.browserHostManager = browserHostManager;
    this.origin = origin;
    this.windowManager = windowManager;
  }

  async captureMemoryAllocationProfiles() {
    throw new Error("Memory diagnostics are unavailable");
  }

  async executeCaptureHeapSnapshotsTool(_request: unknown) {
    throw new Error("Memory diagnostics are unavailable");
  }

  async captureMemoryHeapSnapshots() {
    throw new Error("Memory diagnostics are unavailable");
  }

  async exportLogs({ scope }: { scope: ExportScope }) {
    await exportLogs({
      appSessionId: appSessionId as string,
      parentWindow: BrowserWindow.fromWebContents(this.origin),
      scope,
    });
  }

  async getBrowserSnapshot() {
    return this.browserHostManager.getDebugSnapshot();
  }

  async getMemoryDiagnosticsStatus() {
    throw new Error("Memory diagnostics are unavailable");
  }

  async openBrowserTabOwner(target: unknown) {
    return this.browserHostManager.openDebugTabOwner(target);
  }

  async openWindow() {
    await this.debugWindowManager?.show(this.origin);
  }

  registerChatGptConversationSource(source: unknown) {
    return this.debugWindowManager?.chatGptConversations.registerSource(this.origin.id, source) ?? null;
  }

  async revealMemoryDiagnosticsDirectory() {
    throw new Error("Memory diagnostics are unavailable");
  }

  async resetUpdateSsoState() {}

  async runChatGptConversationAction(action: unknown) {
    return (
      this.debugWindowManager?.chatGptConversations.runAction(
        this.debugWindowManager.getOwnerWebContentsId(this.origin.id) ?? this.origin.id,
        action,
      ) ?? false
    );
  }

  async setMemoryDiagnosticsConfig(_config: unknown) {
    throw new Error("Memory diagnostics are unavailable");
  }

  subscribeChatGptConversation(listener: unknown) {
    return (
      this.debugWindowManager?.chatGptConversations.subscribe(
        this.debugWindowManager.getOwnerWebContentsId(this.origin.id) ?? this.origin.id,
        this.origin.id,
        listener,
      ) ?? null
    );
  }
}

// ---------------------------------------------------------------------------
// demo tools（原 `Bje`/`Hje`/`Uje`/`Wje`）
// ---------------------------------------------------------------------------

const CHATGPT_APP_PATH = "/Applications/ChatGPT.app";
const DEMO_MESSAGES = {
  unavailable: "Install the internal production track in your Applications folder before opening a demo.",
  "launch-failed": "The demo build could not be opened. Please try again.",
} as const;

/** demo DMG 下载地址（原 `Vje`）。 */
function demoDmgUrl(arch: string): string {
  return `https://oaisidekickupdates.blob.core.windows.net/codex-desktop/prod-internal/${arch === "x64" ? "ChatGPT-latest-x64.dmg" : "ChatGPT.dmg"}`;
}

/** demo 后端（原 `Bje`）：安装状态探测 + 独立 CODEX_HOME 启动。 */
class ChatGPTAppDemoBackend {
  pendingLaunch: Promise<{ status: string; code?: string; message?: string }> | null = null;

  async getSetup() {
    return { downloadUrl: demoDmgUrl(process.arch), installStatus: await this.#installStatus() };
  }

  openDemoBuild() {
    this.pendingLaunch ??= this.#launch().finally(() => {
      this.pendingLaunch = null;
    });
    return this.pendingLaunch;
  }

  /** 安装轨道探测（原 `#e`）：prod + prod-internal 才算 installed。 */
  async #installStatus(): Promise<string> {
    try {
      await access(CHATGPT_APP_PATH);
      const candidates = [join(CHATGPT_APP_PATH, "Contents", "Resources", "app.asar", "package.json")];
      return (readPackageMetadataField as (field: string, opts?: { candidates?: string[] }) => string | null)("codexBuildFlavor", { candidates }) ===
        (BUILD_FLAVOR_VALUES as { Prod: string }).Prod
        ? (readPackageMetadataField as (field: string, opts?: { candidates?: string[] }) => string | null)("codexReleaseChannel", { candidates }) ===
          "prod-internal"
          ? "installed"
          : "regular-production"
        : "wrong-track";
    } catch {
      return "not-installed";
    }
  }

  /** 启动（原 `#t`）：独立 CODEX_HOME + user-data-dir。 */
  async #launch(): Promise<{ status: string; code?: string; message?: string }> {
    if ((await this.#installStatus()) !== "installed")
      return { status: "error", code: "unavailable", message: DEMO_MESSAGES.unavailable };
    const demoCodexHome = join(app.getPath("home"), ".codex-demo");
    const demoUserData = join(app.getPath("appData"), "Codex Demo", "user-data");
    try {
      await Promise.all([
        mkdir(demoCodexHome, { recursive: true, mode: 0o700 }),
        mkdir(demoUserData, { recursive: true, mode: 0o700 }),
      ]);
      await execFileAsync(
        "/usr/bin/open",
        [
          "-n",
          "--env",
          `CODEX_HOME=${demoCodexHome}`,
          "--env",
          `CODEX_ELECTRON_USER_DATA_PATH=${demoUserData}`,
          CHATGPT_APP_PATH,
          "--args",
          `--user-data-dir=${demoUserData}`,
        ],
        { env: sanitizedProcessEnv(process.env), timeout: 6e4 },
      );
      return { status: "launched" };
    } catch {
      return { status: "error", code: "launch-failed", message: DEMO_MESSAGES["launch-failed"] };
    }
  }
}

/** demo 工具管理器（原 `Hje`）。 */
class DemoTools {
  backend: ChatGPTAppDemoBackend;
  logger = createTaggedLogger("demo-tools");
  disposed = false;

  constructor(backend: ChatGPTAppDemoBackend) {
    this.backend = backend;
  }

  createService(origin: Electron.WebContents) {
    if (this.disposed) throw new Error("Demo Tools has been disposed");
    return new DemoToolsService(this, origin);
  }

  async getSetup(signal: AbortSignal) {
    return this.#available(signal) ? this.backend.getSetup() : null;
  }

  async openDemoBuild(signal: AbortSignal) {
    if (!this.#available(signal))
      return { status: "error", code: "unavailable", message: "Demo build is unavailable" };
    try {
      return await this.backend.openDemoBuild();
    } catch (error) {
      this.logger.warning("Failed to open demo build", { safe: {}, sensitive: { error } });
      return { status: "error", code: "launch-failed", message: "Unable to open demo build" };
    }
  }

  dispose() {
    this.disposed = true;
  }

  #available(signal: AbortSignal) {
    return !this.disposed && !signal.aborted;
  }
}

/** per-origin 的 demo 服务（原 `Uje`）。 */
class DemoToolsService extends (EventEmitterBase as new () => {}) {
  demoTools: DemoTools;
  origin: Electron.WebContents;
  lifetime = new AbortController();
  handleDestroyed = () => this[Symbol.dispose]();

  constructor(demoTools: DemoTools, origin: Electron.WebContents) {
    super();
    this.demoTools = demoTools;
    this.origin = origin;
    origin.once("destroyed", this.handleDestroyed);
  }

  getSetup() {
    return this.demoTools.getSetup(this.lifetime.signal);
  }

  openDemoBuild() {
    return this.demoTools.openDemoBuild(this.lifetime.signal);
  }

  [Symbol.dispose]() {
    if (this.lifetime.signal.aborted) return;
    this.lifetime.abort();
    this.origin.removeListener("destroyed", this.handleDestroyed);
  }
}

/** 工厂（原 `Wje`）：仅打包非 Dev 的 darwin。 */
function createDemoTools({
  buildFlavor,
  isPackaged,
  platform = process.platform,
}: {
  buildFlavor: string;
  isPackaged: boolean;
  platform?: string;
}): DemoTools | undefined {
  if (isPackaged && buildFlavor !== (BUILD_FLAVOR_VALUES as { Dev: string }).Dev && platform === "darwin")
    return new DemoTools(new ChatGPTAppDemoBackend());
  return undefined;
}

export {
  exportLogs,
  collectLogFiles,
  mergeAndWrite,
  DebugService,
  DemoTools,
  DemoToolsService,
  ChatGPTAppDemoBackend,
  createDemoTools,
  demoDmgUrl,
  type ExportScope,
};
