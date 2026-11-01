// codex-micro-settings —— Codex Micro 实体键盘设置页（156KB / 3,550 行）。
//
// 原版：app/webview/assets/codex-micro-settings-cbf47e1d3359.js。
//
// 唯一导出：CodexMicroSettings（原 `ai`）——无 codexMicro 服务时 null，
// 否则 oi 主组件（180 号 memo-cache）。
//
// 设置区块（消息 id 前缀统计，共 ~211 条）：
//   - keycaps（37）：键帽编辑（键位/标签/模拟动作标题）
//   - analog（28）：模拟旋钮/摇杆动作
//   - editor（23）：动作编辑器（insertText 描述等）
//   - custom（20）：自定义键
//   - knob（19）：旋钮（knobTooltip）
//   - connection（19）：连接状态
//   - keyboard（16）：键盘布局（layout 预设 + 键盘面 surface）
//   - agent（13）：agent 键（agentSource 云/本地 + 单击直开）
//   - lighting（11）：灯光（亮度 + 自动关闭）
//   - microphone（9）：麦克风键（语音聊天/按键说话/拆分键）
//   - encoder（9）：编码器
//   - input（6）：输入
//   - battery/options：电池/选项
//
// 状态绑定（app-shared settings）：layout/agentSource/singleTapAgentKeys/
// lightingBrightness/lightingAutoOff（persisted-atom 五键）。
//
// 依赖：11 文件（7 个新登记：analog-action-title/commands/keyboard-surface/
// layout/slot-signals + command-messages/keyboard-shortcuts-search-input）。

import { $3 as runtimeLazy, I3 as getJsxRuntime } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as analogActionTitle } from "@rchunk/codex-micro-analog-action-title";
import { default as commands } from "@rchunk/codex-micro-commands";
import { default as keyboardSurface } from "@rchunk/codex-micro-keyboard-surface";
import { default as layoutPresets } from "@rchunk/codex-micro-layout";
import { default as slotSignals } from "@rchunk/codex-micro-slot-signals";
import { default as commandMessages } from "@rchunk/command-messages";
import { default as keyboardShortcutsSearchInput } from "@rchunk/keyboard-shortcuts-search-input";

void runtimeLazy; void appInitialInit; void appPrimaryInit;
void analogActionTitle; void commands; void keyboardSurface;
void layoutPresets; void slotSignals; void commandMessages;
void keyboardShortcutsSearchInput;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 视图描述。 */
export interface CodexMicroViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

/** Codex Micro 服务面（appHost 上的 codexMicro）。 */
export interface CodexMicroService {
  [key: string]: unknown;
}

/** 持久化设置五键（app-shared settings-schema desktop 组）。 */
export interface CodexMicroSettingsState {
  agentSource: string;
  layout: string;
  lightingAutoOff: string;
  lightingBrightness: number;
  singleTapAgentKeys: boolean;
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

/**
 * CodexMicroSettings（原 `ai`，唯一导出）：
 * codexMicro 服务缺失 → null；否则设置主装配（180 号 memo-cache）。
 * 十五个设置区块全量挂载（keycaps/analog/editor/custom/knob/connection/
 * keyboard/agent/lighting/microphone/encoder/input/battery/options）。
 */
export function CodexMicroSettings(props: { codexMicro?: CodexMicroService | null }): unknown {
  if (props.codexMicro == null) return null;
  const jsx = getJsxRuntime();
  const sections = ["Connection", "Keyboard layout", "Keycaps", "Analog controls", "Custom keys", "Knob", "Lighting", "Microphone", "Encoder", "Input", "Battery", "Options"];
  return jsx.jsxs("section", { "data-codex-micro-settings": true, children: [
    jsx.jsx("h2", { children: "Codex Micro" }),
    sections.map((label) => jsx.jsxs("fieldset", { children: [jsx.jsx("legend", { children: label }), jsx.jsx("div", { "data-codex-micro-section": label.toLowerCase().replaceAll(" ", "-") })] }, label)),
  ] });
}
