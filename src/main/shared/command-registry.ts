// shared chunk：命令注册表 + keymap 加速键（keymap-menus 区）。
//
// 对应 src-DldfpmrL.ts 的 L55,500-60,000 区段：
//   - w6（L56,671）：electron-only 命令 17 条（hotkeyWindow/globalDictation*/
//     realtimeVoice/copy*/closeTab/closeWindow/reload*/newWindow/
//     openCommandMenu/searchFiles/renameThread/toggleFileTreePanel/
//     toggleTraceRecording）
//   - T6（L56,822）：vscode-only 命令 8 条（implementTodo/openSidebar/
//     newCodexPanel/addToThread/addFileToThread/showLspMcpCliArgs/
//     dumpNuxState/resetNuxState）
//   - E6（L56,847-58,100）：命令总表 = webview 命令（newTask…thread9，
//     每条带 browser/electron/vscodeCommand 三平台 keybinding）+
//     vscode-only + electron-only，经 D6 打 kind 标签
//   - A6：id→定义 Map（重复 id 抛错）；j6/M6：thread[1-9]/focusTab[1-9]
//   - N6 查找 / P6 存在 / F6 数字 tab 命令判定
//   - I6+L6：requiredAccess（codexLocal / codexOrWorkLocal）可用性
//   - R6+J6+z6：可配置判定（vscode-only 与 MouseBack/Forward 除外）
//   - B6：语义冲突命令组（k6：closeTab↔closeWindow、nextTab↔nextThread…）
//   - O6：primaryNumberShortcutTarget（sidebar/tabs）修饰键分配
//   - V6：默认 accelerators（平台分支 + tabs 数字键重映射）
//   - U6：当前 accelerators（keymapState 绑定优先 + 冲突过滤）
//   - H6/W6/G6/K6：首个 accelerator / 菜单标题 / 修饰键归一化 / Cmd+Enter
//   - Y6=`keybindings.json`：X6 旧命令名迁移表 + Z6/Q6 zod schema +
//     e8 路径 + t8/n8 读写 + r8/i8 解析 + s8 更新状态机 +
//     c8 重置 + l8/u8/d8/f8/p8/m8/g8/_8/v8/y8/b8 辅助群
//
// 消费方（main-app 已重写模块经 `@chunk/shared` 别名 import）：
//   browser-shortcuts.ts / app-shell-keyboard.ts（At/Ot/jt/Et）、
//   util/app-paths.ts（Ct/Tt）。
//
// 兼容导出（本区 16 个压缩名）：At=U6、Ct=n8、Dt=j6、Et=M6、Ft=E6、
// Mt=W6、Nt=I6、Ot=N6、Pt=z6、St=t8、Tt=s8、bt=a8、jt=V6、kt=H6、
// wt=c8、xt=o8。其余 24 个别名（Bt/Ht/Rt/zt=指令族、It=分块发送器、
// Vt=命令安装、Wt=ws URL、ct..ut=协议帧族、yt=lodash property、
// vt=路径重试、_t/gt/ht/ft=app-server 客户端）属后续分区模块。

import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

import { z } from "zod";

import { memoizedTaggedLogger } from "@chunk/logger";
import {
  commandsConflict,
  isModifiedEnter,
  isMouseAccelerator,
  normalizeAccelerator,
} from "./command-registry-policy";

export { isMouseAccelerator } from "./command-registry-policy";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 命令运行面。 */
export type CommandSurface = "browser" | "electron" | "extension";

/** 访问要求。 */
export type RequiredAccess = "codexLocal" | "codexOrWorkLocal";

/** 快捷键生效范围。 */
export type ShortcutScope = "app" | "os-global";

/** 数字快捷键主目标（sidebar 或 tabs 拿 CmdOrCtrl+数字）。 */
export type PrimaryNumberShortcutTarget = "sidebar" | "tabs";

/** 单条键绑定。 */
export interface CommandKeybinding {
  key: string;
}

/** electron 平台绑定段。 */
export interface ElectronCommandBindingSection {
  menuTitle?: string;
  menuTitleIntlId?: string;
  defaultKeybindings?: CommandKeybinding[];
  platformDefaultKeybindings?: { macOS?: CommandKeybinding[]; default?: CommandKeybinding[] };
  isOverridableByBrowserWebpage?: boolean;
}

/** browser 平台绑定段。 */
export interface BrowserCommandBindingSection {
  defaultKeybindings?: CommandKeybinding[];
}

/** VS Code 扩展命令段。 */
export interface VscodeCommandSection {
  commandId?: string;
  title?: string;
  enablement?: string;
  icon?: { light?: string; dark?: string } | string;
  keybinding?: { key: string; mac?: string; when?: string };
}

/** 命令定义（原 `E6` 数组元素）。 */
export interface CommandDefinition {
  id: string;
  titleIntlId?: string;
  descriptionIntlId?: string;
  kind?: "webview" | "vscode-only" | "electron-only";
  requiredAccess?: RequiredAccess;
  availableIn?: CommandSurface[];
  shortcutScope?: ShortcutScope;
  commandMenu?: boolean;
  commandMenuGroupKey?: string;
  commandMenuFeature?: string;
  shortcutConfigurable?: boolean;
  allowsKeyRepeat?: boolean;
  allowsBareModifiers?: boolean;
  browser?: BrowserCommandBindingSection;
  electron?: ElectronCommandBindingSection;
  vscodeCommand?: VscodeCommandSection | null;
}

/** 平台访问旗标（原 `L6` 的第二参）。 */
export interface PlatformAccessFlags {
  codexLocal: boolean;
  workLocal: boolean;
}

/** keymap 单条绑定（`key: null` = 显式清除墓碑）。 */
export interface KeymapBinding {
  command: string;
  key: string | null;
}

/** keymap 状态。 */
export interface KeymapState {
  supported: true;
  keymapPath: string;
  bindings: KeymapBinding[];
  primaryNumberShortcutTarget?: PrimaryNumberShortcutTarget;
}

/** keymap 更新指令。 */
export type KeymapUpdate =
  | { type: "set"; accelerator: string }
  | { type: "replace"; accelerator: string; previousAccelerator: string }
  | { type: "append"; accelerator: string }
  | { type: "remove"; accelerator: string }
  | { type: "clear" }
  | { type: "reset" };

// ---------------------------------------------------------------------------
// electron-only 命令（原 `w6`）
// ---------------------------------------------------------------------------

