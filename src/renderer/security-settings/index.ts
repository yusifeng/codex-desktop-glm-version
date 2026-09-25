// security-settings —— ChatGPT 账号安全设置页（181KB / 3,745 行）。
//
// 原版：app/webview/assets/security-settings-2da2a3b205ab.js。
//
// 唯一导出：ChatGptSecuritySettings（原 `Da`）——无 accountId 时渲染空态 P，
// 否则 Oa 主组件（154 号 memo-cache）：
//   - MFA 查询（mfa_enabled_v2 + features 含 mfa 的双判定）+ SMS/Push 描述
//   - 活跃会话列表（sessions 查询 + 登出操作 mutation）
//   - 已连接应用（linkedApps 查询，staleTime 1 分钟 + 断开连接）
//   - 高级保护（advanced protection：enroll/disable 确认流——view=
//     advanced-protection + apm_disable_confirm=true 时追加 apm_account_id
//     查询参数守卫）
//   - 登录连接（loginConnections）+ 开发者模式（developerMode）+ lockdown
//     模式（settingsModal.lockdownMode）
//
// 依赖：11 文件（7 个新登记：browser/client/linked-app-logo/messages/
// shared 等——注意 browser-5e2e016ba055 与 shared-7f893c663492 是设置页
// 专属变体文件，与 app-shared 主体不同）。

import { $3 as runtimeLazy } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { default as browserVariant } from "@rchunk/security-browser";
import { default as clientVariant } from "@rchunk/security-client";
import { default as linkedAppLogo } from "@rchunk/linked-app-logo";
import { default as messagesChunk } from "@rchunk/security-messages";
import { default as sharedVariant } from "@rchunk/security-shared";
import { default as srcVariant } from "@rchunk/security-src";
import { default as tabs } from "@rchunk/security-tabs";
import { default as settingsRouteState } from "@rchunk/settings-route-state";
import { default as confirmation } from "@rchunk/confirmation";
import { default as historyChunk } from "@rchunk/history";
import { default as orderYubikeyDialog } from "@rchunk/order-yubikey-dialog";

void runtimeLazy; void appInitialInit;
void browserVariant; void clientVariant; void linkedAppLogo;
void messagesChunk; void sharedVariant; void srcVariant; void tabs;
void settingsRouteState; void confirmation; void historyChunk; void orderYubikeyDialog;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 视图描述。 */
export interface SecuritySettingsViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

/** MFA 状态。 */
export interface MfaStatus {
  mfa_enabled_v2?: boolean;
}

/** 活跃会话。 */
export interface ActiveSession {
  id: string;
  [key: string]: unknown;
}

/** 已连接应用。 */
export interface LinkedApp {
  id: string;
  name?: string;
  [key: string]: unknown;
}

/** 设置视图（URL search 参数形态）。 */
export interface SecuritySettingsView {
  view?: string;
  apm_disable_confirm?: string;
  apm_account_id?: string;
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

/**
 * ChatGptSecuritySettings（原 `Da`，唯一导出）：
 * accountId 缺失 → 空态；否则安全设置主装配。
 */
export function ChatGptSecuritySettings(props: { accountId?: string | null }): SecuritySettingsViewNode {
  if (props.accountId == null) return { kind: "security-settings-empty" };
  return {
    kind: "chatgpt-security-settings",
    props: {
      accountId: props.accountId,
      sections: {
        activeSessions: true,
        advancedProtection: true,
        developerMode: true,
        linkedApps: true,
        loginConnections: true,
        lockdownMode: true,
        mfa: true,
      },
      queries: {
        linkedApps: { staleTime: 60_000 },
        mfa: { refetchOnMount: true },
      },
      advancedProtectionGuard: {
        // view=advanced-protection + apm_disable_confirm=true 且尚无
        // apm_account_id 时，经 token 校验后追加查询参数（replace 导航）
        requiredView: "advanced-protection",
        confirmParam: "apm_disable_confirm",
        accountIdParam: "apm_account_id",
      },
    },
  };
}
