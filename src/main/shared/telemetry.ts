// shared chunk：CES 遥测上报（telemetry 分区）。
//
// 对应 src-DldfpmrL.ts 的 L58,959-59,291 + L59,291-59,355 区段：
//   - $re：事件构建——logger 名解析（ure：`[name] message` 前缀拆分）、
//     级别映射（eie：trace/debug→debug、warning→warn）、build 信息
//     注入（tie/O8：build_number/version/app_version，fy 剥预发布号）
//   - aie：事件批处理器——5s（nie）定时 / 50 条（rie）/ 64KiB（iie）
//     阈值触发 flush
//   - N8（pt）：HTTP 传输——队列 4MiB 上限（lie）、指数退避
//     （oie=2s 起、sie=30s 封顶、cie=5 次后丢批）、30s 请求超时
//     （uie）、flush 上限等待 j8=2s、analyticsEnabled 异步解析
//     （失败一次性上报 reportFailure——M8 哨兵）、401/403 →
//     invalid_client_token 禁用
//   - P8（mt）：intake URL 构建（ddsource/dd-api-key/dd-evp-origin/
//     dd-request-id → ddforward 编码）
//   - fie（ft）：TelemetryClient 门面——setUserInfo + log（级别 +
//     消息 + 额外字段）+ flush/flushNow，事件元信息（buildInfo/
//     source/env/platform/codexAppSessionId）
//   - hie（dt）：邮箱域名 MX 查询 → 提供商归类（gie：google.com 族 /
//     microsoft.com 族 / other；F8=5s 超时；ENODATA/ENOTFOUND 静默）
//
// 兼容导出：ft=fie、pt=N8、mt=P8、dt=hie。

import { resolveMx } from "node:dns/promises";

import { memoizedTaggedLogger } from "@chunk/logger";

// ---------------------------------------------------------------------------
// 事件构建（原 `$re`/`ure`/`eie`/`tie`/`O8`）
// ---------------------------------------------------------------------------

/** logger 名解析（原 `ure`：`[name] message` 前缀）。 */
function parseLoggerTaggedMessage(message: string): { loggerName: string | null; message: string } {
  if (!message.startsWith("[")) return { loggerName: null, message };
  const closeIndex = message.indexOf("]");
  if (closeIndex === -1 || message[closeIndex + 1] !== " ") return { loggerName: null, message };
  const loggerName = message.slice(1, closeIndex).trim();
  return loggerName ? { loggerName, message: message.slice(closeIndex + 2) } : { loggerName: null, message };
}

/** 级别映射（原 `eie`）。 */
function cesLevelFor(level: string): "debug" | "info" | "warn" | "error" {
  switch (level) {
    case "trace":
    case "debug":
      return "debug";
    case "info":
      return "info";
    case "warning":
      return "warn";
    case "error":
      return "error";
  }
}

/** 语义化版本（剥预发布号，原 `fy` 的简化形态）。 */
function stableVersion(version: string): string {
  const plusIndex = version.indexOf("+");
  const base = plusIndex === -1 ? version : version.slice(0, plusIndex);
  const dashIndex = base.indexOf("-");
  return dashIndex === -1 ? base : base.slice(0, dashIndex);
}

/** 事件元信息。 */
export interface TelemetryEventMetadata {
  buildInfo: { buildNumber?: string | number | null; version?: string | null };
  codexAppSessionId?: string | null;
  env?: string | null;
  platform?: string | null;
  source: string;
}

/** 事件额外字段。 */
type TelemetryEvent = Record<string, unknown> & { message: string; status: string; date: number };

