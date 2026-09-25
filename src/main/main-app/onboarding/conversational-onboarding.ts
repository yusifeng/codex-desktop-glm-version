// 会话式引导（conversational onboarding）服务。
//
// 对应 main-C-Mhak1n.ts 80,445-80,641：
//   - kN ConversationalOnboardingService：任务完成期望的登记/清除/回填
//     （per-conversation 期望 + 请求生命周期断言防陈旧回填 + principal 变更
//     防串号），thread/deleted 通知自动清除期望
//   - globalState 键：a.lt（completions 列表）+ 字面量
//     electron-conversational-onboarding-completions-v1（去重账本）
//   - 桌面小工具：createDesktopNote（wx 独占写 + 重名递增）、
//     createSampleChart、getSystemAppearance（defaults 读自动切换）、
//     requestComputerUsePermissions、requestDesktopRoot、requestLocalFilesAccess
//   - 路径工具（Rn/Bn 的 WSL 转换 + ON 的 getPath 探测 + aje 的权限检查）
import { execFile } from "node:child_process";
import { basename, join } from "node:path";
import { writeFile, access, constants as fsConstants, opendir } from "node:fs/promises";
import { promisify } from "node:util";
import { app, nativeTheme } from "electron";
import {
  wf as objectSchema,
  Of as stringSchema,
  df as enumSchema,
  $u as threadIdOf,
  Ri as isWsl,
  Vi as toWslPath,
  Ji as toWslPathAlt,
  Mi as wslDistroAlt,
} from "@chunk/shared";
import { createTaggedLogger, type Logger } from "@chunk/logger";
import { ut as conversationalOnboardingResultSchema, lt as CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY } from "@chunk/bootstrap";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// 路径工具（原 `Rn`/`Bn`/`ON`/`aje`）
// ---------------------------------------------------------------------------

/** WSL 路径转换（原 `Rn`：WSL 环境下转换，否则原样）。 */
function wslPathOrSelf(path: string): string {
  return isWsl() ? (toWslPath as (path: string) => string)(path) : path;
}

/** 备用 WSL 路径转换（原 `Bn`）。 */
function wslPathAltOrSelf(path: string): string {
  return isWsl() ? (toWslPathAlt as (path: string, distro: string) => string)(path, (wslDistroAlt as () => string)()) : path;
}

/** app.getPath + opendir 探测（原 `ON`：验证目录可打开）。 */
async function resolvedAppPath(name: string): Promise<string> {
  const path = app.getPath(name as never);
  await (await opendir(path)).close();
  return path;
}

/** desktop/documents/downloads 的访问权限检查（原 `aje`）。 */
async function checkLocalFilesAccess(name: string): Promise<string | null> {
  if (process.platform !== "darwin") return null;
  const directory = enumSchema(["desktop", "documents", "downloads"]).parse(name) as string;
  try {
    const path = await resolvedAppPath(directory);
    await resolvedAppPath(directory);
    await Promise.all([
      access(path, fsConstants.R_OK),
      access(path, fsConstants.W_OK),
      access(path, fsConstants.X_OK),
    ]);
    return "accessible";
  } catch (error) {
    return typeof error == "object" && error && "code" in error && ((error as { code?: string }).code === "EACCES" || (error as { code?: string }).code === "EPERM")
      ? "denied"
      : "unknown";
  }
}

// ---------------------------------------------------------------------------
// ConversationalOnboardingService（原 `kN`）
// ---------------------------------------------------------------------------

const threadDeletedParamsSchema = objectSchema({
  threadId: (stringSchema() as unknown as { min(n: number): { transform(fn: (value: string) => string): unknown } }).min(1).transform(threadIdOf),
});

interface CompletionExpectation {
  assignment: {
    accountId: string;
    userId: string;
    hostId: string;
    conversationId: string;
    selectedTask: unknown;
    isRevert: boolean;
    completion: unknown;
  } | null;
  assertCurrent: () => void;
}

interface StoredCompletion {
  accountId: string;
  userId: string;
  hostId: string;
  conversationId: string;
  selectedTask: unknown;
  isRevert: boolean;
  completion: unknown;
}

interface AppServerConnectionLike {
  registerInternalNotificationHandler(handler: (notification: { method: string; params: unknown }) => void): () => void;
  captureRequestLifetime(): () => void;
  getAuthenticatedPrincipal(): Promise<{ accountId: string; userId: string } | null>;
}

interface GlobalStateLike {
  get(key: unknown): unknown;
  update(key: unknown, fn: (value: unknown) => unknown): void;
}

/** 会话式引导服务（原 `kN`）。 */
class ConversationalOnboardingService {
  appServerConnection: AppServerConnectionLike;
  globalState: GlobalStateLike;
  requestComputerUseWorker: ((request: { method: string; params: unknown }) => Promise<unknown>) | null;
  onTaskCompletionChanged: (conversationId: string) => void;
  logger: Logger = createTaggedLogger("conversational-onboarding");
  #expectations = new Map<string, CompletionExpectation>();
  #unsubscribeNotifications: () => void;
  #disposed = false;

