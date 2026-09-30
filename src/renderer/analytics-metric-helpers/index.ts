// Analytics queue, middleware, persistence, and remote-metric helpers. Release chunk: metric-helpers-107c5da7f8a5.js.
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as middlewareChunk from "@rchunk/analytics-middleware";
import * as loadScriptChunk from "@rchunk/load-script";

interface Identified {
  id: string;
}
interface AnalyticsStats {
  gauge(metric: string, value: number, tags: string[]): void;
  increment(metric: string, value?: number, tags?: string[]): void;
}
interface AnalyticsContextLike {
  event: { type: string };
  stats: AnalyticsStats;
  cancel(reason: unknown): void;
  log(level: string, message: string, detail?: Record<string, unknown>): void;
}
interface Plugin extends Record<string, unknown> {
  name: string;
}
interface MiddlewareFailure {
  type: string;
}
interface MiddlewareRuntime {
  c: new (
    event: unknown,
    id?: string,
    stats?: AnalyticsStats,
  ) => AnalyticsContextLike;
  d(): void;
  l(): void;
  s: new (...arguments_: unknown[]) => MiddlewareFailure;
  u: new () => AnalyticsStats;
}
interface SharedRuntime {
  p4(): void;
}
interface LoadScriptRuntime {
  p(): boolean;
}
interface FetchHeadersLike {
  entries(): string[][];
  get(name: string): string | undefined;
  has(name: string): boolean;
  keys(): string[];
}
interface FetchResponseLike {
  blob(): Promise<Blob>;
  clone(): FetchResponseLike;
  headers: FetchHeadersLike;
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
  url: string;
}
interface FetchOptions {
  body?: Document | XMLHttpRequestBodyInit | null;
  credentials?: string;
  headers?: Record<string, string>;
  method?: string;
}
interface RemoteMetric {
  library: string;
  library_version: string;
  metric: string;
  tags: Record<string, string>;
  type: "Counter";
  value: number;
}
interface RemoteMetricOptions {
  flushTimer?: number;
  host?: string;
  maxQueueSize?: number;
  protocol?: string;
  sampleRate?: number;
}
interface IntegrationSettings {
  integrations: Record<string, Record<string, unknown>>;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const middleware = middlewareChunk as unknown as MiddlewareRuntime;
const loadScript = loadScriptChunk as unknown as LoadScriptRuntime;
void runtimeChunk;

let createDeferred:
  | (<Value>() => {
      isSettled(): boolean;
      promise: Promise<Value>;
      reject(reason?: unknown): void;
      resolve(value: Value | PromiseLike<Value>): void;
    })
  | undefined;

class TypedEventEmitter<Events extends { [Key in keyof Events]: unknown[] }> {
  private readonly callbacks = new Map<
    keyof Events,
    Array<(...arguments_: unknown[]) => void>
  >();
  private warned = false;
  constructor(private readonly maxListeners = 10) {}
  on<Event extends keyof Events>(
    event: Event,
    callback: (...arguments_: Events[Event]) => void,
  ): this {
    const listeners = this.callbacks.get(event) ?? [];
    listeners.push(callback as (...arguments_: unknown[]) => void);
    this.callbacks.set(event, listeners);
    if (
      !this.warned &&
      this.maxListeners > 0 &&
      listeners.length > this.maxListeners
    ) {
      console.warn(
        `Event Emitter: Possible memory leak detected; ${String(event)} has exceeded ${this.maxListeners} listeners.`,
      );
      this.warned = true;
    }
    return this;
  }
  once<Event extends keyof Events>(
    event: Event,
    callback: (...arguments_: Events[Event]) => void,
  ): this {
    const once = (...arguments_: Events[Event]) => {
      this.off(event, once);
      callback(...arguments_);
    };
    return this.on(event, once);
  }
  off<Event extends keyof Events>(
    event: Event,
    callback: (...arguments_: Events[Event]) => void,
  ): this {
    const listeners = this.callbacks.get(event) ?? [];
    this.callbacks.set(
      event,
      listeners.filter((listener) => listener !== callback),
    );
    return this;
  }
  emit<Event extends keyof Events>(
    event: Event,
    ...arguments_: Events[Event]
  ): this {
    for (const callback of this.callbacks.get(event) ?? [])
      callback(...arguments_);
    return this;
  }
}

let EventEmitterClass: typeof TypedEventEmitter | undefined;
const onRemoveFromFuture = "onRemoveFromFuture";
type RetryQueueEvents = { onRemoveFromFuture: [] };

class RetryQueue<
  Item extends Identified,
> extends TypedEventEmitter<RetryQueueEvents> {
  readonly future: Item[] = [];
  constructor(
    private readonly maxAttempts: number,
    public queue: Item[],
    public seen: Record<string, number> = {},
  ) {
    super();
  }
  push(...items: Item[]): boolean[] {
    const pushed = items.map((item) => {
      if (this.updateAttempts(item) > this.maxAttempts || this.includes(item))
        return false;
      this.queue.push(item);
      return true;
    });
    this.queue.sort(
      (left, right) => this.getAttempts(left) - this.getAttempts(right),
    );
    return pushed;
  }
  pushWithBackoff(item: Item, minimumDelay = 0): boolean {
    if (minimumDelay === 0 && this.getAttempts(item) === 0)
      return this.push(item)[0] ?? false;
    const attempt = this.updateAttempts(item);
    if (attempt > this.maxAttempts || this.includes(item)) return false;
    const delay = Math.max(minimumDelay, backoff({ attempt: attempt - 1 }));
    setTimeout(() => {
      this.queue.push(item);
      const index = this.future.findIndex(
        (candidate) => candidate.id === item.id,
      );
      if (index >= 0) this.future.splice(index, 1);
      this.emit(onRemoveFromFuture);
    }, delay);
    this.future.push(item);
    return true;
  }
  getAttempts(item: Item): number {
    return this.seen[item.id] ?? 0;
  }
  updateAttempts(item: Item): number {
    const attempts = this.getAttempts(item) + 1;
    this.seen[item.id] = attempts;
    return attempts;
  }
  includes(item: Item): boolean {
    return (
      this.queue.some(
        (candidate) => candidate === item || candidate.id === item.id,
      ) ||
      this.future.some(
        (candidate) => candidate === item || candidate.id === item.id,
      )
    );
  }
  pop(): Item | undefined {
    return this.queue.shift();
  }
  get length(): number {
    return this.queue.length;
  }
  get todo(): number {
    return this.queue.length + this.future.length;
  }
}

function backoff(options: {
  attempt: number;
  factor?: number;
  maxTimeout?: number;
  minTimeout?: number;
}): number {
  return Math.min(
    (Math.random() + 1) *
      (options.minTimeout ?? 500) *
      (options.factor ?? 2) ** options.attempt,
    options.maxTimeout ?? Number.POSITIVE_INFINITY,
  );
}

async function invokePlugin(
  context: AnalyticsContextLike,
  plugin: Plugin,
): Promise<unknown> {
  context.log("debug", "plugin", { plugin: plugin.name });
  const startedAt = Date.now();
  const handler = plugin[context.event.type];
  if (typeof handler !== "function") return context;
  try {
    const result = await (handler as (value: AnalyticsContextLike) => unknown)(
      context,
    );
    context.stats.gauge("plugin_time", Date.now() - startedAt, [
      `plugin:${plugin.name}`,
    ]);
    return result;
  } catch (error) {
    if (
      error instanceof middleware.s &&
      error.type === "middleware_cancellation"
    )
      throw error;
    if (error instanceof middleware.s) {
      context.log("warn", error.type, { plugin: plugin.name, error });
      return error;
    }
    context.log("error", "plugin Error", { plugin: plugin.name, error });
    context.stats.increment("plugin_error", 1, [`plugin:${plugin.name}`]);
    return error;
  }
}

async function invokePluginOrCancel(
  context: AnalyticsContextLike,
  plugin: Plugin,
): Promise<void> {
  const result = await invokePlugin(context, plugin);
  if (result instanceof middleware.c) return;
  context.log("debug", "Context canceled");
  context.stats.increment("context_canceled");
  context.cancel(result);
}

function canUseBrowserStorage(): boolean {
  return loadScript.p();
}
function isOnline(): boolean {
  return !canUseBrowserStorage() || window.navigator.onLine;
}
function isOffline(): boolean {
  return !isOnline();
}

function xhrFetch(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResponseLike> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const headerKeys: string[] = [];
    const headerEntries: string[][] = [];
    const headers: Record<string, string> = {};
    const response = (): FetchResponseLike => ({
      ok: Math.floor(request.status / 100) === 2,
      statusText: request.statusText,
      status: request.status,
      url: request.responseURL,
      text: async () => request.responseText,
      json: async () => JSON.parse(request.responseText) as unknown,
      blob: async () => new Blob([request.response]),
      clone: response,
      headers: {
        keys: () => headerKeys,
        entries: () => headerEntries,
        get: (name) => headers[name.toLowerCase()],
        has: (name) => name.toLowerCase() in headers,
      },
    });
    request.open(options.method ?? "get", url, true);
    request.onload = () => {
      request
        .getAllResponseHeaders()
        .replace(
          /^(.*?):[^\S\n]*([\s\S]*?)$/gm,
          (_match, rawName: string, value: string) => {
            const name = rawName.toLowerCase();
            headerKeys.push(name);
            headerEntries.push([name, value]);
            headers[name] = headers[name] ? `${headers[name]},${value}` : value;
            return "";
          },
        );
      resolve(response());
    };
    request.onerror = () => reject(new Error("Network request failed"));
    request.withCredentials = options.credentials === "include";
    for (const [name, value] of Object.entries(options.headers ?? {}))
      request.setRequestHeader(name, value);
    request.send(options.body ?? null);
  });
}

