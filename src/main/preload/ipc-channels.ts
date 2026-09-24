// 主进程 ↔ 渲染进程的 IPC 通道名。
//
// 布局约定：
//   codex_desktop:<功能>                 通用通道
//   codex_desktop:worker:<名>:from-view  渲染进程 → 某 worker 线程
//   codex_desktop:worker:<名>:for-view   某 worker 线程 → 渲染进程

export const ACK_CHUNKED_MESSAGE = "codex_desktop:chunked-message-ack";
export const REMOTE_HOSTED_PIP_VIDEO_FRAME = "codex_desktop:remote-hosted-pip-video-frame";
export const MCP_APP_SANDBOX_HOST_MESSAGE = "codex_desktop:mcp-app-sandbox-host-message";
export const SHOW_CONTEXT_MENU = "codex_desktop:show-context-menu";
export const GET_SENTRY_INIT_OPTIONS = "codex_desktop:get-sentry-init-options";
export const GET_BUILD_FLAVOR = "codex_desktop:get-build-flavor";
export const GET_SYSTEM_THEME_VARIANT = "codex_desktop:get-system-theme-variant";
export const GET_INITIAL_SIDEBAR_BOOTSTRAP = "codex_desktop:get-initial-sidebar-bootstrap";
export const GET_FAST_MODE_ROLLOUT_METRICS = "codex_desktop:get-fast-mode-rollout-metrics";
export const SYSTEM_THEME_VARIANT_UPDATED = "codex_desktop:system-theme-variant-updated";
export const TRIGGER_SENTRY_TEST = "codex_desktop:trigger-sentry-test";
export const CONNECT_APP_HOST = "codex_desktop:connect-app-host";
export const START_FILE_DRAG = "codex_desktop:start-file-drag";
export const START_LINK_DRAG = "codex_desktop:start-link-drag";
export const MESSAGE_FROM_VIEW = "codex_desktop:message-from-view";
export const MESSAGE_FOR_VIEW = "codex_desktop:message-for-view";

export function workerFromViewChannel(workerName: string): string {
  return `codex_desktop:worker:${workerName}:from-view`;
}

export function workerForViewChannel(workerName: string): string {
  return `codex_desktop:worker:${workerName}:for-view`;
}