  constructor(
    appServerConnection: AppServerConnectionLike,
    globalState: GlobalStateLike,
    requestComputerUseWorker: ConversationalOnboardingService["requestComputerUseWorker"],
    onTaskCompletionChanged: ConversationalOnboardingService["onTaskCompletionChanged"],
  ) {
    this.appServerConnection = appServerConnection;
    this.globalState = globalState;
    this.requestComputerUseWorker = requestComputerUseWorker;
    this.onTaskCompletionChanged = onTaskCompletionChanged;
    this.#unsubscribeNotifications = appServerConnection.registerInternalNotificationHandler((notification) => {
      if (notification.method !== "thread/deleted") return;
      const parsed = (threadDeletedParamsSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { threadId: string } } }).safeParse(notification.params);
      if (parsed.success)
        void this.clearTaskCompletionExpectation({
          hostId: "local",
          conversationId: parsed.data!.threadId,
        });
    });
  }

  static dispose(service: ConversationalOnboardingService) {
    if (service.#disposed) return;
    service.#disposed = true;
    service.#expectations.clear();
    service.#unsubscribeNotifications();
  }

  /** 登记任务完成期望（原 `expectTaskCompletion`）。 */
  async expectTaskCompletion({
    hostId,
    conversationId,
    selectedTask,
    isRevert,
  }: {
    hostId: string;
    conversationId: string;
    selectedTask: unknown;
    isRevert: boolean;
  }): Promise<boolean> {
    if (hostId !== "local" || this.#disposed) return false;
    const expectation: CompletionExpectation = {
      assignment: null,
      assertCurrent: this.appServerConnection.captureRequestLifetime(),
    };
    this.#expectations.set(conversationId, expectation);
    const principal = await this.#currentPrincipal();
    if (principal == null || this.#expectations.get(conversationId) !== expectation || !this.#isCurrent(expectation))
      return (this.#expectations.get(conversationId) === expectation && this.#expectations.delete(conversationId), false);
    const record: StoredCompletion = {
      accountId: principal.accountId,
      userId: principal.userId,
      hostId,
      conversationId,
      selectedTask,
      isRevert,
      completion: null,
    };
    expectation.assignment = record;
    this.globalState.update(CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY, (existing) => [
      ...((existing as StoredCompletion[]) ?? []).filter(
        (entry) => entry.conversationId !== conversationId || entry.accountId !== principal.accountId || entry.userId !== principal.userId,
      ),
      record,
    ]);
    this.#notifyChange(conversationId);
    return true;
  }

  /** 清除期望（原 `clearTaskCompletionExpectation`）：仅清未完成且已入账本的。 */
  async clearTaskCompletionExpectation({ hostId, conversationId }: { hostId: string; conversationId: string }): Promise<void> {
    if (hostId !== "local" || this.#disposed) return;
    this.#expectations.delete(conversationId);
    const stored = this.globalState.get(CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY) as StoredCompletion[] | undefined;
    const principal = await this.#currentPrincipal();
    if (principal == null) return;
    const record = stored?.find(
      (entry) => entry.conversationId === conversationId && entry.accountId === principal.accountId && entry.userId === principal.userId,
    );
    if (
      record != null &&
      (this.globalState.get("electron-conversational-onboarding-completions-v1") as unknown[] | undefined)?.includes(record)
    ) {
      this.globalState.update(CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY, (existing) =>
        (existing as StoredCompletion[] | undefined)?.filter((entry) => entry !== record),
      );
      this.#notifyChange(conversationId);
    }
  }

  completeTask(request: { hostId: string; conversationId: string; argumentsValue: unknown }) {
    return this.#complete(request, null, null);
  }

  completeTaskFromHost = (
    request: { hostId: string; conversationId: string; argumentsValue: unknown },
    auth: { identity: { kind: string; accountId?: string; userId?: string } } | null,
    assertCurrent: () => void,
  ) => this.#complete(request, auth, assertCurrent);

  /** 回填完成（原 `#r`）：期望存在 + principal/身份一致 + 已入账本才生效。 */
  async #complete(
    { hostId, conversationId, argumentsValue }: { hostId: string; conversationId: string; argumentsValue: unknown },
    auth: { identity: { kind: string; accountId?: string; userId?: string } } | null,
    assertCurrent: (() => void) | null,
  ): Promise<{ completion: unknown; selectedTask: unknown; isRevert: boolean } | null> {
    assertCurrent?.();
    if (hostId !== "local" || this.#disposed) return null;
    const expectation = this.#expectations.get(conversationId);
    const assignment = expectation?.assignment;
    const parsed = (conversationalOnboardingResultSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: unknown } }).safeParse(argumentsValue);
    if (expectation == null || assignment == null || !parsed.success) return null;
    const principal = await this.#currentPrincipal();
    assertCurrent?.();
    return (
      principal == null ||
      principal.accountId !== assignment.accountId ||
      principal.userId !== assignment.userId ||
      (auth != null &&
        (auth.identity.kind !== "chatgpt" ||
          auth.identity.accountId !== principal.accountId ||
          auth.identity.userId !== principal.userId)) ||
      this.#expectations.get(conversationId) !== expectation ||
      !this.#isCurrent(expectation) ||
      !(this.globalState.get("electron-conversational-onboarding-completions-v1") as unknown[] | undefined)?.includes(assignment)
        ? null
        : (this.#expectations.delete(conversationId),
          this.globalState.update(CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY, (existing) =>
            (existing as StoredCompletion[] | undefined)?.map((entry) =>
              entry === assignment ? { ...entry, completion: parsed.data } : entry,
            ),
          ),
          this.#notifyChange(conversationId),
          { completion: parsed.data, selectedTask: assignment.selectedTask, isRevert: assignment.isRevert })
    );
  }

  /** 期望状态查询（原 `getTaskCompletionState`）。 */
  async getTaskCompletionState({ hostId, conversationId }: { hostId: string; conversationId: string }): Promise<{ status: string; completion?: unknown }> {
    if (hostId !== "local" || this.#disposed) return { status: "unavailable" };
    const principal = await this.#currentPrincipal();
    if (principal == null) return { status: "unavailable" };
    const record = (this.globalState.get(CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY) as StoredCompletion[] | undefined)?.find(
      (entry) => entry.conversationId === conversationId && entry.accountId === principal.accountId && entry.userId === principal.userId,
    );
    return record == null
      ? { status: "absent" }
      : record.completion == null
        ? { status: "pending" }
        : { status: "completed", completion: record.completion };
  }

  /** 创建桌面笔记（原 `createDesktopNote`）：wx 独占写 + 重名 (N) 递增。 */
  async createDesktopNote({ content, fileStem, parentPath }: { content: string; fileStem: string; parentPath: string }): Promise<{ path: string }> {
    const directory = wslPathAltOrSelf(parentPath);
    const stem = basename(fileStem);
    for (let attempt = 0; ; attempt += 1) {
      const target = join(directory, `${stem}${attempt === 0 ? "" : ` (${attempt})`}.txt`);
      try {
        await writeFile(target, content, { flag: "wx" });
        return { path: wslPathOrSelf(target) };
      } catch (error) {
        if (typeof error != "object" || !error || !("code" in error) || (error as { code?: string }).code !== "EEXIST") throw error;
      }
    }
  }

  /** 创建示例图表（原 `createSampleChart`）。 */
  async createSampleChart({ bytes, fileStem, format = "png", parentPath }: { bytes: Buffer; fileStem: string; format?: string; parentPath: string }): Promise<{ path: string }> {
    const extension = format === "html" ? "html" : "png";
    const target = join(wslPathAltOrSelf(parentPath), `${basename(fileStem)}.${extension}`);
    await writeFile(target, bytes);
    return { path: wslPathOrSelf(target) };
  }

  /** 系统外观（原 `getSystemAppearance`）：darwin 读自动切换 + 当前深浅。 */
  async getSystemAppearance(): Promise<"auto" | "dark" | "light" | null> {
    return process.platform === "darwin"
      ? (
          await execFileAsync("/usr/bin/defaults", [
            "read",
            "-g",
            "AppleInterfaceStyleSwitchesAutomatically",
          ]).then(
            ({ stdout }) => stdout.trim() === "1",
            () => false,
          )
        )
        ? "auto"
        : nativeTheme.shouldUseDarkColors
          ? "dark"
          : "light"
      : null;
  }

  /** 请求 Computer Use 权限（原 `requestComputerUsePermissions`）。 */
  async requestComputerUsePermissions(): Promise<void> {
    if (process.platform === "darwin") {
      if (this.requestComputerUseWorker == null)
        throw new Error("Computer Use permission setup is unavailable");
      await this.requestComputerUseWorker({
        method: "requestPermissions",
        params: { app: "com.apple.systempreferences" },
      });
    }
  }

  /** 桌面根目录（原 `requestDesktopRoot`）。 */
  async requestDesktopRoot(): Promise<string> {
    return wslPathOrSelf(await resolvedAppPath("desktop"));
  }

  /** 目录访问权限检查（原 `requestLocalFilesAccess`）。 */
  requestLocalFilesAccess(directory: string) {
    return checkLocalFilesAccess(directory);
  }

  #notifyChange(conversationId: string) {
    try {
      this.onTaskCompletionChanged(conversationId);
    } catch (error) {
      this.logger.warning("Failed to publish onboarding completion change", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  async #currentPrincipal() {
    const assertCurrent = this.appServerConnection.captureRequestLifetime();
    try {
      const principal = await this.appServerConnection.getAuthenticatedPrincipal();
      assertCurrent();
      return this.#disposed ? null : principal;
    } catch {
      return null;
    }
  }

  #isCurrent(expectation: CompletionExpectation): boolean {
    try {
      expectation.assertCurrent();
      return !this.#disposed;
    } catch {
      return false;
    }
  }
}

export {
  ConversationalOnboardingService,
  checkLocalFilesAccess,
  resolvedAppPath,
  wslPathOrSelf,
  wslPathAltOrSelf,
};