const getGlobalObject = (): typeof globalThis | null =>
  typeof globalThis === "object" ? globalThis : null;
const fetchRequest = (
  url: string,
  options?: FetchOptions,
): Promise<FetchResponseLike> => {
  const nativeFetch = getGlobalObject()?.fetch;
  if (nativeFetch == null) return xhrFetch(url, options);
  return nativeFetch(
    url,
    options as RequestInit,
  ) as unknown as Promise<FetchResponseLike>;
};
const analyticsVersion = "1.82.0";
const distribution = "npm";
const remoteMetricHost = "api.segment.io/v1";
const getDistribution = (): string => distribution;

function createRemoteMetric(
  metric: string,
  tags: string[],
  library: string,
): RemoteMetric {
  const tagRecord = Object.fromEntries(
    tags.map((tag) => {
      const separator = tag.indexOf(":");
      return separator < 0
        ? [tag, ""]
        : [tag.slice(0, separator), tag.slice(separator + 1)];
    }),
  );
  return {
    type: "Counter",
    metric,
    value: 1,
    tags: tagRecord,
    library: "analytics.js",
    library_version:
      library === "web"
        ? `next-${analyticsVersion}`
        : `npm:next-${analyticsVersion}`,
  };
}

class RemoteMetricQueue {
  private queue: RemoteMetric[] = [];
  private sampleRate: number;
  private readonly host: string;
  private readonly flushTimer: number;
  private readonly maxQueueSize: number;
  private readonly protocol: string;
  constructor(options: RemoteMetricOptions = {}) {
    this.host = options.host ?? remoteMetricHost;
    this.sampleRate = options.sampleRate ?? 1;
    this.flushTimer = options.flushTimer ?? 30_000;
    this.maxQueueSize = options.maxQueueSize ?? 20;
    this.protocol = options.protocol ?? "https";
    if (this.sampleRate > 0) {
      let flushing = false;
      const schedule = () => {
        if (!flushing) {
          flushing = true;
          void this.flush()
            .catch(reportMetricError)
            .finally(() => {
              flushing = false;
            });
        }
        setTimeout(schedule, this.flushTimer);
      };
      schedule();
    }
  }
  increment(metric: string, tags: string[]): void {
    if (
      !metric.includes("analytics_js.") ||
      tags.length === 0 ||
      Math.random() > this.sampleRate ||
      this.queue.length >= this.maxQueueSize
    )
      return;
    this.queue.push(createRemoteMetric(metric, tags, distribution));
    if (metric.includes("error")) void this.flush().catch(reportMetricError);
  }
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    try {
      await this.send();
    } catch (error) {
      reportMetricError(error);
      this.sampleRate = 0;
    }
  }
  private async send(): Promise<void> {
    const series = this.queue;
    this.queue = [];
    await fetchRequest(`${this.protocol}://${this.host}/m`, {
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ series }),
      method: "POST",
    });
  }
}
function reportMetricError(error: unknown): void {
  console.error("Error sending segment performance metrics", error);
}

