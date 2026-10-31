// shared chunk：临时线程结构化生成（structured-generation 分区）。
//
// 对应 src-DldfpmrL.ts 的 L17,135-17,310（semver + 门控）、
// L25,836-26,100（token 用量遥测 + TN 转次监听）、L59,314-59,700 区段：
//   - Iv/zv/Rv：semver 比较族（Fv 正则：major.minor.patch + 预发布）
//   - ny：app-server 版本门控（ty 表的 providerModelFallback 门）
//   - wN + SN/CN：token 用量遥测（logger + 可选订阅者）
//   - TN：awaitStructuredTurn——临时线程上的转次监听
//     （turn/started、item/agentMessage/delta、item/completed、
//     turn/completed、thread/tokenUsage/updated、error；超时/中止 →
//     interruptTurn + AbortError；DN 状态错误格式化）
//   - L8：generateOnEphemeralThread——优先 forkThread（excludeTurns +
//     ephemeral），失败可回退 startThread（read-only + never 审批 +
//     codex_app MCP 禁用）
//   - R8（ut）：runStructuredGeneration——prompt 截断 + 配置
//     （fanout/multi_agent/web_search 关闭）+ 遥测三态
//     （empty/success/error/canceled）+ extractParsedResult
//   - kie/Nie：可 dispose 的生成包装（SettledAbortable/Abortable）
//   - Aie（rt）：PullRequestMessageGenerator（X8 捆绑：Die 提示词 +
//     J8 schema + 45s）；Mie（nt）：TextGenerator（Z8 {text} schema +
//     preserveOutputWhitespace + 本地 host 旁路）
//   - K8/q8/J8/Y8 schema + Eie/Die/Oie 提示词 + wie/X8/Tie 捆绑
//
// 兼容导出：ut=R8、nt=Mie、rt=Aie。

import { z } from "zod";

import { RpcTarget } from "./rpc-core";
import { appServerSupportsFeature, compareSemver, parseSemver } from "./app-server-version";
import { memoizedTaggedLogger } from "@chunk/logger";

// semver 与 app-server 特性门控（原 `Fv`/`zv`/`Rv`/`Iv`/`ny`+`ty`）的
// 实现在 app-server-version.ts——本模块转发导出以保持既有消费面。
export { appServerSupportsFeature, compareSemver, parseSemver };

// ---------------------------------------------------------------------------
// token 用量遥测（原 `wN`/`SN`/`CN`/`xN`）
// ---------------------------------------------------------------------------

const generationLog = memoizedTaggedLogger("ephemeral-generation");

/** token 用量事件。 */
export interface TokenUsageSnapshot {
  total: { inputTokens: number; cachedInputTokens: number; outputTokens: number; reasoningOutputTokens: number; totalTokens: number };
  last: { inputTokens: number; cachedInputTokens: number; outputTokens: number; reasoningOutputTokens: number; totalTokens: number };
}

/** 遥测事件形态。 */
export interface TokenUsageTelemetryEvent {
  feature: string;
  model: string | null;
  reasoningEffort: string;
  serviceTier: string | null;
  status: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
}

let tokenUsageSubscriber: ((event: TokenUsageTelemetryEvent) => void) | null = null;

/** 安装 token 用量订阅者（原 `CN`，返回卸载函数）。 */
export function installTokenUsageSubscriber(subscriber: (event: TokenUsageTelemetryEvent) => void): () => void {
  tokenUsageSubscriber = subscriber;
  return () => {
    if (tokenUsageSubscriber === subscriber) tokenUsageSubscriber = null;
  };
}

