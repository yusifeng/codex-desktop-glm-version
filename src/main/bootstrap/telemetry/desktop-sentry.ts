// Desktop Sentry 初始化（bootstrap 19124-19253 行重写）。
//
// kC→initDesktopSentry 是唯一的初始化入口：analytics 关闭时直接 resolve ready
// promise（false）并返回；开启时先清理过大的 scope 持久化文件，再调 vendored
// @sentry/electron 的 init（QS），transport 走应用网络策略（fetch），并按 build
// flavor 决定 minidump 附件采样。默认集成列表做了应用定制过滤（见 initDesktopSentry）。
//
// 注意：SENTRY_STARTUP_CONFIG（原始 OC）在**模块加载时**求值（读 build flavor、
// build number、app 版本、session id），保持顶层 const 不动。
import { statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { app } from "electron";
import { Bu as normalizeAppVersion } from "@chunk/shared";
import {
  DS as makeOfflineStoreTransport,
  Gf as setSentryTag,
  Hf as captureSentryException,
  Ix as childProcessIntegration,
  Kf as setSentryUser,
  Lp as makePromiseTransport,
  QS as sentryElectronInit,
  Rm as addSentryBreadcrumb,
  Uf as captureSentryMessage,
  fb as SentryIpcMode,
  mx as sentryMinidumpIntegration,
  wh as consoleIntegration,
  xh as rewriteFramesIntegration,
} from "../vendor";
import type { NetworkPolicy } from "../net/network-policy";
import { appSessionId } from "../net/network-policy";
import { BuildFlavor } from "../build-info/build-flavor";
import { BuildNumber } from "../build-info/build-number";
import { SENTRY_DSN, sentryReleaseName, truncateBreadcrumb } from "./breadcrumb-truncation";
import { makeMinidumpBeforeSend } from "./owl-crash-counter";

const gzipBuffer = promisify(gzip);

/** 生产构建下 minidump 附件上传的采样率（原始 CC）。 */
const MINIDUMP_UPLOAD_SAMPLE_RATE = 0.001;
/** scope 持久化文件超过该字节数时删除（原始 wC，2 MiB）。 */
const MAX_SCOPE_STATE_BYTES = 2097152;
/** Sentry envelope gzip 压缩阈值（字节）。 */
const GZIP_THRESHOLD_BYTES = 32768;

// ---- Sentry ready 状态（原始 TC/EC）----
const sentryReadyResolvers = Promise.withResolvers<boolean>();
/** Sentry 初始化完成后 resolve（true=已启用，false=analytics 关闭）。 */
export const sentryReady: Promise<boolean> = sentryReadyResolvers.promise;

/**
 * captureException 等门面（原始 DC）。初始化前这些 vendored 函数是空实现，
 * sentryElectronInit 之后由全局 client 接管——对象引用保持不变。
 */
export const desktopSentry = {
  addBreadcrumb: addSentryBreadcrumb,
  captureException: captureSentryException,
  captureMessage: captureSentryMessage,
  setUser: setSentryUser,
};

/**
 * Sentry 启动配置快照（原始 OC）。
 *
 * **模块加载即求值**：读 appSessionId、build flavor、build number、app 版本和
 * CODEX_OTEL_TRACES_ENDPOINT 环境变量。拆分后必须保持顶层求值（供 initDesktopSentry
 * 与 setupDesktopTracing 消费）。
 */
export const SENTRY_STARTUP_CONFIG = {
  codexAppSessionId: appSessionId,
  buildFlavor: BuildFlavor.resolve(),
  buildNumber: BuildNumber.value,
  appVersion: app.getVersion(),
  desktopTraceSampleRate: process.env.CODEX_OTEL_TRACES_ENDPOINT == null ? 0 : 1,
  dsn: SENTRY_DSN,
};

/**
 * 构造走应用网络策略的 Sentry fetch transport（原始 SC）。
 *
 * 返回 transport 工厂：envelope 大于 32 KiB 时 gzip 压缩；等待 app ready 后用
 * networkPolicy.fetch POST 出去，10 秒超时，禁止重定向。
 */
export function createFetchTransport(networkPolicy: NetworkPolicy) {
  return (request: any) =>
    makePromiseTransport(request, async ({ body }: { body: any }) => {
      await app.whenReady();
      const shouldCompress = body.length > GZIP_THRESHOLD_BYTES;
      const payload = shouldCompress ? await gzipBuffer(body) : body;
      const response = await networkPolicy.fetch(request.url, {
        method: `POST`,
        headers: {
          ...request.headers,
          "Content-Type": `application/x-sentry-envelope`,
          ...(shouldCompress ? { "Content-Encoding": `gzip` } : {}),
        },
        body: typeof payload == `string` ? payload : new Uint8Array(payload),
        redirect: `error`,
        signal: AbortSignal.timeout(1e4),
      });
      await response.body?.cancel();
      return {
        statusCode: response.status,
        headers: {
          "retry-after": response.headers.get(`retry-after`),
          "x-sentry-rate-limits": response.headers.get(`x-sentry-rate-limits`),
        },
      };
    });
}

/**
 * 初始化 desktop Sentry（原始 kC）。
 *
 * analyticsEnabled 为 false 时只把 ready promise resolve 成 false。否则：
 *  - 清理过大的 scope_v3.json；
 *  - 生产构建按 0.1% 采样决定 minidump 附件上传（预算 1，否则 0），非生产全量；
 *  - 调 vendored @sentry/electron init（ipcMode=Classic、transport 走网络策略 +
 *    offline store、beforeBreadcrumb 截断、beforeSend 读 minidump sidecar）；
 *  - **默认集成定制**（应用逻辑，必须精确保留）：去掉 vendored init 默认列表里的
 *    ChildProcess / Console / SentryMinidump / ElectronMinidump，换成自带组合——
 *    vendored SentryMinidump（mx）、按应用裁剪的 ChildProcess（Ix）、只收 warn/error
 *    的 Console（wh）、以 app:/// 为前缀的 RewriteFrames（xh）。
 */
export function initDesktopSentry(analyticsEnabled: boolean, networkPolicy: NetworkPolicy): void {
  if (!analyticsEnabled) {
    sentryReadyResolvers.resolve(false);
    return;
  }
  pruneOversizedScopeState();
  const versionInfo = normalizeAppVersion(SENTRY_STARTUP_CONFIG.appVersion);
  const isProd = SENTRY_STARTUP_CONFIG.buildFlavor === BuildFlavor.Prod;
  const isPreRelease = !isProd;
  const minidumpUploadEnabled = !isProd || Math.random() < MINIDUMP_UPLOAD_SAMPLE_RATE;
  let minidumpAttachmentBudget: number | undefined;
  if (isProd) minidumpAttachmentBudget = minidumpUploadEnabled ? 1 : 0;
  const release = sentryReleaseName(versionInfo.version);
  sentryElectronInit({
    ipcMode: SentryIpcMode.Classic,
    dsn: SENTRY_STARTUP_CONFIG.dsn,
    transport: makeOfflineStoreTransport(createFetchTransport(networkPolicy)),
    environment: SENTRY_STARTUP_CONFIG.buildFlavor,
    release,
    dist: SENTRY_STARTUP_CONFIG.buildNumber ?? void 0,
    beforeBreadcrumb: truncateBreadcrumb,
    beforeSend: makeMinidumpBeforeSend({ app, maxMinidumpAttachments: minidumpAttachmentBudget }),
    tracesSampleRate: 0,
    integrations: (defaultIntegrations: { name: string }[]) => [
      ...defaultIntegrations.filter(
        ({ name }) =>
          name !== `ChildProcess` &&
          name !== `Console` &&
          name !== `SentryMinidump` &&
          name !== `ElectronMinidump`,
      ),
      sentryMinidumpIntegration(),
      childProcessIntegration({
        breadcrumbs: [
          `clean-exit`,
          `abnormal-exit`,
          `killed`,
          `crashed`,
          `oom`,
          `integrity-failure`,
        ],
        events: [`abnormal-exit`, `integrity-failure`],
      }),
      consoleIntegration({ levels: [`warn`, `error`] }),
      rewriteFramesIntegration({
        root: app.isPackaged ? app.getAppPath() : process.cwd(),
        prefix: `app:///`,
      }),
    ],
  });
  setSentryTag(`sessionId`, appSessionId);
  setSentryTag(`preRelease`, isPreRelease);
  setSentryTag(`minidumpAttachmentUploadEnabled`, minidumpUploadEnabled);
  setSentryTag(`buildFlavor`, SENTRY_STARTUP_CONFIG.buildFlavor);
  setSentryTag(`bundle`, `electron`);
  setSentryTag(`host`, `app`);
  installLaunchFailureReporting();
  sentryReadyResolvers.resolve(true);
}

/** userData/sentry/scope_v3.json 超过 2 MiB 时删除（原始 AC），失败静默。 */
function pruneOversizedScopeState(): void {
  const scopePath = join(app.getPath(`userData`), `sentry`, `scope_v3.json`);
  try {
    statSync(scopePath).size > MAX_SCOPE_STATE_BYTES && unlinkSync(scopePath);
  } catch {}
}

/**
 * 上报 Electron 子进程/渲染进程启动失败（原始 jC）。
 *
 * reason=launch-failed 的事件按 (类型, 名称, 退出码) 去重后以 fatal 级别
 * captureMessage。在 initDesktopSentry 末尾安装。
 */
function installLaunchFailureReporting(): void {
  const reported = new Set<string>();
  function report(processType: string, name: string, exitCode: number | null): void {
    const fingerprint = [`launch-failed`, processType, name, String(exitCode)];
    const key = fingerprint.join(`\0`);
    if (reported.has(key)) return;
    reported.add(key);
    captureSentryMessage(`Electron process launch failed`, {
      fingerprint,
      level: `fatal`,
      tags: {
        "event.process": processType,
        "exit.code": exitCode,
        "exit.reason": `launch-failed`,
        "process.name": name,
      },
    });
  }
  app.on(`child-process-gone`, (_event, details) => {
    if (details.reason === `launch-failed`)
      report(details.type, details.serviceName ?? details.name ?? details.type, details.exitCode);
  });
  app.on(`render-process-gone`, (_event, webContents, details) => {
    if (details.reason === `launch-failed`) report(`renderer`, webContents.getType(), details.exitCode);
  });
}
