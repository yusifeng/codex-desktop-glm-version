// general-settings —— 通用设置页（175KB / 4,134 行）。
//
// 原版：app/webview/assets/general-settings-3d550f75d0eb.js。
//
// 六个导出（压缩名 → 语义，全部经原文核实）：
//   - a（fs，L2949）：HotkeyWindowSettings —— 热键窗口设置区（快捷键表；
//     无热键时 null）
//   - i（is，L2644）：ImportSettingsSection —— 外部 Agent 导入设置区
//     （import-settings-gate 门控）
//   - n（ds，L2894）：ConversationDetailSettings —— 会话详情级设置区
//     （STEPS_COMMANDS 判定 + 27 号 memo-cache）
//   - o（ec，L4109）：主初始化器（70+ 依赖装配 + 三主题预览色
//     {dark #5d5d5d, light #f3f3f3, system 渐变} + PowerShell/
//     CommandPrompt/GitBash/WSL 终端枚举 + has-used-legacy-wsl-agent-
//     environment flag + useFontSmoothing/usePointerCursors hooks）
//   - r（Gs，L4086）：EnterBehaviorLabel —— 回车行为文案（enter/
//     modEnter/cmdAlways 三分支，{modifierSymbol} 占位）
//   - t（Ss，L3224）：GeneralSettingsPage —— 设置页主体
//
// 设置区块（消息 id 前缀统计）：appearance（74 条：chrome 主题 accent/ink/
// surface/contrast/codeFontFamily/contentFontFamily/字体样式/导入导出/
// 半透明侧栏/系统字体）+ daybreak（8）+ projectless（7）+ experimental（4）+
// enter 行为（4）+ desktop（4）+ 通知/弹窗/Mac 菜单栏/电源/跟进队列等。
//
// 依赖：16 文件（9 个新登记：chatgpt-accent-messages/dock-icon-visibility/
// file-diff/import-settings-gate/middle-truncated-text/notifications-settings/
// permissions-mode-visibility/plugins-settings-row/settings-route-state）。

import { $3 as runtimeLazy } from "@rchunk/app-shared";
import { default as fileDiff } from "@rchunk/file-diff-alt";
import { default as chatgptAccentMessages } from "@rchunk/chatgpt-accent-messages";
import { default as dockIconSettingVisibility } from "@rchunk/dock-icon-setting-visibility";
import { default as importSettingsGate } from "@rchunk/import-settings-gate";
import { default as middleTruncatedText } from "@rchunk/middle-truncated-text";
import { default as notificationsSettings } from "@rchunk/notifications-settings";
import { default as permissionsModeVisibility } from "@rchunk/permissions-mode-visibility";
import { default as pluginsSettingsRow } from "@rchunk/plugins-settings-row";
import { default as settingsRouteState } from "@rchunk/settings-route-state";
import { default as themeFontFaceLoader } from "@rchunk/theme-font-face-loader";
import { default as themeFontFamily } from "@rchunk/theme-font-family";
import { default as triangleWarning } from "@rchunk/triangle-warning";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";

void runtimeLazy; void fileDiff; void chatgptAccentMessages;
void dockIconSettingVisibility; void importSettingsGate; void middleTruncatedText;
void notificationsSettings; void permissionsModeVisibility; void pluginsSettingsRow;
void settingsRouteState; void themeFontFaceLoader; void themeFontFamily;
void triangleWarning; void appInitialInit; void appPrimaryInit;

// ---------------------------------------------------------------------------
// 常量与类型
// ---------------------------------------------------------------------------

/** 主题预览色（原 `ec` 装配的 `$s`）。 */
const THEME_PREVIEW_COLORS = {
  dark: { background: "#5d5d5d" },
  light: { background: "#f3f3f3" },
  system: { background: "linear-gradient(90deg, #9f9f9f 0 50%, #5d5d5d 50% 100%)" },
} as const;

/** 终端枚举（原 `Ys`）。 */
const TERMINAL_OPTIONS = ["powershell", "commandPrompt", "gitBash", "wsl"] as const;

/** 主题选项（原 `Qs`）。 */
const THEME_OPTIONS = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

/** 视图描述。 */
export interface SettingsViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

/** 设置键面（与 app-shared settings-schema 的 desktop 组对齐）。 */
export interface GeneralSettingsSections {
  appearance: boolean;
  daybreak: boolean;
  enterBehavior: boolean;
  externalAgentImport: boolean;
  experimental: boolean;
  macMenuBar: boolean;
  notifications: boolean;
  popoutWindows: boolean;
  power: boolean;
  projectless: boolean;
}

// ---------------------------------------------------------------------------
// EnterBehaviorLabel（原 `Gs`，导出 r）
// ---------------------------------------------------------------------------

/**
 * 回车行为文案（原 `Gs`，导出 r）：
 * enter → "Enter sends" / modEnter → "{modifierSymbol} + Enter sends" /
 * cmdAlways → "{modifierSymbol} + Enter always"。
 */
function EnterBehaviorLabel(props: { behavior: string; modifierSymbol: string }): string {
  switch (props.behavior) {
    case "enter":
      return "Enter sends";
    case "modEnter":
      return `${props.modifierSymbol} + Enter sends`;
    case "cmdAlways":
      return `${props.modifierSymbol} + Enter always`;
  }
  return "";
}

// ---------------------------------------------------------------------------
// 各设置区组件
// ---------------------------------------------------------------------------

/** 热键窗口设置区（原 `fs`，导出 a）：无热键表时 null。 */
function HotkeyWindowSettings(): SettingsViewNode | null {
  return null;
}

/** 外部 Agent 导入设置区（原 `is`，导出 i）。 */
function ImportSettingsSection(): SettingsViewNode {
  return { kind: "settings-import-section" };
}

/** 会话详情级设置区（原 `ds`，导出 n；STEPS_COMMANDS 判定）。 */
function ConversationDetailSettings(): SettingsViewNode {
  return { kind: "settings-conversation-detail" };
}

/**
 * GeneralSettingsPage（原 `Ss`，导出 t）：
 * 外观（74 条消息：主题/字号/字体/对比度/chrome 主题编辑器 + 导入导出）+
 * 回车行为 + daybreak + projectless + 通知 + Mac 菜单栏 + 电源 + 跟进队列 +
 * 实验性。
 */
function GeneralSettingsPage(): SettingsViewNode {
  return {
    kind: "general-settings-page",
    props: {
      sections: {
        appearance: true,
        daybreak: true,
        enterBehavior: true,
        externalAgentImport: true,
        experimental: true,
        macMenuBar: true,
        notifications: true,
        popoutWindows: true,
        power: true,
        projectless: true,
      } satisfies GeneralSettingsSections,
      themeOptions: THEME_OPTIONS,
      themePreviewColors: THEME_PREVIEW_COLORS,
    },
  };
}

/** 主初始化器（原 `ec`，导出 o）。 */
function initializeGeneralSettings(): void {}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  HotkeyWindowSettings as a,
  ImportSettingsSection as i,
  ConversationDetailSettings as n,
  initializeGeneralSettings as o,
  EnterBehaviorLabel as r,
  GeneralSettingsPage as t,
};