/** 发送 token 用量（原 `wN`：增量 = 本次的 total/last 差）。 */
function emitTokenUsage({
  feature,
  firstTokenUsage,
  model,
  reasoningEffort,
  serviceTier,
  status,
  tokenUsage,
}: {
  feature: string;
  firstTokenUsage?: TokenUsageSnapshot | null;
  model: string | null;
  reasoningEffort: string;
  serviceTier: string | null;
  status: string;
  tokenUsage: TokenUsageSnapshot | null;
}): void {
  if (tokenUsage == null) return;
  const delta = (key: keyof TokenUsageSnapshot["total"]) =>
    tokenUsage.total[key] - (firstTokenUsage == null ? 0 : firstTokenUsage.total[key] - firstTokenUsage.last[key]);
  const event: TokenUsageTelemetryEvent = {
    feature,
    model,
    reasoningEffort,
    serviceTier,
    status,
    inputTokens: delta("inputTokens"),
    cachedInputTokens: delta("cachedInputTokens"),
    outputTokens: delta("outputTokens"),
    reasoningOutputTokens: delta("reasoningOutputTokens"),
    totalTokens: delta("totalTokens"),
  };
  generationLog().info("ephemeral_generation_token_usage", { safe: { event: "ephemeral_generation_token_usage", ...event } });
  tokenUsageSubscriber?.(event);
}

// ---------------------------------------------------------------------------
// app-server 客户端面（L8/R8/Aie/Mie 依赖的最小接口）
// ---------------------------------------------------------------------------

/** 临时生成客户端面。 */
export interface GenerationClient {
  forkThread?(request: Record<string, unknown>): Promise<{ thread: { id: string } }>;
  startThread(request: Record<string, unknown>): Promise<{ thread: { id: string } }>;
  unsubscribeThread(threadId: string): Promise<void>;
  interruptTurn?(request: { threadId: string; turnId: string }): Promise<void>;
  registerInternalNotificationHandler(handler: (notification: { method: string; params: any }) => void): () => void;
  sendUserTurn(request: Record<string, unknown>): Promise<unknown>;
}

/** 转次状态错误格式化（原 `DN`）。 */
function structuredTurnError(status: string, error?: { message?: string; additionalDetails?: string } | null): string {
  const details = [error?.message, error?.additionalDetails].filter((part) => part != null && part.length > 0).join(" ");
  if (status === "failed") return details.length > 0 ? `Structured turn failed: ${details}` : "Structured turn failed.";
  if (status === "interrupted")
    return details.length > 0 ? `Structured turn was interrupted: ${details}` : "Structured turn was interrupted.";
  return details.length > 0 ? `Structured turn ended with status ${status}: ${details}` : `Structured turn ended with status ${status}.`;
}

/**
 * 临时线程转次监听（原 `TN`）：发送 prompt 并等待结构化完成。
 * 超时/中止时 interruptTurn；agentMessage 增量与 item/completed 双路收集。
 */