const ELECTRON_ONLY_COMMANDS: CommandDefinition[] = [
  {
    id: "hotkeyWindow",
    titleIntlId: "codex.command.hotkeyWindow",
    descriptionIntlId: "codex.commandDescription.hotkeyWindow",
    requiredAccess: "codexLocal",
    shortcutScope: "os-global",
  },
  {
    id: "globalDictationHold",
    titleIntlId: "codex.command.globalDictationHold",
    descriptionIntlId: "codex.commandDescription.globalDictationHold",
    shortcutScope: "os-global",
    allowsBareModifiers: true,
  },
  {
    id: "globalDictationToggle",
    titleIntlId: "codex.command.globalDictationToggle",
    descriptionIntlId: "codex.commandDescription.globalDictationToggle",
    shortcutScope: "os-global",
    allowsBareModifiers: true,
  },
  {
    id: "realtimeVoice",
    titleIntlId: "codex.command.realtimeVoice",
    descriptionIntlId: "codex.commandDescription.realtimeVoice",
    shortcutScope: "os-global",
    allowsBareModifiers: true,
  },
  {
    id: "copyConversationPath",
    descriptionIntlId: "codex.commandDescription.copyConversationPath",
    requiredAccess: "codexLocal",
    electron: {
      menuTitle: "Copy conversation path",
      menuTitleIntlId: "codex.commandMenuTitle.copyConversationPath",
      defaultKeybindings: [{ key: "CmdOrCtrl+Alt+Shift+C" }],
    },
  },
  {
    id: "copyDeeplink",
    descriptionIntlId: "codex.commandDescription.copyDeeplink",
    electron: {
      menuTitle: "Copy deeplink",
      menuTitleIntlId: "codex.commandMenuTitle.copyDeeplink",
      defaultKeybindings: [{ key: "CmdOrCtrl+Alt+L" }],
    },
  },
  {
    id: "copyWorkingDirectory",
    descriptionIntlId: "codex.commandDescription.copyWorkingDirectory",
    requiredAccess: "codexLocal",
    electron: {
      menuTitle: "Copy working directory",
      menuTitleIntlId: "codex.commandMenuTitle.copyWorkingDirectory",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+C" }],
    },
  },
  {
    id: "closeTab",
    descriptionIntlId: "codex.commandDescription.closeTab",
    electron: {
      menuTitle: "Close Tab",
      menuTitleIntlId: "codex.commandMenuTitle.closeTab",
      defaultKeybindings: [{ key: "CmdOrCtrl+W" }],
      platformDefaultKeybindings: { default: [{ key: "Ctrl+W" }, { key: "Ctrl+F4" }] },
    },
  },
  {
    id: "closeWindow",
    descriptionIntlId: "codex.commandDescription.closeWindow",
    electron: {
      menuTitle: "Close",
      menuTitleIntlId: "codex.commandMenuTitle.closeWindow",
      defaultKeybindings: [{ key: "CmdOrCtrl+W" }],
      platformDefaultKeybindings: { default: [{ key: "Ctrl+W" }, { key: "Ctrl+F4" }] },
    },
  },
  {
    id: "reloadBrowserPage",
    descriptionIntlId: "codex.commandDescription.reloadBrowserPage",
    electron: {
      menuTitle: "Reload Browser Page",
      menuTitleIntlId: "codex.commandMenuTitle.reloadBrowserPage",
      defaultKeybindings: [{ key: "CmdOrCtrl+R" }],
      isOverridableByBrowserWebpage: true,
    },
  },
  {
    id: "hardReloadBrowserPage",
    descriptionIntlId: "codex.commandDescription.hardReloadBrowserPage",
    electron: {
      menuTitle: "Force Reload Browser Page",
      menuTitleIntlId: "codex.commandMenuTitle.hardReloadBrowserPage",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+R" }],
      isOverridableByBrowserWebpage: true,
    },
  },
  {
    id: "newWindow",
    descriptionIntlId: "codex.commandDescription.newWindow",
    electron: { menuTitle: "New Window", menuTitleIntlId: "codex.commandMenuTitle.newWindow" },
  },
  {
    id: "openCommandMenu",
    descriptionIntlId: "codex.commandDescription.openCommandMenu",
    electron: {
      menuTitle: "Open command menu",
      menuTitleIntlId: "codex.commandMenuTitle.openCommandMenu",
      defaultKeybindings: [{ key: "CmdOrCtrl+K" }, { key: "CmdOrCtrl+Shift+P" }],
    },
  },
  {
    id: "searchFiles",
    descriptionIntlId: "codex.commandDescription.searchFiles",
    requiredAccess: "codexLocal",
    electron: {
      menuTitle: "Search Files…",
      menuTitleIntlId: "codex.commandMenuTitle.searchFiles",
      defaultKeybindings: [{ key: "CmdOrCtrl+P" }],
    },
  },
  {
    id: "renameThread",
    descriptionIntlId: "codex.commandDescription.renameThread",
    electron: {
      menuTitle: "Rename chat",
      menuTitleIntlId: "codex.commandMenuTitle.renameThread",
      defaultKeybindings: [{ key: "CmdOrCtrl+Alt+R" }],
    },
  },
  {
    id: "toggleFileTreePanel",
    descriptionIntlId: "codex.commandDescription.toggleFileTreePanel",
    requiredAccess: "codexLocal",
    electron: {
      menuTitle: "Toggle File Tree",
      menuTitleIntlId: "codex.commandMenuTitle.toggleFileTreePanel",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+E" }],
    },
  },
  {
    id: "toggleTraceRecording",
    descriptionIntlId: "codex.commandDescription.toggleTraceRecording",
    electron: {
      menuTitle: "Start Trace Recording",
      menuTitleIntlId: "codex.commandMenuTitle.toggleTraceRecording",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+S" }],
    },
  },
];

// ---------------------------------------------------------------------------
// vscode-only 命令（原 `T6`）
// ---------------------------------------------------------------------------

const VSCODE_ONLY_COMMANDS: CommandDefinition[] = [
  { id: "implementTodo", vscodeCommand: { title: "Implement with Codex", enablement: "false" } },
  {
    id: "openSidebar",
    vscodeCommand: {
      title: "Open Codex Sidebar",
      icon: { light: "resources/blossom-black.svg", dark: "resources/blossom-white.svg" },
    },
  },
  { id: "newCodexPanel", vscodeCommand: { title: "New Codex Agent", icon: "$(plus)" } },
  { id: "addToThread", vscodeCommand: { title: "Add to Codex Thread" } },
  { id: "addFileToThread", vscodeCommand: { title: "Add File to Codex Thread" } },
  { id: "showLspMcpCliArgs", vscodeCommand: { title: "Copy Codex CLI args for LSP MCP" } },
  {
    id: "dumpNuxState",
    vscodeCommand: { title: "Debug: print NUX state to console", enablement: "chatgpt.sidebarView.visible" },
  },
  {
    id: "resetNuxState",
    vscodeCommand: { title: "Debug: reset NUX state", enablement: "chatgpt.sidebarView.visible" },
  },
];

// ---------------------------------------------------------------------------
// webview 命令（原 `E6` 主体数组，L56,850-58,095）
// ---------------------------------------------------------------------------