let remoteMetricQueue: RemoteMetricQueue | undefined;
class RemoteAwareStats extends middleware.u {
  static initRemoteMetrics(options?: RemoteMetricOptions): void {
    remoteMetricQueue = new RemoteMetricQueue(options);
  }
  override increment(metric: string, value?: number, tags?: string[]): void {
    super.increment(metric, value, tags);
    remoteMetricQueue?.increment(metric, tags ?? []);
  }
}
class AnalyticsContext extends middleware.c {
  constructor(event: unknown, id?: string) {
    super(event, id, new RemoteAwareStats());
  }
  static system(): AnalyticsContext {
    return new this({ type: "track", event: "system" });
  }
}

const memoryStorage: Storage = {
  get length() {
    return 0;
  },
  clear() {},
  getItem() {
    return null;
  },
  key() {
    return null;
  },
  removeItem() {},
  setItem() {},
};
let queueStorage: Storage = memoryStorage;
const now = (): number => Date.now();
function withStorageLock(
  name: string,
  callback: () => void,
  attempt = 0,
): void {
  const lockKey = `persisted-queue:v1:${name}:lock`;
  const rawLock = queueStorage.getItem(lockKey);
  const expiresAt = rawLock == null ? null : Number(JSON.parse(rawLock));
  if (expiresAt == null || now() > expiresAt) {
    queueStorage.setItem(lockKey, JSON.stringify(now() + 50));
    try {
      callback();
    } finally {
      queueStorage.removeItem(lockKey);
    }
  } else if (attempt < 3)
    setTimeout(() => withStorageLock(name, callback, attempt + 1), 50);
  else console.error("Unable to retrieve lock");
}
function readQueue<Item extends Identified>(key: string): Item[] {
  const value = queueStorage.getItem(key);
  return value == null ? [] : (JSON.parse(value) as Item[]);
}
function readSeen(key: string): Record<string, number> {
  const value = queueStorage.getItem(key);
  return value == null ? {} : (JSON.parse(value) as Record<string, number>);
}
class PersistedQueue<Item extends Identified> extends RetryQueue<Item> {
  constructor(maxAttempts: number, name: string) {
    super(maxAttempts, []);
    const itemsKey = `persisted-queue:v1:${name}:items`;
    const seenKey = `persisted-queue:v1:${name}:seen`;
    withStorageLock(name, () => {
      const saved = readQueue<Item>(itemsKey);
      const seen = readSeen(seenKey);
      queueStorage.removeItem(itemsKey);
      queueStorage.removeItem(seenKey);
      this.queue = [...saved, ...this.queue];
      this.seen = { ...seen, ...this.seen };
    });
    window.addEventListener("pagehide", () => {
      if (this.todo === 0) return;
      withStorageLock(name, () => {
        const byId = new Map(
          readQueue<Item>(itemsKey).map((item) => [item.id, item]),
        );
        for (const item of [...this.queue, ...this.future])
          byId.set(item.id, item);
        queueStorage.setItem(itemsKey, JSON.stringify([...byId.values()]));
        queueStorage.setItem(
          seenKey,
          JSON.stringify({ ...readSeen(seenKey), ...this.seen }),
        );
      });
    });
  }
}

