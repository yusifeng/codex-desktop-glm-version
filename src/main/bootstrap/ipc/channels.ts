// 主进程 ↔ 渲染进程的 IPC 频道名常量表。
// 对应 bootstrap-C4dRql4x.ts 19739-19769 行（Tw~Yw 频道名、Gw 图标目录、
// Xw/Zw worker 频道构造）。值逐字保持原样（渲染侧按字面量匹配）。

/** 渲染 → 主（原 `Tw`）。 */
export const MESSAGE_FROM_VIEW = "codex_desktop:message-from-view";
/** 主 → 渲染（原 `Ew`）。 */
export const MESSAGE_FOR_VIEW = "codex_desktop:message-for-view";
/** 分块消息确认（原 `Dw`）。 */
export const CHUNKED_MESSAGE_ACK = "codex_desktop:chunked-message-ack";
/** 远程托管画中画视频帧（原 `Ow`）。 */
export const REMOTE_HOSTED_PIP_VIDEO_FRAME = "codex_desktop:remote-hosted-pip-video-frame";
/** 浏览器侧栏运行时消息（原 `kw`）。 */
export const BROWSER_SIDEBAR_RUNTIME_MESSAGE = "codex_desktop:browser-sidebar-runtime-message";
/** 浏览器页面事件（原 `Aw`）。 */
export const BROWSER_PAGE_EVENT = "codex_desktop:browser-page-event";
/** MCP app sandbox 访客消息（原 `jw`）。 */
export const MCP_APP_SANDBOX_GUEST_MESSAGE = "codex_desktop:mcp-app-sandbox-guest-message";
/** MCP app sandbox 宿主消息（原 `Mw`）。 */
export const MCP_APP_SANDBOX_HOST_MESSAGE = "codex_desktop:mcp-app-sandbox-host-message";
/** 显示上下文菜单（原 `Nw`）。 */
export const SHOW_CONTEXT_MENU = "codex_desktop:show-context-menu";
/** 读取 Sentry 初始化选项（原 `Pw`）。 */
export const GET_SENTRY_INIT_OPTIONS = "codex_desktop:get-sentry-init-options";
/** 读取 build flavor（原 `Fw`）。 */
export const GET_BUILD_FLAVOR = "codex_desktop:get-build-flavor";
/** 读取系统主题变体（原 `Iw`）。 */
export const GET_SYSTEM_THEME_VARIANT = "codex_desktop:get-system-theme-variant";
/** 读取共享对象快照（原 `Lw`）。 */
export const GET_SHARED_OBJECT_SNAPSHOT = "codex_desktop:get-shared-object-snapshot";
/** 读取侧栏初始引导数据（原 `Rw`）。 */
export const GET_INITIAL_SIDEBAR_BOOTSTRAP = "codex_desktop:get-initial-sidebar-bootstrap";
/** 读取 fast mode 灰度指标（原 `zw`）。 */
export const GET_FAST_MODE_ROLLOUT_METRICS = "codex_desktop:get-fast-mode-rollout-metrics";
/** 系统主题变体变化通知（原 `Bw`）。 */
export const SYSTEM_THEME_VARIANT_UPDATED = "codex_desktop:system-theme-variant-updated";
/** 触发 Sentry 测试事件（原 `Vw`）。 */
export const TRIGGER_SENTRY_TEST = "codex_desktop:trigger-sentry-test";
/** 连接 app host（原 `Hw`）。 */
export const CONNECT_APP_HOST = "codex_desktop:connect-app-host";
/** 发起文件拖拽（原 `Uw`）。 */
export const START_FILE_DRAG = "codex_desktop:start-file-drag";
/** 发起链接拖拽（原 `Ww`）。 */
export const START_LINK_DRAG = "codex_desktop:start-link-drag";

/** 图标目录名（原 `Gw`，协议处理器用）。 */
export const ICONS_DIRECTORY = "icons";

/** 更新检查 IPC 频道（SparkleManager 注册 handler 用；原字面量）。 */
export const CHECK_FOR_UPDATES = "codex_desktop:check-for-updates";

/** worker 进程渲染 → 主频道（原 `Xw`）。 */
export function workerMessageFromViewChannel(workerId: string): string {
  return `codex_desktop:worker:${workerId}:from-view`;
}

/** worker 进程主 → 渲染频道（原 `Zw`）。 */
export function workerMessageForViewChannel(workerId: string): string {
  return `codex_desktop:worker:${workerId}:for-view`;
}