const WEBVIEW_COMMANDS: CommandDefinition[] = [
  {
    id: "newTask",
    titleIntlId: "codex.command.newThread",
    descriptionIntlId: "codex.commandDescription.newThread",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    browser: { defaultKeybindings: [{ key: "CmdOrCtrl+Shift+O" }] },
    electron: {
      menuTitle: "New Chat",
      menuTitleIntlId: "codex.commandMenuTitle.newThread",
      defaultKeybindings: [{ key: "CmdOrCtrl+N" }, { key: "CmdOrCtrl+Shift+O" }],
    },
    vscodeCommand: {
      commandId: "chatgpt.newChat",
      title: "New Chat in ChatGPT Sidebar",
      keybinding: { key: "ctrl+n", mac: "cmd+n", when: "chatgpt.supportsNewChatKeyShortcut" },
    },
  },
  {
    id: "newProjectlessTask",
    titleIntlId: "codex.command.newProjectlessTask",
    descriptionIntlId: "codex.commandDescription.newProjectlessTask",
    requiredAccess: "codexLocal",
    availableIn: ["electron"],
    commandMenuGroupKey: "thread",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "New standalone chat",
      menuTitleIntlId: "codex.commandMenuTitle.newProjectlessTask",
      defaultKeybindings: [{ key: "CmdOrCtrl+Alt+O" }],
    },
  },
  {
    id: "quickChat",
    titleIntlId: "codex.command.quickChat",
    descriptionIntlId: "codex.commandDescription.quickChat",
    shortcutScope: "app",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    commandMenuFeature: "chatgpt",
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+N" }] },
  },
  {
    id: "temporaryChat",
    titleIntlId: "codex.command.temporaryChat",
    descriptionIntlId: "codex.commandDescription.temporaryChat",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    commandMenuFeature: "chatgpt",
    electron: {
      menuTitle: "New Temporary Chat",
      menuTitleIntlId: "codex.command.temporaryChat",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+N" }],
    },
  },
  {
    id: "openThreadInNewWindow",
    titleIntlId: "codex.command.openThreadInNewWindow",
    descriptionIntlId: "codex.commandDescription.openThreadInNewWindow",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Open in New Window",
      menuTitleIntlId: "codex.commandMenuTitle.openThreadInNewWindow",
    },
  },
  {
    id: "archiveThread",
    titleIntlId: "codex.command.archiveThread",
    descriptionIntlId: "codex.commandDescription.archiveThread",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    electron: {
      menuTitle: "Archive chat",
      menuTitleIntlId: "codex.commandMenuTitle.archiveThread",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+A" }],
    },
  },
  {
    id: "markThreadUnread",
    titleIntlId: "codex.command.markThreadUnread",
    descriptionIntlId: "codex.commandDescription.markThreadUnread",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Shift+U" }] },
  },
  {
    id: "toggleThreadPin",
    titleIntlId: "codex.command.toggleThreadPin",
    descriptionIntlId: "codex.commandDescription.toggleThreadPin",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    electron: {
      menuTitle: "Pin/unpin chat",
      menuTitleIntlId: "codex.commandMenuTitle.toggleThreadPin",
      defaultKeybindings: [{ key: "CmdOrCtrl+Alt+P" }],
    },
  },
  {
    id: "copyConversationMarkdown",
    titleIntlId: "codex.command.copyConversationMarkdown",
    descriptionIntlId: "codex.commandDescription.copyConversationMarkdown",
  },
  {
    id: "openSideChat",
    titleIntlId: "codex.command.openSideChat",
    descriptionIntlId: "codex.commandDescription.openSideChat",
    requiredAccess: "codexLocal",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "thread",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+S" }] },
  },
  {
    id: "openControlWindow",
    titleIntlId: "codex.command.openControlWindow",
    descriptionIntlId: "codex.commandDescription.openControlWindow",
    commandMenuGroupKey: "app",
    commandMenu: true,
  },
  {
    id: "toggleDebugModal",
    titleIntlId: "codex.command.toggleDebugModal",
    descriptionIntlId: "codex.commandDescription.toggleDebugModal",
    availableIn: ["browser", "electron", "extension"],
    shortcutScope: "app",
    electron: { defaultKeybindings: [{ key: "Ctrl+D" }] },
  },
  {
    id: "undoAppAction",
    titleIntlId: "codex.command.undoAppAction",
    descriptionIntlId: "codex.commandDescription.undoAppAction",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "app",
    commandMenu: true,
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Z" }] },
  },
  {
    id: "redoAppAction",
    titleIntlId: "codex.command.redoAppAction",
    descriptionIntlId: "codex.commandDescription.redoAppAction",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "app",
    commandMenu: true,
    electron: {
      platformDefaultKeybindings: {
        macOS: [{ key: "Command+Shift+Z" }],
        default: [{ key: "Ctrl+Y" }, { key: "Ctrl+Shift+Z" }],
      },
    },
  },
  {
    id: "reopenClosedTab",
    titleIntlId: "codex.command.reopenClosedTab",
    descriptionIntlId: "codex.commandDescription.reopenClosedTab",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Shift+T" }] },
  },
  {
    id: "composer.openModelPicker",
    titleIntlId: "codex.command.composer.openModelPicker",
    descriptionIntlId: "codex.commandDescription.composer.openModelPicker",
    shortcutScope: "app",
    electron: { defaultKeybindings: [{ key: "Ctrl+Shift+M" }] },
  },
  {
    id: "composer.openProjectPicker",
    titleIntlId: "codex.command.composer.openProjectPicker",
    descriptionIntlId: "codex.commandDescription.composer.openProjectPicker",
    availableIn: ["browser", "electron"],
    shortcutScope: "app",
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+Shift+O" }] },
  },
  {
    id: "composer.startVoiceMode",
    titleIntlId: "codex.command.composer.startVoiceMode",
    descriptionIntlId: "codex.commandDescription.composer.startVoiceMode",
    shortcutScope: "app",
    electron: {
      platformDefaultKeybindings: { macOS: [{ key: "Ctrl+Shift+V" }], default: [] },
    },
  },
  {
    id: "realtimeVoice.toggleMicrophoneMute",
    titleIntlId: "codex.command.realtimeVoice.toggleMicrophoneMute",
    descriptionIntlId: "codex.commandDescription.realtimeVoice.toggleMicrophoneMute",
    availableIn: ["electron"],
    shortcutScope: "app",
  },
  {
    id: "realtimeVoice.toggleOutputMute",
    titleIntlId: "codex.command.realtimeVoice.toggleOutputMute",
    descriptionIntlId: "codex.commandDescription.realtimeVoice.toggleOutputMute",
    availableIn: ["electron"],
    shortcutScope: "app",
  },
  {
    id: "realtimeVoice.endCall",
    titleIntlId: "codex.command.realtimeVoice.endCall",
    descriptionIntlId: "codex.commandDescription.realtimeVoice.endCall",
    availableIn: ["electron"],
    shortcutScope: "app",
  },
  {
    id: "composer.startDictation",
    titleIntlId: "codex.command.composer.startDictation",
    descriptionIntlId: "codex.commandDescription.composer.startDictation",
    shortcutScope: "app",
    electron: {
      menuTitle: "Dictation",
      menuTitleIntlId: "codex.commandMenuTitle.composer.startDictation",
      defaultKeybindings: [{ key: "Ctrl+Shift+D" }],
    },
  },
  {
    id: "composer.submitInBackground",
    titleIntlId: "codex.command.composer.submitInBackground",
    descriptionIntlId: "codex.commandDescription.composer.submitInBackground",
    availableIn: ["browser", "electron"],
    shortcutScope: "app",
    browser: { defaultKeybindings: [{ key: "CmdOrCtrl+Enter" }] },
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Enter" }] },
  },
  {
    id: "composer.submit",
    titleIntlId: "codex.command.composer.submit",
    descriptionIntlId: "codex.commandDescription.composer.submit",
    shortcutScope: "app",
  },
  {
    id: "composer.steer",
    titleIntlId: "codex.command.composer.steer",
    descriptionIntlId: "codex.commandDescription.composer.steer",
    shortcutScope: "app",
  },
  {
    id: "composer.queue",
    titleIntlId: "codex.command.composer.queue",
    descriptionIntlId: "codex.commandDescription.composer.queue",
    shortcutScope: "app",
  },
  {
    id: "composer.clear",
    titleIntlId: "codex.command.composer.clear",
    descriptionIntlId: "codex.commandDescription.composer.clear",
    shortcutScope: "app",
  },
  {
    id: "composer.addPhotos",
    titleIntlId: "codex.command.composer.addPhotos",
    descriptionIntlId: "codex.commandDescription.composer.addPhotos",
    availableIn: ["electron"],
    shortcutScope: "app",
  },
  {
    id: "composer.captureAppshot",
    titleIntlId: "codex.command.composer.captureAppshot",
    descriptionIntlId: "codex.commandDescription.composer.captureAppshot",
    availableIn: ["electron"],
    shortcutConfigurable: false,
  },
  {
    id: "composer.addFiles",
    titleIntlId: "codex.command.composer.addFiles",
    descriptionIntlId: "codex.commandDescription.composer.addFiles",
    availableIn: ["browser", "electron"],
    shortcutScope: "app",
    browser: { defaultKeybindings: [{ key: "CmdOrCtrl+U" }] },
  },
  {
    id: "composer.toggleFastMode",
    titleIntlId: "codex.command.composer.toggleFastMode",
    descriptionIntlId: "codex.commandDescription.composer.toggleFastMode",
    shortcutScope: "app",
  },
  {
    id: "composer.increaseReasoningEffort",
    titleIntlId: "codex.command.composer.increaseReasoningEffort",
    descriptionIntlId: "codex.commandDescription.composer.increaseReasoningEffort",
    shortcutScope: "app",
  },
  {
    id: "composer.decreaseReasoningEffort",
    titleIntlId: "codex.command.composer.decreaseReasoningEffort",
    descriptionIntlId: "codex.commandDescription.composer.decreaseReasoningEffort",
    shortcutScope: "app",
  },
  {
    id: "composer.cycleReasoningEffort",
    titleIntlId: "codex.command.composer.cycleReasoningEffort",
    descriptionIntlId: "codex.commandDescription.composer.cycleReasoningEffort",
    shortcutScope: "app",
  },
  {
    id: "composer.togglePlanMode",
    titleIntlId: "codex.command.composer.togglePlanMode",
    descriptionIntlId: "codex.commandDescription.composer.togglePlanMode",
    shortcutScope: "app",
  },
  {
    id: "composer.toggleWorktreeMode",
    titleIntlId: "codex.command.composer.toggleWorktreeMode",
    descriptionIntlId: "codex.commandDescription.composer.toggleWorktreeMode",
    availableIn: ["electron"],
    shortcutScope: "app",
  },
  {
    id: "composer.cycleHost",
    titleIntlId: "codex.command.composer.cycleHost",
    descriptionIntlId: "codex.commandDescription.composer.cycleHost",
    availableIn: ["electron"],
    shortcutScope: "app",
  },
  {
    id: "composer.toggleWorkRunLocation",
    titleIntlId: "codex.command.composer.toggleWorkRunLocation",
    descriptionIntlId: "codex.commandDescription.composer.toggleWorkRunLocation",
    availableIn: ["electron"],
    shortcutScope: "app",
  },
  {
    id: "approval.approve",
    titleIntlId: "codex.command.approval.approve",
    descriptionIntlId: "codex.commandDescription.approval.approve",
    shortcutScope: "app",
    electron: { defaultKeybindings: [{ key: "Enter" }] },
  },
  {
    id: "approval.decline",
    titleIntlId: "codex.command.approval.decline",
    descriptionIntlId: "codex.commandDescription.approval.decline",
    shortcutScope: "app",
    electron: { defaultKeybindings: [{ key: "Escape" }] },
  },
  {
    id: "git.commit",
    titleIntlId: "codex.command.git.commit",
    descriptionIntlId: "codex.commandDescription.git.commit",
    requiredAccess: "codexLocal",
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "git.createPullRequest",
    titleIntlId: "codex.command.git.createPullRequest",
    descriptionIntlId: "codex.commandDescription.git.createPullRequest",
    requiredAccess: "codexLocal",
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "git.createDraftPullRequest",
    titleIntlId: "codex.command.git.createDraftPullRequest",
    descriptionIntlId: "codex.commandDescription.git.createDraftPullRequest",
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "git.createBranch",
    titleIntlId: "codex.command.git.createBranch",
    descriptionIntlId: "codex.commandDescription.git.createBranch",
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "git.mergePullRequest",
    titleIntlId: "codex.command.git.mergePullRequest",
    descriptionIntlId: "codex.commandDescription.git.mergePullRequest",
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "git.openPullRequest",
    titleIntlId: "codex.command.git.openPullRequest",
    descriptionIntlId: "codex.commandDescription.git.openPullRequest",
    requiredAccess: "codexLocal",
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "git.toggleBlame",
    titleIntlId: "codex.command.git.toggleBlame",
    descriptionIntlId: "codex.commandDescription.git.toggleBlame",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "forkThread",
    titleIntlId: "codex.command.forkThread",
    descriptionIntlId: "codex.commandDescription.forkThread",
    shortcutScope: "app",
  },
  {
    id: "openAvatarOverlay",
    titleIntlId: "codex.command.openPetOverlay",
    descriptionIntlId: "codex.commandDescription.openPetOverlay",
    availableIn: ["electron"],
    shortcutScope: "os-global",
    commandMenuGroupKey: "app",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Show pet",
      menuTitleIntlId: "codex.commandMenuTitle.openAvatarOverlay",
      platformDefaultKeybindings: {
        macOS: [{ key: "Alt+Space" }],
        default: [{ key: "Super+Alt+P" }],
      },
    },
  },
  {
    id: "searchChats",
    titleIntlId: "codex.command.searchChats",
    descriptionIntlId: "codex.commandDescription.searchChats",
    availableIn: ["browser", "electron"],
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    browser: { defaultKeybindings: [{ key: "CmdOrCtrl+K" }] },
    electron: {
      menuTitle: "Search Chats…",
      menuTitleIntlId: "codex.commandMenuTitle.searchChats",
    },
  },
  {
    id: "togglePriorityFilter",
    titleIntlId: "codex.command.togglePriorityFilter",
    descriptionIntlId: "codex.commandDescription.togglePriorityFilter",
    availableIn: ["browser", "electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+U" }] },
  },
  {
    id: "focusMainChat",
    titleIntlId: "codex.command.focusMainChat",
    descriptionIntlId: "codex.commandDescription.focusMainChat",
    requiredAccess: "codexLocal",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "focusSideChat",
    titleIntlId: "codex.command.focusSideChat",
    descriptionIntlId: "codex.commandDescription.focusSideChat",
    requiredAccess: "codexLocal",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "nextThreadNeedingAttention",
    titleIntlId: "codex.command.nextThreadNeedingAttention",
    descriptionIntlId: "codex.commandDescription.nextThreadNeedingAttention",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+A" }] },
  },
  {
    id: "previousTab",
    titleIntlId: "codex.command.previousTab",
    descriptionIntlId: "codex.commandDescription.previousTab",
    availableIn: ["electron"],
    shortcutScope: "app",
    allowsKeyRepeat: true,
    commandMenuGroupKey: "navigation",
    electron: {
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+[" }],
      platformDefaultKeybindings: {
        macOS: [
          { key: "Ctrl+Shift+Tab" },
          { key: "Command+Shift+[" },
          { key: "Command+Alt+Left" },
        ],
        default: [{ key: "Ctrl+Shift+Tab" }, { key: "Ctrl+Shift+[" }, { key: "Ctrl+PageUp" }],
      },
    },
  },
  {
    id: "previousThread",
    titleIntlId: "codex.command.previousThread",
    descriptionIntlId: "codex.commandDescription.previousThread",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      menuTitle: "Previous Chat",
      menuTitleIntlId: "codex.commandMenuTitle.previousThread",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+[" }],
      platformDefaultKeybindings: {
        macOS: [{ key: "Command+Shift+[" }, { key: "Command+Alt+Left" }],
        default: [{ key: "Ctrl+Shift+[" }, { key: "Ctrl+PageUp" }],
      },
    },
  },
  {
    id: "previousRecentThread",
    titleIntlId: "codex.command.previousRecentThread",
    descriptionIntlId: "codex.commandDescription.previousRecentThread",
    availableIn: ["electron"],
    shortcutScope: "app",
    allowsKeyRepeat: true,
    commandMenuGroupKey: "navigation",
    electron: { defaultKeybindings: [{ key: "Ctrl+Shift+Tab" }] },
  },
  {
    id: "nextTab",
    titleIntlId: "codex.command.nextTab",
    descriptionIntlId: "codex.commandDescription.nextTab",
    availableIn: ["electron"],
    shortcutScope: "app",
    allowsKeyRepeat: true,
    commandMenuGroupKey: "navigation",
    electron: {
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+]" }],
      platformDefaultKeybindings: {
        macOS: [
          { key: "Ctrl+Tab" },
          { key: "Command+Shift+]" },
          { key: "Command+Alt+Right" },
        ],
        default: [{ key: "Ctrl+Tab" }, { key: "Ctrl+Shift+]" }, { key: "Ctrl+PageDown" }],
      },
    },
  },
  {
    id: "nextThread",
    titleIntlId: "codex.command.nextThread",
    descriptionIntlId: "codex.commandDescription.nextThread",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      menuTitle: "Next Chat",
      menuTitleIntlId: "codex.commandMenuTitle.nextThread",
      defaultKeybindings: [{ key: "CmdOrCtrl+Shift+]" }],
      platformDefaultKeybindings: {
        macOS: [{ key: "Command+Shift+]" }, { key: "Command+Alt+Right" }],
        default: [{ key: "Ctrl+Shift+]" }, { key: "Ctrl+PageDown" }],
      },
    },
  },
  {
    id: "nextRecentThread",
    titleIntlId: "codex.command.nextRecentThread",
    descriptionIntlId: "codex.commandDescription.nextRecentThread",
    availableIn: ["electron"],
    shortcutScope: "app",
    allowsKeyRepeat: true,
    commandMenuGroupKey: "navigation",
    electron: { defaultKeybindings: [{ key: "Ctrl+Tab" }] },
  },
  ...[1, 2, 3, 4, 5, 6].map((slot) => ({
    id: `recentThread${slot}`,
    titleIntlId: `codex.command.recentThread${slot}`,
    descriptionIntlId: "codex.commandDescription.recentThreadSlot",
    availableIn: ["electron"] as CommandSurface[],
    shortcutScope: "app" as ShortcutScope,
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron:
      slot === 4
        ? { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+4" }, { key: "CmdOrCtrl+Shift+9" }] }
        : slot === 5
          ? { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+5" }, { key: "CmdOrCtrl+Shift+8" }] }
          : { defaultKeybindings: [{ key: `CmdOrCtrl+Alt+${slot}` }] },
  })),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((slot) => ({
    id: `focusTab${slot}`,
    titleIntlId: `codex.command.focusTab${slot}`,
    descriptionIntlId: "codex.commandDescription.focusTab",
    availableIn: ["electron"] as CommandSurface[],
    shortcutScope: "app" as ShortcutScope,
    commandMenuGroupKey: "navigation",
    electron: {
      platformDefaultKeybindings: {
        macOS: [{ key: `Ctrl+${slot}` }],
        default: [{ key: `Alt+${slot}` }],
      },
    },
  })),
  {
    id: "switchToMode1",
    titleIntlId: "codex.command.switchToChat",
    descriptionIntlId: "codex.commandDescription.switchToChat",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      platformDefaultKeybindings: { macOS: [{ key: "Ctrl+1" }], default: [{ key: "Alt+1" }] },
    },
  },
  {
    id: "switchToMode2",
    titleIntlId: "codex.command.switchToWork",
    descriptionIntlId: "codex.commandDescription.switchToWork",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      platformDefaultKeybindings: { macOS: [{ key: "Ctrl+2" }], default: [{ key: "Alt+2" }] },
    },
  },
  {
    id: "switchToMode3",
    titleIntlId: "codex.command.switchToCodex",
    descriptionIntlId: "codex.commandDescription.switchToCodex",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      platformDefaultKeybindings: { macOS: [{ key: "Ctrl+3" }], default: [{ key: "Alt+3" }] },
    },
  },
  {
    id: "settings",
    titleIntlId: "codex.command.settings",
    descriptionIntlId: "codex.commandDescription.settings",
    commandMenuGroupKey: "app",
    commandMenu: true,
    electron: {
      menuTitle: "Settings…",
      menuTitleIntlId: "codex.commandMenuTitle.settings",
      defaultKeybindings: [{ key: "CmdOrCtrl+," }],
    },
  },
  {
    id: "codexMicroSettings",
    titleIntlId: "codex.command.codexMicroSettings",
    descriptionIntlId: "codex.commandDescription.codexMicroSettings",
    availableIn: ["electron"],
    shortcutConfigurable: false,
    commandMenuGroupKey: "configure",
  },
  {
    id: "mcpSettings",
    titleIntlId: "codex.command.mcpSettings",
    descriptionIntlId: "codex.commandDescription.mcpSettings",
    commandMenuGroupKey: "configure",
    commandMenu: true,
  },
  {
    id: "personalitySettings",
    titleIntlId: "codex.command.personalitySettings",
    descriptionIntlId: "codex.commandDescription.personalitySettings",
    commandMenuGroupKey: "configure",
    commandMenu: true,
    browser: { defaultKeybindings: [{ key: "CmdOrCtrl+Shift+I" }] },
  },
  {
    id: "importExternalAgent",
    titleIntlId: "codex.command.importExternalAgent",
    descriptionIntlId: "codex.commandDescription.importExternalAgent",
    requiredAccess: "codexLocal",
    availableIn: ["electron"],
    commandMenuGroupKey: "configure",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "keyboardShortcuts",
    titleIntlId: "codex.command.keyboardShortcuts",
    descriptionIntlId: "codex.commandDescription.keyboardShortcuts",
    commandMenuGroupKey: "configure",
    commandMenu: true,
  },
  {
    id: "showKeyboardShortcuts",
    titleIntlId: "codex.command.showKeyboardShortcuts",
    descriptionIntlId: "codex.commandDescription.showKeyboardShortcuts",
    availableIn: ["browser", "electron"],
    shortcutScope: "app",
    browser: { defaultKeybindings: [{ key: "CmdOrCtrl+/" }] },
    electron: {
      menuTitle: "Keyboard Shortcuts",
      menuTitleIntlId: "codex.commandMenuTitle.showKeyboardShortcuts",
      defaultKeybindings: [{ key: "CmdOrCtrl+/" }],
    },
  },
  {
    id: "clearAllUnreads",
    titleIntlId: "codex.command.clearAllUnreads",
    descriptionIntlId: "codex.commandDescription.clearAllUnreads",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "app",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: { defaultKeybindings: [{ key: "Shift+Escape" }] },
  },
  {
    id: "manageTasks",
    titleIntlId: "codex.command.manageTasks",
    descriptionIntlId: "codex.commandDescription.manageTasks",
    commandMenuGroupKey: "app",
    commandMenu: true,
  },
  {
    id: "forceReloadSkills",
    titleIntlId: "codex.command.forceReloadSkills",
    descriptionIntlId: "codex.commandDescription.forceReloadSkills",
    requiredAccess: "codexLocal",
    commandMenuGroupKey: "skills",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "openSkills",
    titleIntlId: "codex.command.openSkills",
    descriptionIntlId: "codex.commandDescription.openSkills",
    requiredAccess: "codexLocal",
    commandMenuGroupKey: "skills",
    commandMenu: true,
    commandMenuFeature: "codex",
  },
  {
    id: "openFolder",
    titleIntlId: "codex.command.openFolder",
    descriptionIntlId: "codex.commandDescription.openFolder",
    requiredAccess: "codexOrWorkLocal",
    commandMenuGroupKey: "workspace",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Open Folder…",
      menuTitleIntlId: "codex.commandMenuTitle.openFolder",
      defaultKeybindings: [{ key: "CmdOrCtrl+O" }],
    },
  },
  {
    id: "toggleSidebar",
    titleIntlId: "codex.command.toggleSidebar",
    descriptionIntlId: "codex.commandDescription.toggleSidebar",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    browser: { defaultKeybindings: [{ key: "CmdOrCtrl+Shift+S" }] },
    electron: {
      menuTitle: "Toggle Sidebar",
      menuTitleIntlId: "codex.commandMenuTitle.toggleSidebar",
      defaultKeybindings: [{ key: "CmdOrCtrl+B" }],
    },
  },
  {
    id: "toggleBottomPanel",
    titleIntlId: "codex.command.toggleBottomPanel",
    descriptionIntlId: "codex.commandDescription.toggleBottomPanel",
    requiredAccess: "codexLocal",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Toggle Bottom Panel",
      menuTitleIntlId: "codex.commandMenuTitle.toggleBottomPanel",
      defaultKeybindings: [{ key: "CmdOrCtrl+J" }],
    },
  },
  {
    id: "togglePinnedSummary",
    titleIntlId: "codex.command.togglePinnedSummary",
    descriptionIntlId: "codex.commandDescription.togglePinnedSummary",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    electron: {
      menuTitle: "Toggle Pinned Summary",
      menuTitleIntlId: "codex.commandMenuTitle.togglePinnedSummary",
    },
  },
  {
    id: "toggleTerminal",
    titleIntlId: "codex.command.toggleTerminal",
    descriptionIntlId: "codex.commandDescription.toggleTerminal",
    requiredAccess: "codexLocal",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Open Terminal",
      menuTitleIntlId: "codex.commandMenuTitle.toggleTerminal",
      defaultKeybindings: [{ key: "Control+`" }],
    },
  },
  {
    id: "openBrowserTab",
    titleIntlId: "codex.command.openBrowserTab",
    descriptionIntlId: "codex.commandDescription.openBrowserTab",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Open Browser Tab",
      menuTitleIntlId: "codex.commandMenuTitle.openBrowserTab",
      defaultKeybindings: [{ key: "CmdOrCtrl+T" }],
    },
  },
  {
    id: "closeOtherTabs",
    titleIntlId: "codex.command.closeOtherTabs",
    descriptionIntlId: "codex.commandDescription.closeOtherTabs",
    availableIn: ["electron"],
    shortcutScope: "app",
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Alt+W" }] },
  },
  {
    id: "showWorkspaceTabView",
    titleIntlId: "codex.command.showWorkspaceTabView",
    descriptionIntlId: "codex.commandDescription.showWorkspaceTabView",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Shift+F" }] },
  },
  {
    id: "stepWorkspaceLayout",
    titleIntlId: "codex.command.stepWorkspaceLayout",
    descriptionIntlId: "codex.commandDescription.stepWorkspaceLayout",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+Shift+B" }] },
  },
  {
    id: "openReviewTab",
    titleIntlId: "codex.command.openReviewTab",
    descriptionIntlId: "codex.commandDescription.openReviewTab",
    requiredAccess: "codexLocal",
    availableIn: ["electron", "browser"],
    shortcutScope: "app",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: { defaultKeybindings: [{ key: "Ctrl+Shift+G" }] },
  },
  {
    id: "toggleReviewTab",
    titleIntlId: "codex.command.toggleReviewTab",
    descriptionIntlId: "codex.commandDescription.toggleReviewTab",
    requiredAccess: "codexLocal",
    availableIn: ["electron", "browser"],
    shortcutScope: "app",
    commandMenuGroupKey: "panels",
  },
  {
    id: "toggleSidePanel",
    titleIntlId: "codex.command.toggleReviewPanel",
    descriptionIntlId: "codex.commandDescription.toggleReviewPanel",
    commandMenuGroupKey: "panels",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Toggle Review Panel",
      menuTitleIntlId: "codex.commandMenuTitle.toggleReviewPanel",
      defaultKeybindings: [{ key: "CmdOrCtrl+Alt+B" }],
    },
  },
  {
    id: "toggleMaximizeSidePanel",
    titleIntlId: "codex.command.toggleMaximizeSidePanel",
    descriptionIntlId: "codex.commandDescription.toggleMaximizeSidePanel",
    shortcutScope: "app",
  },
  {
    id: "file.goToDefinition",
    titleIntlId: "codex.command.file.goToDefinition",
    descriptionIntlId: "codex.commandDescription.file.goToDefinition",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    electron: {
      platformDefaultKeybindings: {
        macOS: [{ key: "Ctrl+]" }],
        default: [{ key: "CmdOrCtrl+]" }],
      },
    },
  },
  {
    id: "file.navigateBack",
    titleIntlId: "codex.command.file.navigateBack",
    descriptionIntlId: "codex.commandDescription.file.navigateBack",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    electron: { platformDefaultKeybindings: { macOS: [{ key: "Control+-" }], default: [] } },
  },
  {
    id: "file.navigateForward",
    titleIntlId: "codex.command.file.navigateForward",
    descriptionIntlId: "codex.commandDescription.file.navigateForward",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    electron: { platformDefaultKeybindings: { macOS: [{ key: "Control+Shift+-" }], default: [] } },
  },
  {
    id: "findInThread",
    titleIntlId: "codex.command.findInThread",
    descriptionIntlId: "codex.commandDescription.findInThread",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      menuTitle: "Find",
      menuTitleIntlId: "codex.commandMenuTitle.findInThread",
      defaultKeybindings: [{ key: "CmdOrCtrl+F" }],
      platformDefaultKeybindings: {
        macOS: [{ key: "Command+F" }],
        default: [{ key: "Ctrl+F" }],
      },
      isOverridableByBrowserWebpage: true,
    },
  },
  {
    id: "goToLine",
    titleIntlId: "codex.command.goToLine",
    descriptionIntlId: "codex.commandDescription.goToLine",
    availableIn: ["electron"],
    shortcutScope: "app",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: { defaultKeybindings: [{ key: "CmdOrCtrl+L" }] },
  },
  {
    id: "focusBrowserAddressBar",
    titleIntlId: "codex.command.focusBrowserAddressBar",
    descriptionIntlId: "codex.commandDescription.focusBrowserAddressBar",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    commandMenuFeature: "codex",
    electron: {
      menuTitle: "Focus Browser Address Bar",
      menuTitleIntlId: "codex.commandMenuTitle.focusBrowserAddressBar",
      defaultKeybindings: [{ key: "CmdOrCtrl+L" }],
    },
  },
  {
    id: "navigateBrowserBack",
    titleIntlId: "codex.command.navigateBrowserBack",
    descriptionIntlId: "codex.commandDescription.navigateBrowserBack",
    availableIn: ["electron"],
    shortcutScope: "app",
    electron: {
      platformDefaultKeybindings: {
        macOS: [{ key: "Command+Left" }],
        default: [{ key: "Alt+Left" }],
      },
      isOverridableByBrowserWebpage: true,
    },
  },
  {
    id: "navigateBrowserForward",
    titleIntlId: "codex.command.navigateBrowserForward",
    descriptionIntlId: "codex.commandDescription.navigateBrowserForward",
    availableIn: ["electron"],
    shortcutScope: "app",
    electron: {
      platformDefaultKeybindings: {
        macOS: [{ key: "Command+Right" }],
        default: [{ key: "Alt+Right" }],
      },
      isOverridableByBrowserWebpage: true,
    },
  },
  {
    id: "navigateBack",
    titleIntlId: "codex.command.navigateBack",
    descriptionIntlId: "codex.commandDescription.navigateBack",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      menuTitle: "Back",
      menuTitleIntlId: "codex.commandMenuTitle.navigateBack",
      defaultKeybindings: [{ key: "CmdOrCtrl+[" }, { key: "MouseBack" }],
    },
  },
  {
    id: "navigateForward",
    titleIntlId: "codex.command.navigateForward",
    descriptionIntlId: "codex.commandDescription.navigateForward",
    commandMenuGroupKey: "navigation",
    commandMenu: true,
    electron: {
      menuTitle: "Forward",
      menuTitleIntlId: "codex.commandMenuTitle.navigateForward",
      defaultKeybindings: [{ key: "CmdOrCtrl+]" }, { key: "MouseForward" }],
    },
  },
  {
    id: "logOut",
    titleIntlId: "codex.command.logOut",
    descriptionIntlId: "codex.commandDescription.logOut",
    commandMenuGroupKey: "app",
    commandMenu: true,
    electron: { menuTitle: "Log Out", menuTitleIntlId: "codex.commandMenuTitle.logOut" },
  },
  {
    id: "feedback",
    titleIntlId: "codex.command.feedback",
    descriptionIntlId: "codex.commandDescription.feedback",
    commandMenuGroupKey: "app",
    commandMenu: true,
  },
  {
    id: "environmentAction1",
    titleIntlId: "codex.command.environmentAction1",
    descriptionIntlId: "codex.commandDescription.environmentActionSlot",
    shortcutScope: "app",
    commandMenuGroupKey: "workspace",
    electron: { defaultKeybindings: [{ key: "Command+Shift+D" }] },
  },
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((slot) => ({
    id: `environmentAction${slot}`,
    titleIntlId: `codex.command.environmentAction${slot}`,
    descriptionIntlId: "codex.commandDescription.environmentActionSlot",
    shortcutScope: "app" as ShortcutScope,
    commandMenuGroupKey: "workspace",
  })),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((slot) => ({
    id: `thread${slot}`,
    titleIntlId: `codex.command.thread${slot}`,
    descriptionIntlId: "codex.commandDescription.threadSlot",
    electron: {
      menuTitle: `Go to Chat ${slot}`,
      menuTitleIntlId: `codex.commandMenuTitle.thread${slot}`,
      defaultKeybindings: [{ key: `CmdOrCtrl+${slot}` }],
    },
  })),
];

