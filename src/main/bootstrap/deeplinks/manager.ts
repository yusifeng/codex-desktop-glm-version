// deep link 队列管理：单实例锁判定（原 Sk）+ deep link 管理器（原 Ck）。
// 管理器负责 open-url 事件 / argv / 协议注册 / 待处理队列 flush 的时序：
// app 就绪前入队，就绪后 flush（只消费队尾；sage backfill 场景复用已存在的主窗口）。
// 对应 bootstrap-C4dRql4x.ts 23836-23964 行（Sk/Ck）。
import type { App, BrowserWindow } from "electron";
import { getLogger } from "@chunk/logger";
import { Zo as errorToMessage } from "@chunk/shared"; // 未知错误 → message 字符串（内部符号 KE）
import { takePendingUrls } from "@chunk/desktop-open-path-queue";
import type { ErrorReporter } from "../telemetry/error-reporter";
import type { DeepLinkRoute } from "./parse";
import {
  computeDeepLinkSourceUrl,
  parseArgvRoutes,
  parseDeepLink,
  resolveProtocolScheme,
  sanitizeHttpUrl,
} from "./parse";

/** 单实例锁判定入参（原 Sk 入参结构）。 */
export interface SingleInstanceLockInput {
  isMacOS: boolean;
  isPackaged: boolean;
  hasExplicitUserDataPath?: boolean;
}

/**
 * 是否需要 requestSingleInstanceLock（原 Sk）：仅打包构建需要；macOS 由 OS
 * open-url 机制保证单实例（除非显式指定了 userData 路径），其余平台一律需要。
 */
export function needsSingleInstanceLock({
  isMacOS,
  isPackaged,
  hasExplicitUserDataPath = false,
}: SingleInstanceLockInput): boolean {
  return isPackaged ? !isMacOS || hasExplicitUserDataPath : false;
}

/** 待 flush 的 deep link 条目（原 Ck 内部队列元素）。 */
type PendingDeepLink =
  | { kind: "codexDeepLink"; route: DeepLinkRoute }
  | { kind: "httpUrl"; urlString: string };

/** createDeepLinkManager 入参（原 Ck 入参结构）。 */
export interface CreateDeepLinkManagerOptions {
  /** Electron app 实例。 */
  app: App;
  /** 是否 macOS（macOS 走 open-url 事件，其余平台走 argv）。 */
  isMacOS: boolean;
  /** 平台覆盖（默认 process.platform；仅影响 argv 解析分支，协议注册始终看 process.platform）。 */
  platform?: string;
  /** 确保主窗口可见并返回之（无窗口时返回 null/undefined）。 */
  ensurePrimaryWindowVisible(): Promise<BrowserWindow | null | undefined>;
  /** 获取已存在的主窗口（localConversation + browserActive=false 的 sage backfill 场景复用窗口）。 */
  getPrimaryWindow?(): BrowserWindow | null | undefined;
  /** 导航窗口到 deep link 路由。 */
  navigateToRoute(window: BrowserWindow, route: DeepLinkRoute): Promise<void> | void;
  /** 进程初始 argv。 */
  initialArgv: string[];
  /** 错误上报门面。 */
  errorReporter: ErrorReporter;
  /** OS deep link 归因回调（sourceUrl 为 undefined 表示不归因）。 */
  onDeepLinkReceived?(sourceUrl: string | undefined): void;
  /** 打开外部 http(s) URL。 */
  openHttpUrl?(window: BrowserWindow, urlString: string): Promise<void> | void;
}

/** deep link 管理器（原 Ck 返回结构）。 */
export interface DeepLinkManager {
  /** 注册默认协议客户端（Windows 由安装器注册，跳过）。 */
  registerProtocolClient(): void;
  /** 处理 second-instance argv；返回是否消费了任一 deep link / http URL。 */
  queueProcessArgs(argv: string[]): boolean;
  /** flush 待处理队列（app 就绪且能取得主窗口时消费队尾）。 */
  flushPendingDeepLinks(): Promise<void>;
  /** 解析并入队一个 codex deep link URL；返回是否解析成功。 */
  queueCodexDeepLinkUrl(url: string, hostId?: string | null): boolean;
}

/**
 * 创建 deep link 管理器（原 Ck）。
 * 创建时即处理初始 argv；macOS 上额外安装 open-url 监听并取走早期排队的 URL
 * （@chunk/desktop-open-path-queue 的 takePendingUrls）。
 */