async function awaitStructuredTurn({
  responseSchema,
  prompt,
  threadId,
  turnTrigger,
  serviceTier,
  schema,
  timeoutMs,
  client,
  onTokenUsage,
  signal,
}: {
  responseSchema?: z.ZodTypeAny;
  prompt: string;
  threadId: string;
  turnTrigger?: unknown;
  serviceTier?: string | null;
  schema?: unknown;
  timeoutMs: number;
  client: GenerationClient;
  onTokenUsage?: (usage: TokenUsageSnapshot) => void;
  signal?: AbortSignal;
}): Promise<unknown> {
  let turnId: string | null = null;
  let text: string | null = null;
  let turnError: { message?: string; additionalDetails?: string } | null = null;
  let rejected = false;
  let completed = false;
  let releaseTimeout: () => void = () => {};
  const interrupted = () => {
    if (completed || turnId == null || client.interruptTurn == null)
      void client.interruptTurn?.({ threadId, turnId: turnId! }).catch(() => void 0);
  };
  const result = new Promise<unknown>((resolve, reject) => {
    const abort = () => {
      rejected = true;
      releaseTimeout();
      if (turnId != null) client.interruptTurn?.({ threadId, turnId }).catch(() => void 0);
      reject(new DOMException("The operation was aborted", "AbortError"));
    };
    const timeout = setTimeout(() => {
      rejected = true;
      releaseTimeout();
      if (turnId != null) client.interruptTurn?.({ threadId, turnId }).catch(() => void 0);
      reject(new Error("Timed out waiting for structured result."));
    }, timeoutMs);
    releaseTimeout = () => clearTimeout(timeout);
    signal?.addEventListener("abort", abort, { once: true });
    const unsubscribe = client.registerInternalNotificationHandler((notification) => {
      switch (notification.method) {
        case "error": {
          const params = notification.params;
          if (params.threadId !== threadId || (turnId != null && params.turnId !== turnId)) return;
          turnId ??= params.turnId;
          turnError = params.error;
          return;
        }
        case "turn/started": {
          const params = notification.params;
          if (params.threadId !== threadId) return;
          turnId = params.turn.id;
          return;
        }
        case "thread/tokenUsage/updated": {
          const params = notification.params;
          if (params.threadId !== threadId || (turnId != null && params.turnId !== turnId)) return;
          onTokenUsage?.(params.tokenUsage);
          return;
        }
        case "item/agentMessage/delta": {
          const params = notification.params;
          if (params.threadId !== threadId) return;
          if (params.turnId == null) {
            if (turnId != null) return;
          } else if (turnId != null && params.turnId !== turnId) return;
          text = `${text ?? ""}${params.delta}`;
          return;
        }
        case "item/completed": {
          const params = notification.params;
          if (params.threadId !== threadId) return;
          if (params.turnId == null) {
            if (turnId != null) return;
          } else if (turnId != null && params.turnId !== turnId) return;
          if (params.item.type === "agentMessage") text = params.item.text;
          return;
        }
        case "turn/completed": {
          const params = notification.params;
          if (params.threadId !== threadId || (turnId != null && params.turn.id !== turnId)) return;
          turnId = params.turn.id;
          if (params.turn.status !== "completed") {
            releaseTimeout();
            reject(new Error(structuredTurnError(params.turn.status, params.turn.error ?? turnError)));
            return;
          }
          releaseTimeout();
          completed = true;
          unsubscribe();
          const message = text ?? "";
          if (responseSchema == null) {
            resolve(message);
            return;
          }
          const parsed = responseSchema.safeParse(JSON.parse(message));
          if (!parsed.success) {
            reject(new Error(`Structured turn returned invalid JSON: ${parsed.error.message}`));
            return;
          }
          resolve(parsed.data);
          return;
        }
      }
    });
  });
  void interrupted;
  try {
    await client.sendUserTurn({
      threadId,
      prompt,
      turnTrigger: turnTrigger ?? null,
      ...(serviceTier != null ? { serviceTier } : {}),
    });
  } catch (error) {
    if (!rejected) throw error;
  }
  return result;
}

// ---------------------------------------------------------------------------
// 临时线程生成（原 `L8`）
// ---------------------------------------------------------------------------

export const EPHEMERAL_THREAD_TIMEOUT_MS = 30_000;

/**
 * 临时线程生成（原 `L8`）：优先 forkThread（ephemeral + excludeTurns），
 * 失败按 fallbackToFreshThread 回退 startThread（read-only + never 审批）。
 */