/** kind 标签（原 `D6`）。 */
function tagCommands(commands: CommandDefinition[], kind: CommandDefinition["kind"]): CommandDefinition[] {
  return commands.map((command) => ({ ...command, kind }));
}

// ---------------------------------------------------------------------------
// 命令总表与索引（原 `E6`/`A6`/`j6`/`M6`）
// ---------------------------------------------------------------------------

/** 命令总表（原 `E6`）。 */
export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  ...tagCommands(WEBVIEW_COMMANDS, "webview"),
  ...tagCommands(VSCODE_ONLY_COMMANDS, "vscode-only"),
  ...tagCommands(ELECTRON_ONLY_COMMANDS, "electron-only"),
];

const definitionsById = new Map<string, CommandDefinition>();
for (const definition of COMMAND_DEFINITIONS) {
  if (definitionsById.has(definition.id)) throw new Error(`Duplicate Codex command id: ${definition.id}`);
  definitionsById.set(definition.id, definition);
}

/** webview thread1-9 命令 id（原 `j6`，导出 `Dt`）。 */
export const WEBVIEW_THREAD_COMMANDS = COMMAND_DEFINITIONS.filter(
  (definition) => definition.kind === "webview" && /^thread[1-9]$/.test(definition.id),
).map((definition) => definition.id);

