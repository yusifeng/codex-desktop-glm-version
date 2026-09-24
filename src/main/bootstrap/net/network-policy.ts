// 桌面网络策略：基于 app-server 上报的应用网络需求（域名 allow/deny 表）做
// session 级 webRequest 拦截与 fetch / request 门面。
// appSessionId（原 Ot）在模块加载时生成一次（顶层随机 UUID，随构建信息上报）。
// 对应 bootstrap-C4dRql4x.ts 3515-3734 行（Ot/kt/At/jt/Mt/Nt）。
import { randomUUID } from "node:crypto";
import { app, net, session } from "electron";
import type {
  ClientRequestConstructorOptions,
  OnBeforeRequestListenerDetails,
  Session,
} from "electron";
import {
  Ac as createDeferred, // Promise.withResolvers 等价物
  Qu as isValidSemver, // semver 可解析判定
  Zu as compareSemver, // semver 比较
  df as enumSchema,
  Ef as recordSchema,
  gf as booleanSchema,
  Of as stringSchema,
  wf as objectSchema,
} from "@chunk/shared";

// d.ts 只给 schema 构造器声明了 safeParse；这里按 zod 风格链式调用，放宽为 any。
const s = {
  string: stringSchema as () => any,
  object: objectSchema as (shape: Record<string, any>) => any,
  boolean: booleanSchema as () => any,
  record: recordSchema as (key: any, value: any) => any,
  enum: enumSchema as (values: readonly string[]) => any,
};

/** 应用网络会话 id（原 Ot）：模块加载时生成一次。 */
export const appSessionId: string = randomUUID();

/** 暴露应用网络需求所需的最小 app-server 版本（原 kt）。 */
const MIN_APP_SERVER_VERSION_WITH_REQUIREMENTS = "0.154.0-alpha.1";

/** app-server 上报的应用网络需求 schema（原 At）。 */
const networkRequirementsSchema: any = s.object({
  requirements: s
    .object({
      application: s
        .object({
          network: s
            .object({
              enabled: s.boolean(),
              domains: s.record(
                s
                  .string()
                  .max(253)
                  .regex(
                    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
                  ),
                s.enum(["allow", "deny"]),
              ),
            })
            .nullable(),
        })
        .nullable()
        .optional(),
    })
    .nullable(),
});

export interface RestrictedNetworkPolicyDescriptor {
  kind: "restricted";
  allowedDomains: Set<string>;
}

export interface UnrestrictedNetworkPolicyDescriptor {
  kind: "unrestricted";
}

export type NetworkPolicyDescriptor =
  | RestrictedNetworkPolicyDescriptor
  | UnrestrictedNetworkPolicyDescriptor;

/**
 * 校验并归一化应用网络需求（原 jt）。
 * schema 不合法抛错；requirements 缺 application 字段且 app-server 版本不在
 * [0.141.0, 0.154.0-alpha.1) 的「已知不暴露需求的版本区间」内时也抛错。
 * network.enabled !== true 时视为 unrestricted。
 */
export function resolveNetworkPolicyDescriptor(
  appServerVersion: string | null | undefined,
  requirements: unknown,
): NetworkPolicyDescriptor {
  const parsed = networkRequirementsSchema.safeParse(requirements);
  if (!parsed.success)
    throw Error(
      "Application network requirements are invalid or unavailable. Update the app server to a version that exposes application requirements.",
    );
  if (
    parsed.data.requirements != null &&
    parsed.data.requirements.application === undefined &&
    !(
      appServerVersion != null &&
      isValidSemver(appServerVersion) &&
      compareSemver(appServerVersion, "0.141.0") >= 0 &&
      compareSemver(appServerVersion, MIN_APP_SERVER_VERSION_WITH_REQUIREMENTS) < 0
    )
  )
    throw Error("This app server did not provide application network requirements.");
  const network = parsed.data.requirements?.application?.network;
  return network?.enabled === true
    ? {
        kind: "restricted",
        allowedDomains: new Set(
          Object.entries(network.domains)
            .filter(([, value]) => value === "allow")
            .map(([domain]) => domain),
        ),
      }
    : { kind: "unrestricted" };
}

const ALWAYS_ALLOWED_PROTOCOLS = ["app:", "codex-sandbox:", "data:", "blob:", "file:", "about:"];

