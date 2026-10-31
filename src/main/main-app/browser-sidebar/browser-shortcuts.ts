// browser sidebar 键盘快捷键：命令表 + before-input 工厂（tab 导航/关闭/
// 地址栏/注释模式切换）。
//
// 对应 main-C-Mhak1n.ts 106,621-106,782：
//   - BGe/VGe：tab 导航命令表 + 面板命令表（n.Et 基础表 + focusBrowserAddressBar/
//     nextRecentThread/quickChat 等）
//   - HGe：before-input-event 工厂（closeTab → closeBrowserTab；命令表命中 →
//     owner.focus + runCommandInOwner（allowAppShellTabShortcut 受线程导航锁
//     约束）；CmdOrCtrl+. → 注释/浏览模式切换）
//   - UGe：find-in-page 保留键（CmdOrCtrl+F/G、macOS Command+Shift+G 其余
//     Shift+F3）放行
//   - WGe：CmdOrCtrl+. → set-interaction-mode（comment 可用性判定）
//   - mq：keymap → 19 个命令的 accelerator 映射
//   - GGe/hq/gq/KGe：命令匹配（tab 命令与面板命令双表；closeOtherTabs 优先
//     取 tab 命令；repeat 受 webview 命令 allowsKeyRepeat 约束）
//
// 模块加载期副作用：无。

import {
  Et as baseCommandList,
  Ot as commandDefinition,
  At as acceleratorsForCommand,
  jt as defaultAcceleratorsFor,
} from "@chunk/shared";
import {
  actionForEvent,
  matchesAccelerator,
  matchesDomAcceleratorEvent,
  toDomKeyboardEvent,
  type InputEvent,
} from "./app-shell-keyboard";

/** tab 导航命令（原 `BGe`）。 */
const TAB_COMMANDS = ["nextTab", "previousTab"];

/** 面板命令（原 `VGe`：shared 基础表 + 浏览器侧命令）。 */
const PANEL_COMMANDS = [
  ...(baseCommandList as string[]),
  "focusBrowserAddressBar",
  "nextRecentThread",
  "nextThread",
  "nextThreadNeedingAttention",
  "openBrowserTab",
  "previousRecentThread",
  "previousThread",
  "quickChat",
  "reopenClosedTab",
  "closeOtherTabs",
];

/** 命中命令（原 `hq`）：repeat 时仅 webview 命令且 allowsKeyRepeat 才放行。 */
function matchedCommand(event: InputEvent, domEvent: ReturnType<typeof toDomKeyboardEvent>, acceleratorsOf: (commandId: string) => string[], commands: string[]): string | null {
  for (const commandId of commands) {
    for (const accelerator of acceleratorsOf(commandId)) {
      if (accelerator.includes(" ") || !matchesDomAcceleratorEvent(domEvent, accelerator)) continue;
      const definition = commandDefinition(commandId) as { kind?: string; allowsKeyRepeat?: boolean } | null;
      return event.isAutoRepeat && (definition?.kind !== "webview" || definition.allowsKeyRepeat !== true) ? null : commandId;
    }
  }
  return null;
}

/** 命令匹配器（原 `GGe`）：tab 命令与面板命令双表；closeOtherTabs 优先 tab 表。 */
function createCommandMatcher(getOwnerCommandAccelerators: (commandId: string) => string[]): (event: InputEvent) => { allowAppShellTabShortcut?: boolean; commandId: string } | null {
  return (event) => {
    if (event.type !== "keyDown") return null;
    const domEvent = toDomKeyboardEvent(event);
    const tabCommand = matchedCommand(event, domEvent, getOwnerCommandAccelerators, TAB_COMMANDS);
    const panelCommand = matchedCommand(event, domEvent, getOwnerCommandAccelerators, PANEL_COMMANDS);
    return tabCommand != null && panelCommand != null
      ? panelCommand === "closeOtherTabs"
        ? { commandId: tabCommand }
        : { allowAppShellTabShortcut: true, commandId: panelCommand }
      : tabCommand == null
        ? panelCommand == null
          ? null
          : { commandId: panelCommand }
        : { commandId: tabCommand };
  };
}

/** find-in-page 保留键（原 `UGe`）：命中则交由 find-in-page 状态机处理。 */
function isFindInPageShortcut(event: InputEvent): boolean {
  return (
    matchesAccelerator(event, "CmdOrCtrl+F") ||
    matchesAccelerator(event, "CmdOrCtrl+G") ||
    matchesAccelerator(event, process.platform === "darwin" ? "Command+Shift+G" : "Shift+F3")
  );
}

/** 注释模式切换（原 `WGe`）：CmdOrCtrl+. + comment 可用。 */
function commentModeToggle(event: InputEvent, { interactionMode, isCommentModeAvailable }: { interactionMode: string; isCommentModeAvailable: boolean }): { type: "set-interaction-mode"; interactionMode: "comment" | "browse"; annotationModeEntrySource?: string } | null {
  return !matchesAccelerator(event, "CmdOrCtrl+.") || !isCommentModeAvailable
    ? null
    : {
        type: "set-interaction-mode",
        interactionMode: interactionMode === "comment" ? "browse" : "comment",
        ...(interactionMode === "comment" ? {} : { annotationModeEntrySource: "keyboard-shortcut" }),
      };
}