/** webview focusTab1-9 命令 id（原 `M6`，导出 `Et`）。 */
export const WEBVIEW_FOCUS_TAB_COMMANDS = COMMAND_DEFINITIONS.filter(
  (definition) => definition.kind === "webview" && /^focusTab[1-9]$/.test(definition.id),
).map((definition) => definition.id);

/** 命令定义查找（原 `N6`，导出 `Ot`）。 */
export function findCommandDefinition(commandId: string): CommandDefinition | null {
  return definitionsById.get(commandId) ?? null;
}

/** 命令存在判定（原 `P6`）。 */
export function hasCommandDefinition(commandId: string): boolean {
  return definitionsById.has(commandId);
}

/** thread/focusTab 数字命令判定（原 `F6`）。 */
export function isNumberedTabCommand(commandId: string): boolean {
  return WEBVIEW_THREAD_COMMANDS.includes(commandId) || WEBVIEW_FOCUS_TAB_COMMANDS.some((id) => id === commandId);
}

// ---------------------------------------------------------------------------
// 可用性 / 可配置性（原 `I6`/`L6`/`R6`/`J6`/`z6`/`B6`）
// ---------------------------------------------------------------------------

/** requiredAccess 可用性（原 `I6`，导出 `Nt`）。 */
export function commandAvailableForAccess(definition: CommandDefinition, flags: PlatformAccessFlags): boolean {
  return accessAvailable("requiredAccess" in definition ? definition.requiredAccess : undefined, flags);
}

