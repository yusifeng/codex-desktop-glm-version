// mac 推送通知注册/注销（原版 56,404-56,479 区段）。
//
// 职责：
//   - registerPushNotifications（Cwe）：APNS token 注册——auth 头 + 认证
//     fetch POST `/notifications/subscription/register`，失败按 [1s, 5s]
//     退避重试（429/5xx），成功解析 {token} 并按 workspace/Fedramp 包装；
//   - deregisterPushNotifications（wwe）：POST
//     `/notifications/subscription/deregister/token`（workspace token 改写
//     backendOrigin + 账号路由头）。
//
// 本区域唯二 Electron API 使用点：`pushNotifications.registerForAPNSNotifications`
// 与 `net.fetch`。bootstrap 依赖：a.mt（认证头）/a.ht（authed fetch）/
// a.xt（endpoint URL）/a.rn（bundleIdentifier）/a.in（BuildFlavor）/
// a.gt（originator 头）。

import { setTimeout as delay } from "node:timers/promises";
import { pushNotifications, net } from "electron";
import { rf as z } from "@chunk/shared";
import {
  mt as applyAuthHeaders,
  ht as applyWorkspaceRouting,
  xt as backendApiUrl,
  rn as bundleIdentifier,
  in as BuildFlavor,
  gt as applyOriginatorHeaders,
} from "@chunk/bootstrap";

/** 注册失败重试延迟表（原 dw = [1s, 5s]，耗尽后抛出）。 */
const REGISTRATION_RETRY_DELAYS_MS = [1_000, 5_000];

/** 注册响应 schema：{ token: string | null }。 */
const registrationResponseSchema = z.object({ token: z.string().nullable() });

/**
 * 注册 mac 推送通知（原 Cwe）。流程：取后端认证（未登录抛错）→ 组头 →
 * 循环 { APNS 注册 → POST 注册接口 }；abort 信号穿透；异常按退避表重试。
 * 成功返回裸 token、`{token, isFedramp}` 或 workspace 包装（含
 * backendOrigin/账号路由）。
 */
export async function registerPushNotifications({
  appServerClient,
  desktopApiOptions,
}: {
  appServerClient: any;
  desktopApiOptions: any;
}) {
  let auth = await appServerClient.getBackendRequestAuth({ refreshToken: false });
  if (auth == null) throw Error(`Sign in to ChatGPT to register push notifications.`);
  let headers: Record<string, string> = { "Content-Type": `application/json` };
  applyAuthHeaders(headers, auth.token, desktopApiOptions);
  let requestUrl = applyWorkspaceRouting(
    backendApiUrl(desktopApiOptions, `/notifications/subscription/register`),
    headers,
    auth,
  );
  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      let apnsToken = await pushNotifications.registerForAPNSNotifications();
      auth.signal.throwIfAborted();
      response = await net.fetch(requestUrl, {
        method: `POST`,
        headers,
        signal: auth.signal,
        redirect: `error`,
        body: JSON.stringify({
          token: apnsToken,
          platform: `macos`,
          app: `chatgpt`,
          build: `prod`,
          bundle_id: bundleIdentifier(BuildFlavor.Prod),
        }),
      });
      auth.signal.throwIfAborted();
    } catch (error) {
      auth.signal.throwIfAborted();
      let retryDelay = REGISTRATION_RETRY_DELAYS_MS[attempt];
      if (retryDelay == null) throw error;
      await delay(retryDelay);
      continue;
    }
    if (response.ok) {
      let token = registrationResponseSchema.parse(await response.json()).token;
      return (
        auth.signal.throwIfAborted(),
        token != null && auth.routing.kind === `workspace`
          ? {
              kind: `workspace`,
              token,
              isFedramp: headers[`X-OpenAI-Fedramp`] === `true`,
              backendOrigin: auth.routing.workspace.backendOrigin,
              accountRoutingOverride: auth.routing.workspace.accountRoutingOverride,
            }
          : token != null && headers[`X-OpenAI-Fedramp`] === `true`
            ? { token, isFedramp: true }
            : token
      );
    }
    let retryDelay = REGISTRATION_RETRY_DELAYS_MS[attempt];
    if (retryDelay == null || (response.status !== 429 && response.status < 500))
      throw Error(`Failed to register push notifications (${response.status})`);
    await delay(retryDelay);
  }
}

/**
 * 注销推送通知（原 wwe）：deregistrationToken 为裸 token 字符串或
 * workspace/Fedramp 包装对象；workspace 时改写 backendOrigin 与账号路由头。
 */
export async function deregisterPushNotifications({
  deregistrationToken,
  desktopApiOptions,
}: {
  deregistrationToken: string | { token: string; isFedramp?: boolean; kind?: string; backendOrigin?: string; accountRoutingOverride?: string };
  desktopApiOptions: any;
}) {
  let headers: Record<string, string> = { "Content-Type": `application/json` };
  typeof deregistrationToken != `string` &&
    (deregistrationToken as any).isFedramp &&
    (headers[`X-OpenAI-Fedramp`] = `true`);
  applyOriginatorHeaders(headers, { desktopOriginator: desktopApiOptions.desktopOriginator });
  let url = backendApiUrl(desktopApiOptions, `/notifications/subscription/deregister/token`);
  if (typeof deregistrationToken != `string` && `kind` in deregistrationToken) {
    let parsed = new URL(url);
    url = `${(deregistrationToken as any).backendOrigin}${parsed.pathname}`;
    (deregistrationToken as any).accountRoutingOverride !== `NO_CONSTRAINT` &&
      (headers[`X-OpenAI-Account-Routing-Override`] = (deregistrationToken as any).accountRoutingOverride);
  }
  let response = await net.fetch(url, {
    method: `POST`,
    headers,
    redirect: `error`,
    body: JSON.stringify({
      token: typeof deregistrationToken == `string` ? deregistrationToken : (deregistrationToken as any).token,
    }),
  });
  if (!response.ok) throw Error(`Failed to deregister push notifications (${response.status})`);
}