/** 构建遥测事件（原 `$re`）。 */
function buildTelemetryEvent(level: string, message: string, metadata: TelemetryEventMetadata, extra?: Record<string, unknown>): TelemetryEvent {
  const tagged = parseLoggerTaggedMessage(message);
  const event: TelemetryEvent = {
    message: tagged.message,
    status: cesLevelFor(level),
    source: metadata.source,
    service: metadata.source,
    env: metadata.env,
    date: Date.now(),
    logger: { name: tagged.loggerName ?? "app" },
    "codex.app_session_id": metadata.codexAppSessionId,
    platform: metadata.platform,
  };
  if (extra != null) Object.assign(event, extra);
  const version = metadata.buildInfo.version == null ? null : stableVersion(metadata.buildInfo.version);
  if (metadata.buildInfo.buildNumber != null) event.build_number = metadata.buildInfo.buildNumber;
  if (version != null) {
    event.version = version;
    event.app_version = version;
  }
  return event;
}

// ---------------------------------------------------------------------------
// 批处理器（原 `aie`）
// ---------------------------------------------------------------------------

const BATCH_FLUSH_INTERVAL_MS = 5_000;
const BATCH_MAX_SIZE = 50;
const BATCH_MAX_BYTES = 64_000;

/** 事件批处理器（原 `aie`：定时 / 条数 / 字节数三阈值）。 */
class EventBatcher {
  private readonly buffer: string[] = [];
  private bufferBytes = 0;
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onFlush: (events: string[]) => void) {}

  enqueue(event: string): void {
    this.buffer.push(event);
    this.bufferBytes += event.length;
    if (this.buffer.length >= BATCH_MAX_SIZE || this.bufferBytes >= BATCH_MAX_BYTES) {
      this.flush();
      return;
    }
    this.scheduleFlush();
  }

  flushNow(): void {
    this.flush();
  }

  clear(): void {
    this.buffer.length = 0;
    this.bufferBytes = 0;
    this.clearFlushTimeout();
  }

  private scheduleFlush(): void {
    this.flushTimeout ??= setTimeout(() => this.flush(), BATCH_FLUSH_INTERVAL_MS);
  }

  private flush(): void {
    if (this.buffer.length === 0) {
      this.clearFlushTimeout();
      return;
    }
    const events = this.buffer.splice(0, this.buffer.length);
    this.bufferBytes = 0;
    this.clearFlushTimeout();
    this.onFlush(events);
  }

  private clearFlushTimeout(): void {
    if (this.flushTimeout != null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP 传输（原 `N8`，导出 `pt`）
// ---------------------------------------------------------------------------

const DEFAULT_INTAKE_ENDPOINT = "https://chat.openai.com/ces/v1/telemetry/intake";
const DEFAULT_CLIENT_TOKEN = "dummy-token";
const RETRY_BASE_DELAY_MS = 2_000;
const RETRY_MAX_DELAY_MS = 30_000;
const RETRY_MAX_ATTEMPTS = 5;
const QUEUE_MAX_BYTES = 4_194_304;
const REQUEST_TIMEOUT_MS = 30_000;
const FLUSH_MAX_WAIT_MS = 2_000;

const textEncoder = new TextEncoder();
let reportedTransportFailure = false;

/** 传输选项。 */
export interface TelemetryTransportOptions {
  endpoint?: string;
  clientToken?: string;
  fetchImpl?: typeof fetch;
  analyticsEnabled?: boolean | Promise<boolean>;
  isEnabled?(): boolean;
  reportFailure(failure: { type: string; reason: string; [key: string]: unknown }): void;
  waitUntilReady?(): Promise<void>;
}

interface QueuedBatch {
  bytes: number;
  events: string[];
  requestId: string;
}

/** HTTP 传输（原 `N8`）。 */
export class TelemetryHttpTransport {
  private readonly options: TelemetryTransportOptions;
  private readonly batcher: EventBatcher;
  private readonly fetchImpl: typeof fetch;
  private readonly queue: QueuedBatch[] = [];
  private queuedBytes = 0;
  private disposed = false;
  private enabled: boolean | null;
  private inFlightSend: Promise<void> | null = null;
  private retryAttempts = 0;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  constructor(options: TelemetryTransportOptions) {
    this.options = options;
    const { analyticsEnabled = true } = options;
    this.enabled = typeof analyticsEnabled === "boolean" ? analyticsEnabled : null;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.batcher = new EventBatcher((events) => this.enqueueBatch(events));
    if (typeof analyticsEnabled !== "boolean")
      Promise.resolve(analyticsEnabled).then(
        (enabled) => this.setEnabled(enabled),
        (error) => this.disableWithFailure({ type: "disabled", reason: "analytics_config_failed", error }),
      );
  }

  setEnabled(enabled: boolean): void {
    if (this.disposed) return;
    this.enabled = enabled;
    this.batcher.flushNow();
    if (this.enabled) this.drainQueue();
    else {
      this.clearQueue();
      this.abortController?.abort();
    }
  }

  enqueue(event: TelemetryEvent): void {
    if (!this.isSendingAllowed()) {
      this.batcher.clear();
      this.clearQueue();
      return;
    }
    this.batcher.enqueue(JSON.stringify(event));
  }

  flushNow(): void {
    this.batcher.flushNow();
    this.drainQueue();
  }

  async flush(): Promise<void> {
    const deadline = Date.now() + FLUSH_MAX_WAIT_MS;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          while (Date.now() < deadline) {
            if (this.retryTimeout != null) {
              clearTimeout(this.retryTimeout);
              this.retryTimeout = null;
            }
            this.flushNow();
            if (this.inFlightSend == null) return;
            await this.inFlightSend;
          }
        })(),
        new Promise<void>((resolve) => {
          timeout = setTimeout(resolve, FLUSH_MAX_WAIT_MS);
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.enabled = false;
    this.batcher.clear();
    this.clearQueue();
    this.abortController?.abort();
  }

  private isSendingAllowed(): boolean {
    return !this.disposed && this.enabled !== false && (this.options.isEnabled?.() ?? true);
  }

  private enqueueBatch(events: string[]): void {
    if (!this.isSendingAllowed() || events.length === 0) return;
    const bytes = events.reduce((total, event, index) => total + textEncoder.encode(event).byteLength + (index === 0 ? 0 : 1), 0);
    if (this.queuedBytes + bytes > QUEUE_MAX_BYTES) return;
    this.queue.push({ bytes, events, requestId: crypto.randomUUID() });
    this.queuedBytes += bytes;
    void this.drainQueue();
  }

  private async drainQueue(): Promise<void> {
    if (!this.isSendingAllowed()) {
      this.batcher.clear();
      this.clearQueue();
      return;
    }
    if (this.enabled == null || this.inFlightSend != null || this.retryTimeout != null) return;
    const batch = this.queue[0];
    if (batch != null)
      this.inFlightSend = (async () => {
        try {
          await this.send(batch.events.join("\n"), batch.requestId);
          if (this.queue[0] === batch) this.removeHeadBatch();
          this.retryAttempts = 0;
        } catch {
          if (!this.isSendingAllowed()) {
            this.clearQueue();
            return;
          }
          if (this.queue[0] === batch) this.scheduleRetry();
        } finally {
          this.inFlightSend = null;
          void this.drainQueue();
        }
      })();
  }

  private scheduleRetry(): void {
    if (this.retryTimeout != null) return;
    if (this.retryAttempts >= RETRY_MAX_ATTEMPTS) {
      this.removeHeadBatch();
      this.retryAttempts = 0;
      void this.drainQueue();
      return;
    }
    this.retryAttempts += 1;
    const delay = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** (this.retryAttempts - 1));
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      void this.drainQueue();
    }, delay);
  }

  private disableWithFailure(failure: { type: string; reason: string; [key: string]: unknown }): void {
    if (this.disposed) return;
    this.setEnabled(false);
    if (!reportedTransportFailure) {
      reportedTransportFailure = true;
      this.options.reportFailure(failure);
    }
  }

  private removeHeadBatch(): void {
    const batch = this.queue.shift();
    if (batch != null) this.queuedBytes -= batch.bytes;
  }

  private clearQueue(): void {
    this.queue.length = 0;
    this.queuedBytes = 0;
    this.retryAttempts = 0;
    if (this.retryTimeout != null) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  private async send(body: string, requestId: string): Promise<void> {
    const controller = new AbortController();
    this.abortController = controller;
    let requestTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (this.options.waitUntilReady != null) {
        const { signal } = controller;
        await Promise.race([
          this.options.waitUntilReady!(),
          new Promise<never>((_, reject) => {
            const onAbort = () => reject(signal.reason);
            signal.addEventListener("abort", onAbort, { once: true });
          }),
        ]);
        signal.throwIfAborted();
        if (!this.isSendingAllowed()) return;
      }
      requestTimeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await this.fetchImpl(
        telemetryIntakeUrl(requestId, this.options.endpoint ?? DEFAULT_INTAKE_ENDPOINT, this.options.clientToken ?? DEFAULT_CLIENT_TOKEN),
        {
          method: "POST",
          headers: { "content-type": "text/plain", "x-request-id": requestId },
          body,
          signal: controller.signal,
        },
      );
      if (response.ok) {
        if (response.body != null) await response.body.cancel().catch(() => {});
        return;
      }
      const text = await response.text();
      if (response.status >= 400 && response.status < 500) {
        if (response.status === 401 || response.status === 403)
          this.disableWithFailure({ type: "disabled", reason: "invalid_client_token", status: response.status, body: text });
        return;
      }
      throw new Error(`[ces-telemetry] non-2xx response (${response.status})`);
    } finally {
      clearTimeout(requestTimeout);
      this.abortController = null;
    }
  }
}

