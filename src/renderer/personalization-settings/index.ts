// personalization-settings —— ChatGPT 个性化设置页（109KB / 2,273 行）。
//
// 原版：app/webview/assets/personalization-settings-c52a4963cfd3.js。
//
// 唯一导出：ChatGptPersonalizationSettings（原 `zr`）：
//   - 用户上下文（accountId）+ 个性化 flag（3466753652）门控
//   - codex.browser capability 判定（浏览器侧能力）
//   - about-you-summary（个人简介摘要）
//   - 记忆（memory）：memory-manager-gate 门控 + saved-memories 列表 +
//     manage/unavailable 文案 + host 副标题
//   - chronicle（Computer History）：chronicle-settings + service-queries
//   - 参考照片（referencePhotos.remove）+ 基础风格（baseStyle）
//   - agents 保存（save + save.success.host）+ updateError
//   - settings-host-dropdown + settings-loading-row + state
//
// 依赖：13 文件（9 个新登记）。

import { $3 as runtimeLazy } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as aboutYouSummary } from "@rchunk/about-you-summary";
import { default as chatgptUserContext } from "@rchunk/chatgpt-user-context";
import { default as chronicleServiceQueries } from "@rchunk/chronicle-service-queries";
import { default as chronicleSettings } from "@rchunk/chronicle-settings";
import { default as memoryManagerGate } from "@rchunk/memory-manager-gate";
import { default as savedMemories } from "@rchunk/saved-memories";
import { default as settingsHostDropdown } from "@rchunk/settings-host-dropdown";
import { default as settingsLoadingRow } from "@rchunk/settings-loading-row";
import { default as stateChunk } from "@rchunk/personalization-state";
import { default as virtualTryOn } from "@rchunk/virtual-try-on";

void runtimeLazy; void appInitialInit; void appPrimaryInit;
void aboutYouSummary; void chatgptUserContext; void chronicleServiceQueries;
void chronicleSettings; void memoryManagerGate; void savedMemories;
void settingsHostDropdown; void settingsLoadingRow; void stateChunk; void virtualTryOn;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 视图描述。 */
export interface PersonalizationViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

/**
 * ChatGptPersonalizationSettings（原 `zr`，唯一导出）：
 * accountId + 个性化 flag 双门控；记忆管理（gate + saved-memories）、
 * chronicle、参考照片、基础风格、agents 保存。
 */
export function ChatGptPersonalizationSettings(props: { accountId?: string | null; personalizationEnabled?: boolean }): PersonalizationViewNode | null {
  if (!(props.accountId != null && props.personalizationEnabled === true)) return null;
  return {
    kind: "chatgpt-personalization-settings",
    props: {
      accountId: props.accountId,
      sections: {
        aboutYouSummary: true,
        agents: true,
        baseStyle: true,
        chronicle: true,
        memory: true,
        referencePhotos: true,
      },
    },
  };
}