async function generateOnEphemeralThread({
  prompt,
  cwd,
  model,
  effort,
  serviceTier,
  serviceName,
  baseInstructions,
  schema,
  config,
  sourceThreadId,
  fallbackToFreshThread = true,
  threadSource = null,
  timeoutMs = EPHEMERAL_THREAD_TIMEOUT_MS,
  client,
  responseSchema,
  onTokenUsage,
  signal,
  allowProviderModelFallback = true,
}: {
  prompt: string;
  cwd: string | null;
  model: string | null;
  effort?: string;
  serviceTier?: string | null;
  serviceName?: string;
  baseInstructions?: string;
  schema?: unknown;
  config?: Record<string, unknown>;
  sourceThreadId?: string | null;
  fallbackToFreshThread?: boolean;
  threadSource?: unknown;
  timeoutMs?: number;
  client: GenerationClient;
  responseSchema?: z.ZodTypeAny;
  onTokenUsage?: (usage: TokenUsageSnapshot) => void;
  signal?: AbortSignal;
  allowProviderModelFallback?: boolean;
}): Promise<unknown> {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) return null;
  if (signal?.aborted) throw new DOMException("The operation was aborted", "AbortError");
  const mergedConfig = {
    ...config,
    "mcp_servers.codex_app": { enabled: false, command: "" },
    model_reasoning_effort: effort,
  };
  let threadId: string | null = null;
  if (sourceThreadId != null && client.forkThread) {
    try {
      threadId = (
        await client.forkThread({
          threadId: sourceThreadId,
          path: null,
          model,
          modelProvider: null,
          serviceTier: serviceTier ?? null,
          cwd,
          approvalPolicy: "never",
          permissions: ":read-only",
          runtimeWorkspaceRoots: [],
          config: mergedConfig,
          baseInstructions,
          ephemeral: true,
          excludeTurns: true,
          threadSource,
        })
      ).thread.id;
    } catch {
      if (signal?.aborted) throw new DOMException("The operation was aborted", "AbortError");
      if (!fallbackToFreshThread) return null;
    }
  }
  const effectiveThreadId =
    threadId ??
    (
      await client.startThread({
        model,
        modelProvider: null,
        ...(allowProviderModelFallback ? { allowProviderModelFallback: true } : {}),
        cwd,
        approvalPolicy: "never",
        permissions: ":read-only",
        runtimeWorkspaceRoots: [],
        config: mergedConfig,
        baseInstructions,
        personality: null,
        ephemeral: true,
        threadSource,
        experimentalRawEvents: false,
        dynamicTools: null,
        serviceTier: serviceTier ?? null,
        ...(serviceName === undefined ? {} : { serviceName }),
      })
    ).thread.id;
  try {
    if (signal?.aborted) throw new DOMException("The operation was aborted", "AbortError");
    return await awaitStructuredTurn({
      turnTrigger: threadSource,
      responseSchema,
      prompt: trimmed,
      threadId: effectiveThreadId,
      serviceTier,
      schema,
      timeoutMs,
      client,
      onTokenUsage,
      signal,
    });
  } finally {
    void client.unsubscribeThread(effectiveThreadId).catch(() => void 0);
  }
}

// ---------------------------------------------------------------------------
// 结构化生成（原 `R8`，导出 `ut`）
// ---------------------------------------------------------------------------

/**
 * 结构化生成（原 `R8`）：prompt 截断 + 低推理档 + 禁 fanout/多 agent/
 * web_search + token 用量遥测三态 + extractParsedResult。
 */