// ---------------------------------------------------------------------------
// intake URL（原 `P8`，导出 `mt`）
// ---------------------------------------------------------------------------

/** intake URL 构建（原 `P8`：ddforward 编码的 Datadog 浏览器 intake）。 */
export function telemetryIntakeUrl(requestId: string, endpoint: string = DEFAULT_INTAKE_ENDPOINT, clientToken: string = DEFAULT_CLIENT_TOKEN): string {
  const params = new URLSearchParams({
    ddsource: "browser",
    "dd-api-key": clientToken,
    "dd-evp-origin": "browser",
    "dd-request-id": requestId,
  });
  return `${endpoint}?ddforward=${encodeURIComponent(`/api/v2/logs?${params.toString()}`)}`;
}

// ---------------------------------------------------------------------------
// 客户端门面（原 `fie`，导出 `ft`）
// ---------------------------------------------------------------------------

/** 客户端选项。 */
export interface TelemetryClientOptions extends TelemetryTransportOptions {
  buildInfo: { buildNumber?: string | number | null; version?: string | null };
  codexAppSessionId?: string | null;
  env?: string | null;
  platform?: string | null;
  source: string;
  transport?: TelemetryHttpTransport;
}

/** CES 遥测客户端（原 `fie`）。 */
export class TelemetryClient {
  private readonly options: TelemetryClientOptions;
  private readonly transport: TelemetryHttpTransport;
  private userInfo: unknown = null;