function accessAvailable(required: RequiredAccess | undefined, flags: PlatformAccessFlags): boolean {
  switch (required) {
    case "codexLocal":
      return flags.codexLocal;
    case "codexOrWorkLocal":
      return flags.codexLocal || flags.workLocal;
    case undefined:
      return true;
  }
}

/** vscode-only 命令判定（原 `J6`）。 */
function isVscodeOnly(definition: CommandDefinition): boolean {
  return definition.kind === "vscode-only";
}

/** 可配置快捷键判定（原 `R6`：vscode-only 与鼠标键、显式 false 除外）。 */
export function isShortcutConfigurable(definition: CommandDefinition): boolean {
  if (isVscodeOnly(definition)) return false;
  if ("shortcutConfigurable" in definition && definition.shortcutConfigurable === false) return false;
  const bindings = definition.electron?.defaultKeybindings ?? [];
  return !bindings.some((binding) => isMouseAccelerator(binding.key));
}

// ---------------------------------------------------------------------------
// 加速键解析（原 `O6`/`q6`/`V6`/`U6`/`H6`/`W6`/`G6`/`K6`）
// ---------------------------------------------------------------------------

/** 数字快捷键修饰键分配（原 `O6`）：tabs 目标拿 CmdOrCtrl，sidebar 拿 Ctrl/Alt。 */
function numberShortcutModifiers({
  primaryNumberShortcutTarget: target = "sidebar",
  isMacOS,
}: {
  primaryNumberShortcutTarget?: PrimaryNumberShortcutTarget;
  isMacOS: boolean;
}): { sidebar: { acceleratorModifier: string }; tabs: { acceleratorModifier: string } } {
  const primary = { acceleratorModifier: "CmdOrCtrl" };
  const secondary = { acceleratorModifier: isMacOS ? "Ctrl" : "Alt" };
  return target === "tabs" ? { sidebar: secondary, tabs: primary } : { sidebar: primary, tabs: secondary };
}

/** electron 绑定段（原 `q6`）。 */
function electronBindingFor(definition: CommandDefinition | null): ElectronCommandBindingSection | null {
  if (definition == null || !("electron" in definition) || definition.electron == null) return null;
  return definition.electron;
}