/** URL 是否被策略允许（原 Mt）：本机协议放行；restricted 下仅 https/wss 白名单域名。 */
export function isUrlAllowedByPolicy(
  policy: NetworkPolicyDescriptor | null,
  urlOrString: string | URL,
): boolean {
  let url: URL;
  try {
    url = typeof urlOrString === "string" ? new URL(urlOrString) : urlOrString;
  } catch {
    return false;
  }
  if (ALWAYS_ALLOWED_PROTOCOLS.includes(url.protocol)) return true;
  if (policy == null) return false;
  return (
    policy.kind === "unrestricted" ||
    ((url.protocol === "https:" || url.protocol === "wss:") &&
      policy.allowedDomains.has(url.hostname.replace(/\.$/, "")))
  );
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

type NetworkPolicyState =
  | { kind: "loading"; ready: Deferred<void> }
  | { kind: "ready"; policy: NetworkPolicyDescriptor }
  | { kind: "failed"; error: Error };

/** 暴露应用网络需求的客户端（startup config 客户端，@chunk/shared 的 n.o 实例）。 */
export interface NetworkRequirementsClient {
  appServerVersion?: string | null;
  getConfigRequirements(): Promise<unknown>;
  registerInternalNotificationHandler(
    handler: (notification: { method?: string }) => void,
  ): () => void;
  registerInternalConnectionStateHandler(handler: (state: string) => void): () => void;
  getConnectionState(): string | undefined;
}

export type SessionRestriction = (details: OnBeforeRequestListenerDetails) => {
  cancel?: boolean;
  redirectURL?: string;
};

/**
 * 桌面网络策略（原 Nt）：session 级 webRequest 拦截 + fetch / request 门面。
 * 通过 observeRequirements 监听 app-server 连接状态并刷新需求；刷新期间
 * state 处于 loading（whenReady 等待）；generation 机制丢弃过期的异步结果。
 */
export class NetworkPolicy {
  devRendererOrigin: string | null;
  state: NetworkPolicyState = { kind: "loading", ready: createDeferred() };
  generation = 0;
  disposed = false;
  restrictions = new Map<Session, Set<SessionRestriction>>();
  sessionsObserved = false;
  onSessionCreated = (session: Session) => this.applyToSession(session);

  constructor(devRendererOrigin: string | null) {
    this.devRendererOrigin = devRendererOrigin;
  }

  /** 监听后续创建的所有 session 并对默认 session 生效（幂等）。 */
  observeSessions(): void {
    if (this.sessionsObserved || this.disposed) return;
    this.sessionsObserved = true;
    app.on("session-created", this.onSessionCreated);
    if (app.isReady()) this.applyToSession(session.defaultSession);
    else
      app.whenReady().then(() => {
        if (!this.disposed) this.applyToSession(session.defaultSession);
      });
  }

  /**
   * 监听 app-server 需求变化（原 observeRequirements）：
   * 账号更新 / 重连时刷新需求，断开时使当前策略失效。
   * 返回取消监听函数。
   */
  observeRequirements(
    client: NetworkRequirementsClient,
    onError: (error: unknown) => void,
    onRetry?: (error: unknown, isCurrent: () => boolean) => Promise<"stop" | void> | "stop" | void,
  ): () => void {
    const refresh = () => {
      this.refreshRequirements(client.appServerVersion, () => client.getConfigRequirements(), onRetry).catch(
        onError,
      );
    };
    const removeNotificationHandler = client.registerInternalNotificationHandler((notification) => {
      if (notification.method === "account/updated") refresh();
    });
    const removeConnectionStateHandler = client.registerInternalConnectionStateHandler((state) => {
      if (state === "connected") refresh();
      else this.invalidate();
    });
    if (client.getConnectionState() === "connected") refresh();
    return () => {
      removeNotificationHandler();
      removeConnectionStateHandler();
      this.generation += 1;
    };
  }

  /** 等待需求加载完成；加载失败时抛出错误。 */
  async whenReady(): Promise<void> {
    while (this.state.kind === "loading") await this.state.ready.promise;
    if (this.state.kind === "failed") throw this.state.error;
  }

  /**
   * 拉取并应用应用网络需求（原 refreshRequirements）。
   * onRetry 在首次拉取失败时调用，返回 "stop" 或已过期则放弃本次刷新。
   */
  async refreshRequirements(
    appServerVersion: string | null | undefined,
    getConfigRequirements: () => Promise<unknown>,
    onRetry?: (error: unknown, isCurrent: () => boolean) => Promise<"stop" | void> | "stop" | void,
  ): Promise<void> {
    this.invalidate();
    const generation = this.generation;
    const isCurrent = () => !this.disposed && generation === this.generation;
    try {
      let requirements: unknown;
      try {
        requirements = await getConfigRequirements();
      } catch (error) {
        if (!isCurrent()) return;
        if (onRetry == null) throw error;
        if ((await onRetry(error, isCurrent)) === "stop" || !isCurrent()) return;
        requirements = await getConfigRequirements();
      }
      if (!isCurrent()) return;
      const policy = resolveNetworkPolicyDescriptor(appServerVersion, requirements);
      if (policy.kind === "restricted")
        throw Error("Restricted Desktop networking is not available in this runtime.");
      const previous = this.state;
      this.state = { kind: "ready", policy };
      if (previous.kind === "loading") previous.ready.resolve(undefined);
    } catch (error) {
      if (this.disposed || generation !== this.generation) return;
      const normalized =
        error instanceof Error ? error : Error("Application network requirements could not be loaded.");
      const previous = this.state;
      this.state = { kind: "failed", error: normalized };
      if (previous.kind === "loading") previous.ready.resolve(undefined);
      throw normalized;
    }
  }

  /** 目标（URL / URL 字符串）是否被当前策略允许。 */
  allows(urlOrInput: string | URL): boolean {
    const parsed = URL.parse(typeof urlOrInput === "string" ? urlOrInput : urlOrInput.href);
    return this.disposed || parsed == null
      ? false
      : (this.devRendererOrigin != null && parsed.origin === this.devRendererOrigin) ||
          isUrlAllowedByPolicy(this.state.kind === "ready" ? this.state.policy : null, parsed);
  }

  assertAllowed(url: string | URL): void {
    if (!this.allows(url))
      throw Error("Desktop network policy does not allow this destination");
  }

  /** fetch 门面：先做策略校验，再转发给 electron net.fetch。 */
  async fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    const target = typeof input === "string" || input instanceof URL ? input : input.url;
    this.assertAllowed(target);
    const request = input instanceof URL ? input.href : input;
    return net.fetch(request, init);
  }

  /** ClientRequest 门面：先做策略校验，再转发给 electron net.request。 */
  request(options: ClientRequestConstructorOptions & { url: string }): ReturnType<typeof net.request> {
    this.assertAllowed(options.url);
    return net.request(options);
  }

  /** 给 session 追加一条请求限制；返回移除函数（原 addSessionRestriction）。 */
  addSessionRestriction(session: Session, restriction: SessionRestriction): () => void {
    this.applyToSession(session);
    const existing = this.restrictions.get(session);
    existing?.add(restriction);
    return () => {
      existing?.delete(restriction);
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.invalidate();
    this.disposed = true;
    const previous = this.state;
    this.state = { kind: "failed", error: Error("Application network disposed") };
    if (previous.kind === "loading") previous.ready.resolve(undefined);
    app.removeListener("session-created", this.onSessionCreated);
    for (const restrictedSession of this.restrictions.keys())
      restrictedSession.webRequest.onBeforeRequest((_details, callback) => callback({ cancel: true }));
    this.restrictions.clear();
  }

  /** 使当前策略失效（回到 loading）；下次刷新前所有远端请求被拒绝。 */
  invalidate(): void {
    this.generation += 1;
    if (!this.disposed && this.state.kind !== "loading")
      this.state = { kind: "loading", ready: createDeferred() };
  }

  /** 在 session 上安装 webRequest 拦截（幂等；应用策略 + 逐条 session 限制）。 */
  applyToSession(session: Session): void {
    if (this.restrictions.has(session) || this.disposed) return;
    const sessionRestrictions = new Set<SessionRestriction>();
    this.restrictions.set(session, sessionRestrictions);
    session.webRequest.onBeforeRequest((details, callback) => {
      if (!this.allows(details.url)) {
        callback({ cancel: true });
        return;
      }
      let redirectURL: string | undefined;
      for (const restriction of sessionRestrictions) {
        const result = restriction(details);
        if (result.cancel || (result.redirectURL != null && !this.allows(result.redirectURL))) {
          callback({ cancel: true });
          return;
        }
        redirectURL = result.redirectURL ?? redirectURL;
      }
      callback({ cancel: false, redirectURL });
    });
  }
}