  constructor(options: TelemetryClientOptions) {
    this.options = options;
    this.transport = options.transport ?? new TelemetryHttpTransport({ fetchImpl: options.fetchImpl, reportFailure: options.reportFailure });
  }

  setUserInfo(userInfo: unknown): void {
    this.userInfo = userInfo;
  }

  log(level: string, message: string, extra?: Record<string, unknown>): void {
    const event = buildTelemetryEvent(
      level,
      message,
      {
        buildInfo: this.options.buildInfo,
        codexAppSessionId: this.options.codexAppSessionId,
        source: this.options.source,
        env: this.options.env,
        platform: this.options.platform,
      },
      { usr: this.userInfo, ...extra },
    );
    this.transport.enqueue(event);
  }

  flush(): Promise<void> {
    return this.transport.flush();
  }

  flushNow(): void {
    this.transport.flushNow();
  }
}

// ---------------------------------------------------------------------------
// 邮箱域 MX 提供商归类（原 `hie`，导出 `dt`）
// ---------------------------------------------------------------------------

const MX_LOOKUP_TIMEOUT_MS = 5_000;
const GOOGLE_MX_DOMAINS = ["google.com", "googlemail.com"];
const MICROSOFT_MX_DOMAINS = ["microsoft.com", "microsoftonline.com", "outlook.com", "protection.outlook.com"];