async function repeatWhile<Value>(
  predicate: (value: Value | undefined) => boolean,
  operation: () => Promise<Value>,
): Promise<Value | undefined> {
  const iterate = async (value?: Value): Promise<Value | undefined> =>
    predicate(value) ? iterate(await operation()) : value;
  return iterate();
}
function mergeIntegrationSettings(
  defaults: IntegrationSettings,
  settings: { integrations?: Record<string, unknown> },
): Record<string, Record<string, unknown>> {
  const overrides = Object.fromEntries(
    Object.entries(settings.integrations ?? {}).map(([name, value]) => [
      name,
      typeof value === "object" && value != null ? value : {},
    ]),
  );
  return Object.fromEntries(
    Object.entries(defaults.integrations).map(([name, value]) => [
      name,
      { ...value, ...overrides[name] },
    ]),
  );
}
function recordIntegrationInvocation(
  stats: AnalyticsStats,
  detail: {
    didError?: boolean;
    integrationName: string;
    methodName: string;
    type: string;
  },
): void {
  stats.increment(
    `analytics_js.integration.invoke${detail.didError ? ".error" : ""}`,
    1,
    [
      `method:${detail.methodName}`,
      `integration_name:${detail.integrationName}`,
      `type:${detail.type}`,
    ],
  );
}