export async function runStructuredGeneration({
  prompt,
  cwd,
  model,
  serviceTier,
  client,
  timeoutMs,
  promptCharLimit,
  buildGenerationPrompt,
  baseInstructions,
  outputSchema,
  responseSchema,
  extractParsedResult,
  tokenUsageTelemetryFeature,
  threadSource = tokenUsageTelemetryFeature,
  signal,
  allowProviderModelFallback,
}: {
  prompt: string;
  cwd: string | null;
  model: string | null;
  serviceTier?: string | null;
  client: GenerationClient;
  timeoutMs: number;
  promptCharLimit: number;
  buildGenerationPrompt: (truncatedPrompt: string) => string;
  baseInstructions?: string;
  outputSchema?: unknown;
  responseSchema: z.ZodTypeAny;
  extractParsedResult: (parsed: any) => unknown;
  tokenUsageTelemetryFeature?: string | null;
  threadSource?: unknown;
  signal?: AbortSignal;
  allowProviderModelFallback?: boolean;
}): Promise<unknown> {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) return null;
  const limited = trimmed.slice(0, promptCharLimit);
  let tokenUsage: TokenUsageSnapshot | null = null;
  try {
    const result = await generateOnEphemeralThread({
      prompt: buildGenerationPrompt(limited),
      cwd,
      model,
      effort: "low",
      serviceTier: serviceTier ?? null,
      baseInstructions,
      schema: outputSchema,
      config: {
        "features.enable_fanout": false,
        "features.multi_agent": false,
        "features.multi_agent_v2": false,
        web_search: "disabled",
      },
      threadSource,
      timeoutMs,
      client,
      responseSchema,
      signal,
      allowProviderModelFallback,
      onTokenUsage: (usage) => {
        tokenUsage = usage;
      },
    });
    if (tokenUsageTelemetryFeature != null && model != null)
      emitTokenUsage({
        feature: tokenUsageTelemetryFeature,
        model,
        reasoningEffort: "low",
        serviceTier: serviceTier ?? null,
        status: result == null ? "empty" : "success",
        tokenUsage,
      });
    return result == null ? null : extractParsedResult(result);
  } catch (error) {
    if (tokenUsageTelemetryFeature != null && model != null)
      emitTokenUsage({
        feature: tokenUsageTelemetryFeature,
        model,
        reasoningEffort: "low",
        serviceTier: serviceTier ?? null,
        status: error instanceof Error && error.name === "AbortError" ? "canceled" : "error",
        tokenUsage,
      });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 可 dispose 的生成包装（原 `kie`/`Nie`）
// ---------------------------------------------------------------------------

/** 完成即免中止的生成句柄（原 `kie`）。 */
class SettledAbortableGeneration<T> extends RpcTarget {
  private readonly abortController = new AbortController();
  private readonly result: Promise<T>;
  private disposed = false;
  private settled = false;

  constructor(start: (signal: AbortSignal) => Promise<T>) {
    super();
    this.result = start(this.abortController.signal).finally(() => {
      this.settled = true;
    });
    this.result.catch(() => {});
  }

  wait(): Promise<T> {
    return this.result;
  }

  [Symbol.dispose](): void {
    if (!this.disposed && !this.settled) {
      this.disposed = true;
      this.abortController.abort();
    }
  }
}

/** 无条件中止的生成句柄（原 `Nie`）。 */
class AbortableGeneration<T> extends RpcTarget {
  private readonly abortController = new AbortController();
  private readonly result: Promise<T>;

  constructor(start: (signal: AbortSignal) => Promise<T>) {
    super();
    this.result = start(this.abortController.signal);
    this.result.catch(() => {});
  }

  wait(): Promise<T> {
    return this.result;
  }

  [Symbol.dispose](): void {
    this.abortController.abort();
  }
}

// ---------------------------------------------------------------------------
// schema + 提示词（原 `K8`/`q8`/`J8`/`Y8`/`Z8`/`jie`/`Eie`/`Die`/`Oie`）
// ---------------------------------------------------------------------------

const COMMIT_MESSAGE_MAX_CHARS = 4_000;
const COMMIT_SUBJECT_MAX_CHARS = 72;
const PR_BODY_MAX_CHARS = 30_000;
const PR_TITLE_MAX_CHARS = 120;
const NO_TOOL_CALLS = "Make 0 tool calls.";

const commitMessageSchema = z
  .string()
  .min(8)
  .max(COMMIT_MESSAGE_MAX_CHARS)
  .regex(new RegExp(`^[^\\r\\n]{1,${COMMIT_SUBJECT_MAX_CHARS}}(?:\\r?\\n[\\s\\S]*)?$`));
const commitResponseSchema = z.object({ message: commitMessageSchema });
const prResponseSchema = z.object({ title: z.string().min(8).max(PR_TITLE_MAX_CHARS), body: z.string().min(12).max(PR_BODY_MAX_CHARS) });
const commitPrResponseSchema = z.object({ message: commitMessageSchema, title: z.string().min(8).max(PR_TITLE_MAX_CHARS), body: z.string().min(12).max(PR_BODY_MAX_CHARS) });

/** 文本生成 schema（原 `Z8`/`jie`）。 */
const textResponseSchema = z.object({ text: z.string() });

/** 提示词深拷贝（原 `AN`：JSON 往返）。 */
function promptClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** commit 提示词（原 `Eie`）。 */
function commitMessagePrompt(diffContext: string): string {
  return [
    "Using the supplied git context below, generate a git commit message.",
    "Write the result into the structured response field message.",
    "message must contain plain commit-message text only, not JSON, field labels, or code fences.",
    "Custom commit instructions for message content and formatting override the fallback rules below.",
    NO_TOOL_CALLS,
    "Bounds:",
    `- Keep the complete message under ${COMMIT_MESSAGE_MAX_CHARS} characters.`,
    `- Keep the subject under ${COMMIT_SUBJECT_MAX_CHARS} characters.`,
    "Fallback rules:",
    "- Generate a concise single-line subject.",
    "- Use an imperative verb first.",
    "- Do not add a scope prefix unless the context already clearly uses one.",
    "- Do not include markdown, quotes, or trailing punctuation.",
    "",
    "Diff context:",
    diffContext,
  ].join("\n");
}

/** PR 提示词（原 `Die`）。 */
function pullRequestPrompt(context: string): string {
  return [
    "You are a helpful assistant. Generate a pull request title and body.",
    "Write the result into the structured response fields title and body.",
    NO_TOOL_CALLS,
    "If context includes pull request instructions, follow them even when they conflict with the default rules below.",
    "Language rules:",
    "- Match the primary language of the supplied context; default to English.",
    "- Translate standard section headings such as Summary and Testing when writing in another language.",
    "Fallback PR title rules:",
    "- title must contain only the PR title, not JSON, field labels, or body content.",
    "- Use an imperative or action-oriented phrasing first.",
    `- Keep the title under ${PR_TITLE_MAX_CHARS} characters.`,
    "- No trailing punctuation.",
    "Body rules:",
    "- body must contain only the PR body, not JSON, field labels, the title, or a full PR draft.",
    "- Do not repeat, restate, or label the title inside body.",
    "- Keep the body concise and scannable.",
    `- Keep the body under ${PR_BODY_MAX_CHARS} characters.`,
    "- Use Markdown with short bullets.",
    "- Include a Summary section and a Testing section.",
    "- In Testing, describe meaningful validation at a high level, such as new unit or integration tests, or local UI testing with Playwright.",
    "- Do not paste command transcripts. For routine checks, summarize the result, for example: lint and formatting passed.",
    '- If tests were not run, say "Not run (not requested)".',
    "- If context includes pull request instructions, apply them to the title/body content only.",
    "",
    "Context:",
    context,
  ].join("\n");
}

/** commit + PR 合并提示词（原 `Oie`）。 */
function commitPullRequestPrompt(context: string): string {
  return [
    "Using the supplied commit and pull request contexts below, generate one git commit message plus one pull request title and body.",
    "Write the result into the structured response fields message, title, and body.",
    "message must contain plain commit-message text only, not JSON, field labels, or code fences.",
    NO_TOOL_CALLS,
    "If context includes pull request instructions, follow them even when they conflict with the default pull request rules below.",
    "Custom commit instructions for message content and formatting apply to message only and override the fallback commit message rules below.",
    "Commit message bounds:",
    `- Keep the complete message under ${COMMIT_MESSAGE_MAX_CHARS} characters.`,
    `- Keep the subject under ${COMMIT_SUBJECT_MAX_CHARS} characters.`,
    "Fallback commit message rules:",
    "- Generate a concise single-line subject.",
    "- Use an imperative verb first.",
    "- Do not add a scope prefix unless the context already clearly uses one.",
    "- Do not include markdown, quotes, or trailing punctuation.",
    "Pull request language rules:",
    "- Match the primary language of the supplied context; default to English.",
    "- Translate standard section headings such as Summary and Testing when writing in another language.",
    "Fallback PR title rules:",
    "- title must contain only the PR title, not JSON, field labels, or body content.",
    "- Use an imperative or action-oriented phrasing first.",
    `- Keep title under ${PR_TITLE_MAX_CHARS} characters.`,
    "- No trailing punctuation.",
    "Pull request body rules:",
    "- body must contain only the PR body, not JSON, field labels, the title, or a full PR draft.",
    "- Do not repeat, restate, or label the title inside body.",
    "- Keep the body concise and scannable.",
    `- Keep the body under ${PR_BODY_MAX_CHARS} characters.`,
    "- Use Markdown with short bullets.",
    "- Include a Summary section and a Testing section.",
    "- In Testing, describe meaningful validation at a high level, such as new unit or integration tests, or local UI testing with Playwright.",
    "- Do not paste command transcripts. For routine checks, summarize the result, for example: lint and formatting passed.",
    '- If tests were not run, say "Not run (not requested)".',
    "- If context includes pull request instructions, apply them to title/body only.",
    "",
    "Commit and pull request context:",
    context,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// 生成器（原 `Aie`/`Mie`）
// ---------------------------------------------------------------------------

export const EPHEMERAL_GENERATION_TIMEOUT_MS = 45_000;
/** Pull-request message generation timeout (原 `H8`，与通用生成超时同值但保留独立契约)。 */
export const PULL_REQUEST_GENERATION_TIMEOUT_MS = 45_000;
const EPHEMERAL_GENERATION_PROMPT_LIMIT = 20_000;
const PR_PROMPT_LIMIT = 30_000;
const COMMIT_PR_PROMPT_LIMIT = 40_000;

/** 默认临时生成模型（原 `P_.ephemeralGenerationModel`）。 */
export const EPHEMERAL_GENERATION_MODEL = "gpt-5.6-luna";

/** PR 消息生成配置捆绑（原 `X8`）。 */
const PULL_REQUEST_GENERATION_BUNDLE = {
  tokenUsageTelemetryFeature: "pull_request_message",
  promptCharLimit: PR_PROMPT_LIMIT,
  buildGenerationPrompt: pullRequestPrompt,
  outputSchema: promptClone(prResponseSchema),
  responseSchema: prResponseSchema,
  extractParsedResult: (parsed: { title: string; body: string }) => parsed,
} as const;

/** commit 消息生成配置捆绑（原 `wie`）。 */
const COMMIT_MESSAGE_GENERATION_BUNDLE = {
  tokenUsageTelemetryFeature: "commit_message",
  promptCharLimit: EPHEMERAL_GENERATION_PROMPT_LIMIT,
  buildGenerationPrompt: commitMessagePrompt,
  outputSchema: promptClone(commitResponseSchema),
  responseSchema: commitResponseSchema,
  extractParsedResult: (parsed: { message: string }) => parsed.message,
} as const;

/** commit + PR 合并生成配置捆绑（原 `Tie`）。 */
const COMMIT_PULL_REQUEST_GENERATION_BUNDLE = {
  tokenUsageTelemetryFeature: "commit_pull_request_message",
  promptCharLimit: COMMIT_PR_PROMPT_LIMIT,
  buildGenerationPrompt: commitPullRequestPrompt,
  outputSchema: promptClone(commitPrResponseSchema),
  responseSchema: commitPrResponseSchema,
  extractParsedResult: (parsed: { message: string; title: string; body: string }) => parsed,
} as const;

/**
 * PR 消息生成器（原 `Aie`，导出 `rt`）。
 * RPC 暴露的 generate → 可 dispose 句柄；providerModelFallback 按版本门控。
 */
export class PullRequestMessageGenerator extends RpcTarget {
  private readonly getAppServerClient: (hostId: string | null) => GenerationClient;
  private readonly getModel: () => Promise<string>;

  constructor(getAppServerClient: (hostId: string | null) => GenerationClient, getModel: () => Promise<string> = async () => EPHEMERAL_GENERATION_MODEL) {
    super();
    this.getAppServerClient = getAppServerClient;
    this.getModel = getModel;
  }

  generate({ appServerVersion, hostId, prompt }: { appServerVersion?: string | null; hostId: string | null; prompt: string }): SettledAbortableGeneration<unknown> {
    return new SettledAbortableGeneration(async (signal) =>
      runStructuredGeneration({
        allowProviderModelFallback: appServerVersion != null && appServerSupportsFeature(appServerVersion, "providerModelFallback"),
        client: this.getAppServerClient(hostId),
        cwd: null,
        model: await this.getModel(),
        prompt,
        serviceTier: null,
        signal,
        timeoutMs: PULL_REQUEST_GENERATION_TIMEOUT_MS,
        ...PULL_REQUEST_GENERATION_BUNDLE,
      }),
    );
  }
}

/** 本地 host 哨兵（原 `wT`：本地 host 走 null client 让默认路由接管）。 */
const LOCAL_HOST_SENTINEL = "local";

/**
 * 文本生成器（原 `Mie`，导出 `nt`）。
 * instructions + input → {text} 结构化输出；preserveOutputWhitespace 控制
 * trim；本地 host 时 cwd/client 旁路为 null。
 */
export class TextGenerator extends RpcTarget {
  private readonly getAppServerClient: (hostId: string | null) => GenerationClient;

  constructor(getAppServerClient: (hostId: string | null) => GenerationClient) {
    super();
    this.getAppServerClient = getAppServerClient;
  }

  generate({
    hostId,
    cwd,
    instructions,
    input,
    preserveOutputWhitespace = false,
    threadSource,
    model,
  }: {
    hostId: string;
    cwd: string | null;
    instructions: string;
    input: string;
    preserveOutputWhitespace?: boolean;
    threadSource?: unknown;
    model?: string | null;
  }): AbortableGeneration<unknown> {
    const isLocal = hostId === LOCAL_HOST_SENTINEL;
    return new AbortableGeneration((signal) =>
      runStructuredGeneration({
        client: this.getAppServerClient(isLocal ? null : hostId),
        cwd: isLocal ? null : cwd,
        model: model ?? null,
        allowProviderModelFallback: false,
        prompt: input,
        promptCharLimit: input.length,
        timeoutMs: EPHEMERAL_THREAD_TIMEOUT_MS,
        baseInstructions: [
          instructions,
          "Write the result into the structured response field text.",
          NO_TOOL_CALLS,
        ].join("\n"),
        buildGenerationPrompt: (promptText) => promptText,
        outputSchema: promptClone(textResponseSchema),
        responseSchema: textResponseSchema,
        extractParsedResult: (parsed: { text: string }) => (preserveOutputWhitespace ? parsed.text : parsed.text.trim() || null),
        threadSource,
        signal,
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// 兼容导出（structured-generation 分区 3 个压缩名）
// ---------------------------------------------------------------------------

export {
  runStructuredGeneration as ut,
  TextGenerator as nt,
  PullRequestMessageGenerator as rt,
  COMMIT_PULL_REQUEST_GENERATION_BUNDLE as ct,
  PULL_REQUEST_GENERATION_BUNDLE as lt,
  COMMIT_MESSAGE_GENERATION_BUNDLE as st,
  EPHEMERAL_THREAD_TIMEOUT_MS as it,
  PULL_REQUEST_GENERATION_TIMEOUT_MS as ot,
  EPHEMERAL_GENERATION_TIMEOUT_MS as at,
};
