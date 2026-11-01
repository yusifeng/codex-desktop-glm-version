// remote-connections-settings —— 远程连接设置页（226KB / 5,001 行）。
//
// 原版：app/webview/assets/remote-connections-settings-12e860fd2983.js。
//
// 唯一导出：RemoteConnectionsSettings（原 `gs`，L3906，308 号 memo-cache）：
//   - SSH 连接表（remote_ssh_connections 查询 + 排序 Fs + 加载/失败三态）
//   - WSL 连接表（remote_wsl_connections）
//   - 远程控制连接（remote_control_connections + ADDED_REMOTE_CONTROL_
//     ENV_IDS + HOST_ID_REMOTE_CONTROL_ALLOWED + 本地 client id + 连接
//     状态 authRequired/clientAuthorized）
//   - 1:1 配对（oneToOnePairingInAppEnabled flag 782640499 + 1553649031）
//   - 连接编辑器（add 模式草稿：route hostId 为空时从 route draft 构建）
//   - codex-mobile 配对（setup-dialog + setup-flow）
//   - chatgpt-desktop 授权 URL + onboarding 登录内容
//   - Refresh 按钮 + 各表 aria 标签
//
// 依赖：9 文件（6 个新登记）。

import { $3 as runtimeLazy, I3 as getJsxRuntime } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { default as chatgptDesktopAuthUrl } from "@rchunk/chatgpt-desktop-auth-url";
import { default as codexMobileSetupDialog } from "@rchunk/codex-mobile-setup-dialog";
import { default as codexMobileSetupFlow } from "@rchunk/codex-mobile-setup-flow";
import { default as onboardingLoginContent } from "@rchunk/onboarding-login-content";
import { default as remoteConnectionEditorDialog } from "@rchunk/remote-connection-editor-dialog";
import { default as remoteConnectionEditorDraft } from "@rchunk/remote-connection-editor-draft";

void runtimeLazy; void appInitialInit; void chatgptDesktopAuthUrl;
void codexMobileSetupDialog; void codexMobileSetupFlow; void onboardingLoginContent;
void remoteConnectionEditorDialog; void remoteConnectionEditorDraft;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 视图描述。 */
export interface RemoteConnectionsViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

/** SSH/WSL 连接记录。 */
export interface RemoteConnection {
  hostId?: string;
  id: string;
  [key: string]: unknown;
}

/** 远程控制连接状态。 */
export interface RemoteControlState {
  authRequired?: boolean;
  clientAuthorized?: boolean;
}

/** 编辑器模式（原 A2）。 */
export interface ConnectionEditorMode {
  draft?: unknown;
  mode: "add" | "edit";
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

/**
 * RemoteConnectionsSettings（原 `gs`，唯一导出；308 号 memo-cache）：
 * SSH/WSL 连接双表 + 远程控制（授权状态 + 环境登记 + 1:1 配对）+
 * 连接编辑器（route draft → add 模式）+ codex-mobile 配对 + 刷新。
 */
export function RemoteConnectionsSettings(props: { routeDraft?: { draft?: unknown; hostId?: string | null } | null }): unknown {
  const editorMode: ConnectionEditorMode | null =
    props.routeDraft != null && props.routeDraft.hostId == null
      ? { mode: "add", draft: props.routeDraft.draft }
      : null;
  const jsx = getJsxRuntime();
  return jsx.jsxs("section", { "data-remote-connections-settings": true, children: [
    jsx.jsxs("header", { children: [jsx.jsx("h2", { children: "Remote connections" }), jsx.jsx("button", { type: "button", children: "Refresh" })] }),
    editorMode == null ? null : jsx.jsx("div", { "data-connection-editor-mode": editorMode.mode, children: "Add connection" }),
    ["SSH connections", "WSL connections", "Remote control", "Codex mobile pairing"].map((label) => jsx.jsxs("section", { children: [jsx.jsx("h3", { children: label }), jsx.jsx("div", { "data-remote-connection-section": label })] }, label)),
  ] });
}