const telemetryLog = memoizedTaggedLogger("ces-telemetry");

/** 提供商归类（原 `gie`）。 */
function providerForMxExchanges(exchanges: string[]): "google" | "microsoft" | "other" {
  if (exchanges.some((exchange) => matchesMxDomain(exchange, GOOGLE_MX_DOMAINS))) return "google";
  if (exchanges.some((exchange) => matchesMxDomain(exchange, MICROSOFT_MX_DOMAINS))) return "microsoft";
  return "other";
}

/** 域匹配（原 `I8`：相等或子域）。 */
function matchesMxDomain(exchange: string, domains: string[]): boolean {
  const normalized = exchange.trim().toLowerCase();
  return domains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

/** 有效域提取（原 `_ie`：空或含 @ 视为无效）。 */
function emailDomainForLookup(domain: string): string | null {
  const normalized = domain.trim().toLowerCase();
  return normalized.length === 0 || normalized.includes("@") ? null : normalized;
}

/** MX 查询（原 `vie`：5s 超时返回空）。 */
function resolveMxWithTimeout(domain: string): Promise<{ exchange: string }[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      telemetryLog().warning("email_domain_mx_lookup_timed_out", { safe: { timeoutMs: MX_LOOKUP_TIMEOUT_MS }, sensitive: { domain } });
      resolve([]);
    }, MX_LOOKUP_TIMEOUT_MS);
    void resolveMx(domain).then(
      (records) => {
        clearTimeout(timeout);
        resolve(records as { exchange: string }[]);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error instanceof Error ? error : new Error("MX lookup failed"));
      },
    );
  });
}

/**
 * 邮箱域提供商归类（原 `hie`，导出 `dt`）。
 * MX 记录里 google.com 族 → google、microsoft.com 族 → microsoft，
 * 否则 other；ENODATA/ENOTFOUND 静默返回 other。
 */
export async function emailDomainProvider(domain: string): Promise<"google" | "microsoft" | "other"> {
  const normalized = emailDomainForLookup(domain);
  if (normalized == null) return "other";
  const records = await resolveMxWithTimeout(normalized).catch((error) => {
    if (error instanceof Error && "code" in error && ((error as NodeJS.ErrnoException).code === "ENODATA" || (error as NodeJS.ErrnoException).code === "ENOTFOUND"))
      return [] as { exchange: string }[];
    telemetryLog().warning("email_domain_mx_lookup_failed", {
      safe: { errorCode: error instanceof Error && "code" in error && typeof (error as NodeJS.ErrnoException).code === "string" ? (error as NodeJS.ErrnoException).code! : "unknown" },
      sensitive: { domain: normalized, error },
    });
    throw error;
  });
  const provider = providerForMxExchanges(records.map((record) => record.exchange));
  telemetryLog().info("email_domain_mx_lookup_completed", { safe: { provider, recordCount: records.length }, sensitive: { domain: normalized } });
  return provider;
}

// ---------------------------------------------------------------------------
// 兼容导出（telemetry 分区 4 个压缩名）
// ---------------------------------------------------------------------------

export {
  TelemetryClient as ft,
  TelemetryHttpTransport as pt,
  telemetryIntakeUrl as mt,
  emailDomainProvider as dt,
};