export function createDeepLinkManager(options: CreateDeepLinkManagerOptions): DeepLinkManager {
  const {
    app,
    isMacOS,
    platform = process.platform,
    ensurePrimaryWindowVisible,
    getPrimaryWindow,
    navigateToRoute,
    initialArgv,
    errorReporter,
    onDeepLinkReceived,
    openHttpUrl,
  } = options;
  const pending: PendingDeepLink[] = [];
  const logger = getLogger();
  /** Windows 打包构建下允许裸 Windows 项目路径参数（原 y）。 */
  const allowBareWindowsProjectPathArg = app.isPackaged && !isMacOS;

  /** flush 待处理队列（原 h）：只消费队尾；await 期间新入队的条目留待下次 flush。 */
  async function flushPendingDeepLinks(): Promise<void> {
    if (pending.length === 0 || !app.isReady()) return;
    const head = pending.at(-1);
    const existing =
      head?.kind === "codexDeepLink" &&
      head.route.kind === "localConversation" &&
      head.route.browserActive === false
        ? getPrimaryWindow?.()
        : null;
    const window = existing ?? (await ensurePrimaryWindowVisible());
    if (!window) return;
    // 重新取队尾：await ensurePrimaryWindowVisible 期间队列可能增长。
    const last = pending.at(-1);
    pending.length = 0;
    if (last?.kind === "codexDeepLink") await navigateToRoute(window, last.route);
    else if (last?.kind === "httpUrl") await openHttpUrl?.(window, last.urlString);
  }

  /** codex 路由入队（原 g）；app 就绪时立即尝试 flush。 */
  function queueRoute(route: DeepLinkRoute): void {
    pending.push({ kind: "codexDeepLink", route });
    if (app.isReady())
      flushPendingDeepLinks().catch((error) => {
        errorReporter.reportNonFatal(error instanceof Error ? error : errorToMessage(error), {
          kind: "flush-pending-deep-links",
        });
      });
  }

  /** http(s) URL 入队（原 _）；app 就绪时立即尝试 flush。 */
  function queueHttpUrl(urlString: string): void {
    pending.push({ kind: "httpUrl", urlString });
    if (app.isReady())
      flushPendingDeepLinks().catch((error) => {
        errorReporter.reportNonFatal(error instanceof Error ? error : errorToMessage(error), {
          kind: "flush-pending-http-urls",
        });
      });
  }

  /** 解析并入队 codex deep link URL（原 v）；hostId 覆盖 localPluginDetail / localConversation 路由。 */
  function queueCodexDeepLinkUrl(url: string, hostId?: string | null): boolean {
    const route = parseDeepLink(url);
    if (!route) return false;
    queueRoute(
      hostId != null && (route.kind === "localPluginDetail" || route.kind === "localConversation")
        ? { ...route, hostId }
        : route,
    );
    return true;
  }

  /** Linux：末位参数若非 deep link 则视为外部 http URL（原 b）。 */
  function findLinuxTrailingHttpUrl(argv: string[]): string | null {
    if (platform !== "linux") return null;
    const last = argv.at(-1);
    return last == null || parseDeepLink(last) != null ? null : sanitizeHttpUrl(last);
  }

  /** Windows：自后向前找可外部打开的 http URL 并入队（原 x）。 */
  function queueWindowsTrailingHttpUrl(argv: string[]): boolean {
    if (platform !== "win32") return false;
    for (let index = argv.length - 1; index >= 0; --index) {
      const httpUrl = sanitizeHttpUrl(argv[index]);
      if (httpUrl != null) {
        queueHttpUrl(httpUrl);
        return true;
      }
    }
    return false;
  }

  /** 处理初始 argv（原 S）。 */
  function handleInitialArgv(argv: string[]): void {
    const entries = parseArgvRoutes(argv);
    const linuxHttpUrl = findLinuxTrailingHttpUrl(argv);
    const last = entries.at(-1);
    if (last?.isOsDeepLink && linuxHttpUrl == null) onDeepLinkReceived?.(last.sourceUrl);
    for (const entry of entries) queueRoute(entry.route);
    if (linuxHttpUrl == null) {
      if (entries.length === 0) queueWindowsTrailingHttpUrl(argv);
    } else queueHttpUrl(linuxHttpUrl);
  }

  /** 处理 second-instance argv（原 C）；返回是否消费了任一 deep link / http URL。 */
  function queueProcessArgs(argv: string[]): boolean {
    const entries = parseArgvRoutes(argv, { allowBareWindowsProjectPathArg });
    const linuxHttpUrl = findLinuxTrailingHttpUrl(argv);
    const last = entries.at(-1);
    if (last?.isOsDeepLink && linuxHttpUrl == null) onDeepLinkReceived?.(last.sourceUrl);
    for (const entry of entries) queueRoute(entry.route);
    if (linuxHttpUrl != null) queueHttpUrl(linuxHttpUrl);
    return linuxHttpUrl != null || entries.length > 0 || queueWindowsTrailingHttpUrl(argv);
  }

  /** 注册默认协议客户端（原 w）；Windows 由安装器负责注册，此处跳过。 */
  function registerProtocolClient(): void {
    if (process.platform === "win32") return;
    const scheme = resolveProtocolScheme(app.isPackaged);
    try {
      if (!app.setAsDefaultProtocolClient(scheme))
        logger.warning(`Failed to register ${scheme}:// protocol handler`, {
          safe: { isPackaged: app.isPackaged },
          sensitive: {},
        });
    } catch (error) {
      logger.warning(`Failed to register ${scheme}:// protocol handler`, {
        safe: {},
        sensitive: { error },
      });
    }
  }

  if (isMacOS) {
    const handleOpenUrl = (url: string, event?: { preventDefault(): void }) => {
      const route = parseDeepLink(url);
      if (route) {
        queueRoute(route);
        onDeepLinkReceived?.(computeDeepLinkSourceUrl(route, url));
        event?.preventDefault();
        return;
      }
      const httpUrl = sanitizeHttpUrl(url);
      if (httpUrl) {
        queueHttpUrl(httpUrl);
        event?.preventDefault();
      }
    };
    app.on("open-url", (event, url) => {
      handleOpenUrl(url, event);
    });
    for (const url of takePendingUrls()) handleOpenUrl(url);
  }

  handleInitialArgv(initialArgv);
  return {
    registerProtocolClient,
    queueProcessArgs,
    flushPendingDeepLinks,
    queueCodexDeepLinkUrl,
  };
}