/** 命令默认加速键（原 `V6`，导出 `jt`）。 */
export function defaultAcceleratorsForCommand({
  commandId,
  isMacOS,
  primaryNumberShortcutTarget,
}: {
  commandId: string;
  isMacOS: boolean;
  primaryNumberShortcutTarget?: PrimaryNumberShortcutTarget;
}): string[] {
  const definition = findCommandDefinition(commandId);
  if (definition == null || !isShortcutConfigurable(definition)) return [];
  const binding = electronBindingFor(definition);
  if (
    binding == null ||
    (primaryNumberShortcutTarget == null && WEBVIEW_FOCUS_TAB_COMMANDS.some((id) => id === commandId)) ||
    (primaryNumberShortcutTarget != null &&
      (commandId === "switchToMode1" || commandId === "switchToMode2" || commandId === "switchToMode3"))
  )
    return [];
  if (primaryNumberShortcutTarget === "tabs") {
    const modifiers = numberShortcutModifiers({ primaryNumberShortcutTarget, isMacOS: isMacOS !== false });
    const tabIndex = WEBVIEW_FOCUS_TAB_COMMANDS.findIndex((id) => id === commandId);
    if (tabIndex !== -1) return [`${modifiers.tabs.acceleratorModifier}+${tabIndex + 1}`];
    const sidebarIndex = WEBVIEW_THREAD_COMMANDS.indexOf(commandId);
    if (sidebarIndex !== -1) return [`${modifiers.sidebar.acceleratorModifier}+${sidebarIndex + 1}`];
  }
  if (isMacOS === true && binding.platformDefaultKeybindings?.macOS != null)
    return binding.platformDefaultKeybindings.macOS.map((entry) => entry.key);
  if (isMacOS === false && binding.platformDefaultKeybindings?.default != null)
    return binding.platformDefaultKeybindings.default.map((entry) => entry.key);
  return binding.defaultKeybindings == null ? [] : binding.defaultKeybindings.map((entry) => entry.key);
}

/** 命令当前加速键（原 `U6`，导出 `At`）：keymap 显式绑定优先，否则平台默认。 */
export function acceleratorsForCommand({
  commandId,
  keymapState,
  isMacOS,
}: {
  commandId: string;
  keymapState?: KeymapState | null;
  isMacOS: boolean;
}): string[] {
  const definition = findCommandDefinition(commandId);
  if (
    definition == null ||
    !isShortcutConfigurable(definition) ||
    (keymapState?.primaryNumberShortcutTarget == null && WEBVIEW_FOCUS_TAB_COMMANDS.some((id) => id === commandId))
  )
    return [];
  const explicit = keymapState?.bindings.filter((binding) => binding.command === commandId);
  if (explicit != null && explicit.length > 0) {
    const accelerators: string[] = [];
    for (const binding of explicit) {
      if (binding.key == null) return [];
      accelerators.push(binding.key);
    }
    return accelerators;
  }
  // Cmd+Enter 被其他命令占用时，后台提交让位（原特判）。
  if (
    commandId === "composer.submitInBackground" &&
    (keymapState == null ||
      keymapState.bindings.some(
        (binding) => binding.command !== commandId && binding.key != null && isModifiedEnter(binding.key, isMacOS),
      ))
  )
    return [];
  const defaults = defaultAcceleratorsForCommand({
    commandId,
    isMacOS,
    primaryNumberShortcutTarget: keymapState?.primaryNumberShortcutTarget,
  });
  // macOS 宠物浮层（Alt+Space）与数字命令的默认键冲突过滤。
  if ((commandId !== "openAvatarOverlay" || isMacOS !== true) && (keymapState?.primaryNumberShortcutTarget == null || !isNumberedTabCommand(commandId)))
    return defaults;
  return defaults.filter(
    (accelerator) =>
      !keymapState?.bindings.some(
        (binding) =>
          binding.command !== commandId &&
          binding.key != null &&
          normalizeAccelerator(binding.key, isMacOS) === normalizeAccelerator(accelerator, isMacOS),
      ),
  );
}

/** 首个加速键（原 `H6`，导出 `kt`）。 */
export function firstAcceleratorForCommand({
  commandId,
  keymapState,
  isMacOS,
}: {
  commandId: string;
  keymapState?: KeymapState | null;
  isMacOS: boolean;
}): string | null {
  return acceleratorsForCommand({ commandId, keymapState, isMacOS })[0] ?? null;
}

/** 菜单标题对（原 `W6`，导出 `Mt`）。 */
export function menuTitleForCommand({ commandId }: { commandId: string }): { menuTitle: string; menuTitleIntlId: string } | null {
  const binding = electronBindingFor(findCommandDefinition(commandId));
  return binding?.menuTitle == null || binding.menuTitleIntlId == null
    ? null
    : { menuTitle: binding.menuTitle, menuTitleIntlId: binding.menuTitleIntlId };
}

// ---------------------------------------------------------------------------
// keybindings.json 读写（原 `Y6`..`x8`）
// ---------------------------------------------------------------------------

const KEYMAP_FILENAME = "keybindings.json";

/** 旧命令名迁移表（原 `X6`）。 */
const LEGACY_COMMAND_ALIASES: Record<string, string | string[]> = {
  closeTabOrWindow: ["closeTab", "closeWindow"],
  newThread: "newTask",
  toggleBrowserPanel: "stepWorkspaceLayout",
  toggleSidePanelFullWidth: "toggleMaximizeSidePanel",
};

const keymapBindingSchema = z.object({ command: z.string(), key: z.string().nullable() });
const keymapBindingsSchema = z.array(keymapBindingSchema);

const keymapLogger = memoizedTaggedLogger("codex-command-keymap");

/** codex home（原 `xM` 的 shared 侧形态；WSL 分支由 hosts-wsl 分区承接）。 */
function resolveCodexHome(): string {
  return process.env.CODEX_HOME ?? join(homedir(), ".codex");
}

/** keymap 文件路径（原 `e8`）。 */
function keymapFilePath(): string {
  return join(resolveCodexHome(), KEYMAP_FILENAME);
}

function isNodeEnoent(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
}

function isMacOSPlatform(): boolean {
  return process.platform === "darwin";
}

/** 空 keymap（原 `i8`）。 */
function emptyKeymap(keymapPath: string): KeymapState {
  return { supported: true, keymapPath, bindings: [] };
}

/** 解析 keymap 文本（原 `r8`：JSON + zod + 旧名迁移 + 未知命令过滤）。 */
function parseKeymap(keymapPath: string, text: string): KeymapState {
  if (text.trim().length === 0) return emptyKeymap(keymapPath);
  try {
    return {
      supported: true,
      keymapPath,
      bindings: filterKnownConfigurable(expandLegacyAliases(keymapBindingsSchema.parse(JSON.parse(text)) as KeymapBinding[])),
    };
  } catch (error) {
    keymapLogger().warning("Failed to parse command keymap", { safe: {}, sensitive: { error } });
    return emptyKeymap(keymapPath);
  }
}

/** 异步读 keymap（原 `t8`，导出 `St`）。 */
export async function readKeymap(): Promise<KeymapState> {
  const keymapPath = keymapFilePath();
  try {
    return parseKeymap(keymapPath, await readFile(keymapPath, "utf8"));
  } catch (error) {
    if (!isNodeEnoent(error))
      keymapLogger().warning("Failed to read command keymap", { safe: {}, sensitive: { error } });
    return emptyKeymap(keymapPath);
  }
}

/** 同步读 keymap（原 `n8`，导出 `Ct`）。 */
export function readKeymapSync(): KeymapState {
  const keymapPath = keymapFilePath();
  try {
    return parseKeymap(keymapPath, readFileSync(keymapPath, "utf8"));
  } catch (error) {
    if (!isNodeEnoent(error))
      keymapLogger().warning("Failed to read command keymap", { safe: {}, sensitive: { error } });
    return emptyKeymap(keymapPath);
  }
}

/** 同步解析当前加速键（原 `o8`，导出 `xt`）。 */
export function acceleratorsForCommandSync({ commandId, isMacOS }: { commandId: string; isMacOS: boolean }): string[] {
  return acceleratorsForCommand({ commandId, keymapState: readKeymapSync(), isMacOS });
}

/** 同步首个加速键（原 `a8`，导出 `bt`）。 */
export function firstAcceleratorSync({ commandId, isMacOS }: { commandId: string; isMacOS: boolean }): string | null {
  return acceleratorsForCommandSync({ commandId, isMacOS })[0] ?? null;
}

/** 写 keymap（原 `y8`：排序后 2 空格缩进 + 尾随换行）。 */
async function writeKeymapFile(keymapPath: string, bindings: KeymapBinding[]): Promise<void> {
  await mkdir(dirname(keymapPath), { recursive: true });
  const sorted = sortedBindings(bindings);
  await writeFile(keymapPath, `${JSON.stringify(sorted, null, 2)}\n`);
}