/** keymap → 命令 accelerator 映射（原 `mq`，19 个命令）。 */
export function ownerCommandAcceleratorsFromKeymap(keymapState: unknown): Record<string, string[]> {
  const isMac = process.platform === "darwin";
  const acceleratorsOf = (commandId: string) => acceleratorsForCommand({ commandId, isMacOS: isMac, keymapState });
  return {
    focusTab1: acceleratorsOf("focusTab1"),
    focusTab2: acceleratorsOf("focusTab2"),
    focusTab3: acceleratorsOf("focusTab3"),
    focusTab4: acceleratorsOf("focusTab4"),
    focusTab5: acceleratorsOf("focusTab5"),
    focusTab6: acceleratorsOf("focusTab6"),
    focusTab7: acceleratorsOf("focusTab7"),
    focusTab8: acceleratorsOf("focusTab8"),
    focusTab9: acceleratorsOf("focusTab9"),
    closeOtherTabs: acceleratorsOf("closeOtherTabs"),
    closeTab: acceleratorsOf("closeTab"),
    focusBrowserAddressBar: acceleratorsOf("focusBrowserAddressBar"),
    nextTab: acceleratorsOf("nextTab"),
    nextRecentThread: acceleratorsOf("nextRecentThread"),
    nextThread: acceleratorsOf("nextThread"),
    nextThreadNeedingAttention: acceleratorsOf("nextThreadNeedingAttention"),
    openBrowserTab: acceleratorsOf("openBrowserTab"),
    previousTab: acceleratorsOf("previousTab"),
    previousRecentThread: acceleratorsOf("previousRecentThread"),
    previousThread: acceleratorsOf("previousThread"),
    quickChat: acceleratorsOf("quickChat"),
    reopenClosedTab: acceleratorsOf("reopenClosedTab"),
  };
}

/** owner 面（结构化子集）。 */
export interface ShortcutOwnerLike {
  focus(): void;
}

/**
 * browser sidebar before-input-event 工厂（原 `HGe`）：
 * closeTab 命中 → closeBrowserTab（复用 app-shell 的 close-active-app-shell-tab
 * 判定）；命令表命中 → owner.focus + runCommandInOwner（allowAppShellTabShortcut
 * 受线程导航锁约束）；CmdOrCtrl+. → 注释模式切换（进入 comment 时先捕获文本
 * 选区）。
 */
export function createBrowserSidebarKeyboardHandler({
  captureTextSelection,
  closeBrowserTab,
  getCanCloseBrowserTab,
  getInteractionMode,
  getOwnerCommandAccelerators = defaultOwnerCommandAccelerators,
  getThreadNavigationShortcutLocked = () => false,
  isCommentModeAvailable,
  owner,
  runCommandInOwner,
  setInteractionMode,
}: {
  captureTextSelection?: () => void;
  closeBrowserTab: () => void;
  getCanCloseBrowserTab: () => boolean;
  getInteractionMode: () => string;
  getOwnerCommandAccelerators?: (commandId: string) => string[];
  getThreadNavigationShortcutLocked?: () => boolean;
  isCommentModeAvailable: () => boolean;
  owner: ShortcutOwnerLike;
  runCommandInOwner: (commandId: string, keyboardEvent: ReturnType<typeof toDomKeyboardEvent>, options?: { allowAppShellTabShortcut?: boolean }) => void;
  setInteractionMode?: (interactionMode: "comment" | "browse", annotationModeEntrySource?: string) => void;
}): (event: { preventDefault(): void }, input: InputEvent) => void {
  const matchCommand = createCommandMatcher(getOwnerCommandAccelerators);
  return (event, input) => {
    if (isFindInPageShortcut(input)) return;
    if (
      actionForEvent(input, {
        allowDebugMenu: false,
        closeTabAccelerators: getOwnerCommandAccelerators("closeTab"),
        state: {
          bottomPanelBrowserCanZoom: false,
          bottomPanelBrowserConversationId: null,
          bottomPanelBrowserTabId: null,
          canAcceptAppshotShortcut: false,
          canRedoAppAction: false,
          canUndoAppAction: false,
          bottomPanelCanCloseActiveTab: false,
          focusArea: "right-panel",
          focusedEditable: null,
          imagePreviewOpen: false,
          isNewChatRoute: false,
          rightPanelBrowserCanZoom: false,
          rightPanelBrowserConversationId: null,
          rightPanelBrowserTabId: null,
          rightPanelCanCloseActiveTab: getCanCloseBrowserTab(),
        },
      })?.type === "close-active-app-shell-tab"
    ) {
      event.preventDefault();
      closeBrowserTab();
      return;
    }
    const matched = matchCommand(input);
    if (matched != null) {
      event.preventDefault();
      if (matched.commandId !== "closeOtherTabs") owner.focus();
      if (matched.allowAppShellTabShortcut && !getThreadNavigationShortcutLocked()) {
        runCommandInOwner(matched.commandId, toDomKeyboardEvent(input), { allowAppShellTabShortcut: true });
        return;
      }
      runCommandInOwner(matched.commandId, toDomKeyboardEvent(input));
      return;
    }
    const modeToggle = commentModeToggle(input, { interactionMode: getInteractionMode(), isCommentModeAvailable: isCommentModeAvailable() });
    if (modeToggle != null) {
      event.preventDefault();
      if (setInteractionMode != null) {
        if (modeToggle.interactionMode === "comment" && modeToggle.annotationModeEntrySource === "keyboard-shortcut") {
          captureTextSelection?.();
        }
        setInteractionMode(modeToggle.interactionMode, modeToggle.annotationModeEntrySource);
      }
    }
  };
}

/** 默认 accelerator 源（原 `KGe`）。 */
function defaultOwnerCommandAccelerators(commandId: string): string[] {
  return defaultAcceleratorsFor({ commandId, isMacOS: process.platform === "darwin" });
}
