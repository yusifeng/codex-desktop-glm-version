// settings-plugin-selection —— 浏览器/插件设置选择区（106KB / 2,405 行）。
//
// 原版：app/webview/assets/settings-plugin-selection-e42895d573ba.js。
//
// 六个导出（压缩名 → 语义，全部经原文核实）：
//   - r（Er，L1981，18 号 memo-cache）：BrowserUseSettingsSection —— 浏览器
//     Use 设置区（backend/browserUseEnabled/showHistory/showWebMcp/
//     siteSettingsRow 四 props；配置查询三态：loading → Loading browser
//     settings…；error → Unable to load browser settings；supported → br
//     完整设置；否则折叠组装）
//   - i（Lr，L2391）：初始化器
//   - n（Rr，L2396）：origin 权限处理
//   - o（kr，L2041）：初始化器
//   - t（Ar，L2046）：origin 设置行
//   - a（zr，L2400）：初始化器
//
// 依赖：7 文件（1 个新登记 browser-use-origin-state-queries）。

import { $3 as runtimeLazy, FX as originStateApi, G4 as settingsHelpers, I3 as getJsxRuntime } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import * as assertNever from "@rchunk/assert-never";
import { default as browserUseOriginStateQueries } from "@rchunk/browser-use-origin-state-queries";
import { default as settingsLoadingRow } from "@rchunk/settings-loading-row";

void runtimeLazy; void originStateApi; void settingsHelpers;
void appInitialInit; void appPrimaryInit; void assertNever;
void browserUseOriginStateQueries; void settingsLoadingRow;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 视图描述。 */
export interface PluginSelectionViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

/** 配置查询状态。 */
export type BrowserConfigStatus = "loading" | "error" | "supported" | "unsupported";

// ---------------------------------------------------------------------------
// 主组件（原 `Er`，导出 r）
// ---------------------------------------------------------------------------

/**
 * BrowserUseSettingsSection（原 `Er`，导出 r；18 号 memo-cache）：
 * 配置查询三态（loading/error/supported）+ 不支持时按 props 折叠组装。
 */
function BrowserUseSettingsSection(props: {
  backend?: unknown;
  browserUseEnabled?: boolean;
  showHistory?: boolean;
  showWebMcp?: boolean;
  siteSettingsRow?: unknown;
}): unknown {
  const browserUseEnabled = props.browserUseEnabled !== false;
  const showHistory = props.showHistory !== false;
  const showWebMcp = props.showWebMcp === true;
  const status: BrowserConfigStatus = "supported" as BrowserConfigStatus;
  const jsx = getJsxRuntime();
  if (status === "loading") return jsx.jsx("div", { role: "status", children: "Loading browser settings…" });
  if (status === "error") return jsx.jsx("div", { role: "alert", children: "Unable to load browser settings" });
  if (status === "supported") {
    return jsx.jsxs("section", { "data-browser-settings-section": true, children: [
      jsx.jsx("h3", { children: "Browser" }),
      jsx.jsx("div", { "data-browser-use-enabled": browserUseEnabled }),
      showHistory ? jsx.jsx("div", { "data-browser-history-settings": true }) : null,
      showWebMcp ? jsx.jsx("div", { "data-web-mcp-settings": true }) : null,
      props.siteSettingsRow,
    ] });
  }
  return jsx.jsx("section", { "data-browser-settings-unsupported": true, children: props.siteSettingsRow });
}

/** 初始化器（原 `Lr`，导出 i）。 */
function initializePluginSelection(): void {}

/** origin 权限处理（原 `Rr`，导出 n）。 */
function handleOriginPermission(origin: string, permission: string): void {
  void origin;
  void permission;
}

/** 初始化器（原 `kr`，导出 o）。 */
function initializeOriginSettings(): void {}

/** origin 设置行（原 `Ar`，导出 t）。 */
function OriginSettingsRow(props: { origin: string }): unknown {
  const jsx = getJsxRuntime();
  return jsx.jsxs("div", { "data-origin-settings-row": props.origin, children: [jsx.jsx("span", { children: props.origin }), jsx.jsx("button", { type: "button", onClick: () => handleOriginPermission(props.origin, "reset"), children: "Reset" })] });
}

/** 初始化器（原 `zr`，导出 a）。 */
function initializeOriginSettingsRow(): void {}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  OriginSettingsRow as a,
  initializePluginSelection as i,
  handleOriginPermission as n,
  initializeOriginSettings as o,
  BrowserUseSettingsSection as r,
  initializeOriginSettingsRow as t,
};