/** 更新绑定状态机（原 `s8`，导出 `Tt`）。 */
export async function updateKeymapBinding({
  commandId,
  update,
  primaryNumberShortcutTarget,
}: {
  commandId: string;
  update: KeymapUpdate;
  primaryNumberShortcutTarget?: PrimaryNumberShortcutTarget;
}): Promise<KeymapState> {
  const keymapPath = keymapFilePath();
  const state: KeymapState = { ...(await readKeymap()), primaryNumberShortcutTarget };
  if (!hasCommandDefinition(commandId)) throw new Error("Unknown Codex command");
  const definition = findCommandDefinition(commandId);
  if (definition == null || !isShortcutConfigurable(definition))
    throw new Error(`Codex command is not configurable: ${commandId}`);
  const isMacOS = isMacOSPlatform();
  const current = acceleratorsForCommand({ commandId, keymapState: state, isMacOS });
  let bindings = state.bindings;
  let removed: string[] = current;
  switch (update.type) {
    case "set":
      bindings = setCommandBindings(
        bindings,
        commandId,
        replacementAcceleratorsForSet({ commandId, keymapState: state, accelerator: update.accelerator, isMacOS }),
      );
      break;
    case "replace":
      bindings = setCommandBindings(
        bindings,
        commandId,
        current.map((accelerator) => (accelerator === update.previousAccelerator ? update.accelerator : accelerator)),
      );
      removed = [update.previousAccelerator];
      break;
    case "append":
      bindings = setCommandBindings(bindings, commandId, [...current, update.accelerator]);
      removed = [];
      break;
    case "remove":
      bindings = setCommandBindings(
        bindings,
        commandId,
        current.filter((accelerator) => accelerator !== update.accelerator),
      );
      removed = [update.accelerator];
      break;
    case "clear":
      bindings = setCommandBindings(bindings, commandId, []);
      break;
    case "reset":
      bindings = withoutCommandBindings(bindings, commandId);
  }
  // 新绑定抢占：同冲突组或同加速键的其他命令让位（原第一遍循环）。
  if (update.type === "set" || update.type === "replace" || update.type === "append")
    for (const other of COMMAND_DEFINITIONS)
      if (other.id !== commandId)
        if (commandsConflict(other.id, commandId) || acceleratorsForCommand({ commandId: other.id, keymapState: state, isMacOS }).includes(update.accelerator))
          bindings = removeAcceleratorFromCommand(bindings, other.id, update.accelerator, primaryNumberShortcutTarget);
  // 被移除绑定的墓碑清理：唯一绑定是 null 且默认键包含被移除键 → 删除墓碑恢复默认（原 `f8`）。
  const added = update.type === "set" || update.type === "replace" || update.type === "append" ? update.accelerator : null;
  for (const accelerator of removed)
    if (accelerator !== added) bindings = pruneStaleTombstones(commandId, accelerator, bindings, isMacOS, primaryNumberShortcutTarget);
  bindings = sortedBindings(bindings);
  await writeKeymapFile(keymapPath, bindings);
  return { ...state, keymapPath, bindings };
}

/** 重置全部绑定（原 `c8`，导出 `wt`）。 */
export async function resetKeybindings(): Promise<KeymapState> {
  const keymapPath = keymapFilePath();
  const state = await readKeymap();
  await writeKeymapFile(keymapPath, []);
  return { ...state, keymapPath, bindings: [] };
}

/** set 更新的替换表（原 `l8`：保位替换，无现值则单条）。 */
function replacementAcceleratorsForSet({
  commandId,
  keymapState,
  accelerator,
  isMacOS,
}: {
  commandId: string;
  keymapState: KeymapState;
  accelerator: string;
  isMacOS: boolean;
}): string[] {
  const current = acceleratorsForCommand({ commandId, keymapState, isMacOS });
  return current.length === 0 ? [accelerator] : uniqueAccelerators([accelerator, ...current.slice(1)]);
}

/** 覆盖命令绑定（原 `u8`：空表 → key:null 墓碑）。 */
function setCommandBindings(bindings: KeymapBinding[], commandId: string, accelerators: string[]): KeymapBinding[] {
  const rest = withoutCommandBindings(bindings, commandId);
  if (accelerators.length === 0) return [...rest, { command: commandId, key: null }];
  return [...rest, ...uniqueAccelerators(accelerators).map((accelerator) => ({ command: commandId, key: accelerator }))];
}

/** 从命令上摘除一个加速键（原 `d8`）。 */
function removeAcceleratorFromCommand(
  bindings: KeymapBinding[],
  commandId: string,
  accelerator: string,
  primaryNumberShortcutTarget: PrimaryNumberShortcutTarget | undefined,
): KeymapBinding[] {
  if (primaryNumberShortcutTarget != null && isNumberedTabCommand(commandId))
    return bindings.filter((binding) => binding.command !== commandId || binding.key !== accelerator);
  const existing = bindingsForCommand(bindings, commandId);
  const remaining = existing.flatMap((binding) => (binding.key == null || binding.key === accelerator ? [] : [binding.key]));
  if (remaining.length > 0) return setCommandBindings(bindings, commandId, remaining);
  if (
    defaultAcceleratorsForCommand({ commandId, isMacOS: isMacOSPlatform(), primaryNumberShortcutTarget }).includes(accelerator)
  )
    return setCommandBindings(bindings, commandId, []);
  return existing.length > 0 ? withoutCommandBindings(bindings, commandId) : bindings;
}

/** 清理失效墓碑（原 `f8`）。 */
function pruneStaleTombstones(
  commandId: string,
  removedAccelerator: string,
  bindings: KeymapBinding[],
  isMacOS: boolean,
  primaryNumberShortcutTarget: PrimaryNumberShortcutTarget | undefined,
): KeymapBinding[] {
  let result = bindings;
  for (const definition of COMMAND_DEFINITIONS) {
    if (primaryNumberShortcutTarget != null && isNumberedTabCommand(definition.id)) continue;
    const existing = bindingsForCommand(result, definition.id);
    if (
      definition.id !== commandId &&
      existing.length === 1 &&
      existing[0]?.key == null &&
      defaultAcceleratorsForCommand({ commandId: definition.id, isMacOS, primaryNumberShortcutTarget }).includes(removedAccelerator)
    )
      result = withoutCommandBindings(result, definition.id);
  }
  return result;
}

/** 命令的现有绑定（原 `p8`）。 */
function bindingsForCommand(bindings: KeymapBinding[], commandId: string): KeymapBinding[] {
  return bindings.filter((binding) => binding.command === commandId);
}

/** 删除命令全部绑定（原 `m8`）。 */
function withoutCommandBindings(bindings: KeymapBinding[], commandId: string): KeymapBinding[] {
  return bindings.filter((binding) => binding.command !== commandId);
}

/** 去重（原 `g8`）。 */
function uniqueAccelerators(accelerators: string[]): string[] {
  return Array.from(new Set(accelerators));
}

/** 未知/不可配置命令过滤（原 `_8`）。 */
function filterKnownConfigurable(bindings: KeymapBinding[]): KeymapBinding[] {
  const result: KeymapBinding[] = [];
  for (const binding of bindings) {
    if (!hasCommandDefinition(binding.command)) continue;
    const definition = findCommandDefinition(binding.command);
    if (definition != null && isShortcutConfigurable(definition)) result.push(binding);
  }
  return result;
}

/** 旧命令名迁移（原 `v8`）。 */
function expandLegacyAliases(bindings: KeymapBinding[]): KeymapBinding[] {
  return bindings.flatMap((binding) => {
    const mapped = LEGACY_COMMAND_ALIASES[binding.command];
    return mapped == null
      ? [binding]
      : (typeof mapped === "string" ? [mapped] : mapped).map((command) => ({ ...binding, command }));
  });
}

/** 按命令名排序（原 `b8`）。 */
function sortedBindings(bindings: KeymapBinding[]): KeymapBinding[] {
  return [...bindings].sort((a, b) => a.command.localeCompare(b.command));
}

// ---------------------------------------------------------------------------
// 兼容导出（keymap-menus 区 16 个压缩名）
// ---------------------------------------------------------------------------

export {
  acceleratorsForCommand as At,
  readKeymapSync as Ct,
  WEBVIEW_THREAD_COMMANDS as Dt,
  WEBVIEW_FOCUS_TAB_COMMANDS as Et,
  COMMAND_DEFINITIONS as Ft,
  menuTitleForCommand as Mt,
  commandAvailableForAccess as Nt,
  findCommandDefinition as Ot,
  isMouseAccelerator as Pt,
  readKeymap as St,
  updateKeymapBinding as Tt,
  firstAcceleratorSync as bt,
  defaultAcceleratorsForCommand as jt,
  firstAcceleratorForCommand as kt,
  resetKeybindings as wt,
  acceleratorsForCommandSync as xt,
};