function initializeDeferred(): void {
  if (createDeferred != null) return;
  createDeferred = <Value>() => {
    let settled = false;
    let resolve!: (value: Value | PromiseLike<Value>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
      resolve = (value) => {
        settled = true;
        resolvePromise(value);
      };
      reject = (reason) => {
        settled = true;
        rejectPromise(reason);
      };
    });
    return { resolve, reject, promise, isSettled: () => settled };
  };
}
function initializeEventEmitter(): void {
  EventEmitterClass ??= TypedEventEmitter;
}
function initializeRetryQueue(): void {
  shared.p4();
  initializeEventEmitter();
}
function initializeMiddlewareHelpers(): void {
  shared.p4();
  middleware.l();
}
function initializeFetch(): void {
  initializeGlobalObject();
}
function initializeGlobalObject(): void {}
function initializeVersion(): void {}
function initializeDistribution(): void {}
function initializeRemoteHost(): void {}
function initializeRemoteMetrics(): void {
  shared.p4();
  initializeFetch();
  initializeVersion();
  initializeDistribution();
  initializeRemoteHost();
}
function initializeRemoteStats(): void {
  shared.p4();
  middleware.d();
  initializeRemoteMetrics();
}
function initializeAnalyticsContext(): void {
  shared.p4();
  middleware.l();
  initializeRemoteStats();
}
function initializePersistedQueue(): void {
  shared.p4();
  initializeRetryQueue();
  initializeAnalyticsContext();
  try {
    queueStorage =
      canUseBrowserStorage() && window.localStorage
        ? window.localStorage
        : memoryStorage;
  } catch (error) {
    console.warn("Unable to access localStorage", error);
  }
}
function initializeRepeatWhile(): void {
  shared.p4();
}
function initializeIntegrationSettings(): void {
  shared.p4();
}
function initializeNoop(): void {}

export {
  RetryQueue as A,
  initializeGlobalObject as C,
  invokePluginOrCancel as D,
  invokePlugin as E,
  initializeDeferred as F,
  EventEmitterClass as M,
  initializeEventEmitter as N,
  initializeMiddlewareHelpers as O,
  createDeferred as P,
  initializeFetch as S,
  isOnline as T,
  initializeVersion as _,
  initializeRepeatWhile as a,
  initializeFetch as b,
  initializePersistedQueue as c,
  RemoteAwareStats as d,
  initializeRemoteStats as f,
  initializeDistribution as g,
  getDistribution as h,
  mergeIntegrationSettings as i,
  initializeRetryQueue as j,
  onRemoveFromFuture as k,
  AnalyticsContext as l,
  initializeRemoteHost as m,
  recordIntegrationInvocation as n,
  repeatWhile as o,
  remoteMetricHost as p,
  initializeIntegrationSettings as r,
  PersistedQueue as s,
  initializeNoop as t,
  initializeAnalyticsContext as u,
  analyticsVersion as v,
  isOffline as w,
  getGlobalObject as x,
  fetchRequest as y,
};
