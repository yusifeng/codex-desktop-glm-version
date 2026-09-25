// app-shell 键盘分派：zoom 命令判定 + accelerator ↔ 输入事件匹配器 + before-input 分派。
//
// 对应 main-C-Mhak1n.ts 98,160-98,522：
//   - iU/eVe/tVe/nVe/aU：Ctrl/Cmd +/-/0 zoom 命令判定
//   - rVe/iVe/aVe：修饰键集合、方向键别名、shift 数字/标点映射表
//   - oU/sU/oVe/cU/sVe/cVe/lVe/lU：accelerator 字符串 ↔ Electron 输入事件
//     匹配器（CmdOrCtrl/Command/Ctrl/Alt/Option 解析；alt 时 code 优先；
//     shift 时数字/标点 shift 形态匹配）
//   - uVe/uU/dU/fU/pU/mU/hU/dVe/gU/_U/fVe/vU/yU：before-input-event 分派
//     （terminal 聚焦命令、undo/redo、image preview zoom、browser sidebar
//     zoom、clear-terminal、close-active-app-shell-tab、toggle-debug-modal）
//
// 模块加载期副作用：无。

import {
  Ft as webviewCommandList,
  At as acceleratorsForCommand,
  jt as defaultAcceleratorsFor,
} from "@chunk/shared";

// ---------------------------------------------------------------------------
// zoom 命令判定（原 `iU`/`eVe`/`tVe`/`nVe`/`aU`）
// ---------------------------------------------------------------------------

/** Electron before-input 事件（结构化子集）。 */
export interface InputEvent {
  type: string;
  code: string;
  key: string;
  alt: boolean;
  control: boolean;
  meta: boolean;
  shift: boolean;
  isAutoRepeat?: boolean;
}

export interface ZoomCommand {
  type: "step-zoom" | "reset-zoom";
  delta?: number;
}

/** 主修饰键按下（原 `aU`）：macOS meta、其余 control；排除 alt。 */
function hasPrimaryModifier(event: InputEvent): boolean {
  const isMac = process.platform === "darwin";
  return (
    event.type === "keyDown" &&
    event.alt !== true &&
    (isMac ? event.meta === true && event.control !== true : event.control === true && event.meta !== true)
  );
}

/** Ctrl/Cmd +/-/0 → zoom 命令（原 `iU`）。 */
export function zoomCommandForEvent(event: InputEvent): ZoomCommand | null {
  return isZoomInEvent(event)
    ? { type: "step-zoom", delta: 1 }
    : isZoomOutEvent(event)
      ? { type: "step-zoom", delta: -1 }
      : isZoomResetEvent(event)
        ? { type: "reset-zoom" }
        : null;
}

function isZoomInEvent(event: InputEvent): boolean {
  return hasPrimaryModifier(event) && (event.code === "NumpadAdd" || event.code === "Equal" || event.key === "+" || event.key === "=");
}

function isZoomOutEvent(event: InputEvent): boolean {
  return hasPrimaryModifier(event) && (event.code === "NumpadSubtract" || event.code === "Minus" || event.key === "-" || event.key === "_");
}

function isZoomResetEvent(event: InputEvent): boolean {
  return hasPrimaryModifier(event) && event.shift !== true && (event.code === "Digit0" || event.code === "Numpad0" || event.key === "0");
}

// ---------------------------------------------------------------------------
// accelerator ↔ 输入事件匹配器（原 `oU`~`lU`）
// ---------------------------------------------------------------------------

const MODIFIER_KEYS = new Set(["Meta", "Control", "Alt", "AltGraph", "Shift"]);
const KEY_ALIASES = new Map([
  ["Escape", "Esc"],
  ["ArrowUp", "Up"],
  ["ArrowDown", "Down"],
  ["ArrowLeft", "Left"],
  ["ArrowRight", "Right"],
]);
const SHIFT_KEY_MAP = new Map([
  ["1", "!"], ["2", "@"], ["3", "#"], ["4", "$"], ["5", "%"],
  ["6", "^"], ["7", "&"], ["8", "*"], ["9", "("], ["0", ")"],
  ["-", "_"], ["=", "+"], ["[", "{"], ["]", "}"], ["\\", "|"],
  [";", ":"], ["'", '"'], [",", "<"], [".", ">"], ["/", "?"], ["`", "~"],
]);

/** 归一化 DOM 输入事件（原 `_U`）。 */
export function toDomKeyboardEvent(event: InputEvent) {
  return {
    altKey: event.alt === true,
    code: event.code,
    ctrlKey: event.control === true,
    key: event.key,
    metaKey: event.meta === true,
    repeat: event.isAutoRepeat === true,
    shiftKey: event.shift === true,
  };
}

/** 输入事件命中 accelerator（原 `oU`）。 */
export function matchesAccelerator(event: InputEvent, accelerator: string): boolean {
  return event.type !== "keyDown" || accelerator.includes(" ")
    ? false
    : matchesDomAccelerator(toDomKeyboardEvent(event), accelerator);
}

/** DOM 事件命中 accelerator（原 `sU`，供外部以 DOM 事件形态复用）。 */
export function matchesDomAcceleratorEvent(event: ReturnType<typeof toDomKeyboardEvent>, accelerator: string): boolean {
  return matchesDomAccelerator(event, accelerator);
}

function matchesDomAccelerator(event: { altKey: boolean; code: string; ctrlKey: boolean; key: string; metaKey: boolean; repeat: boolean; shiftKey: boolean }, accelerator: string): boolean {
  const parsed = parseAccelerator(accelerator);
  return (
    parsed.key.length > 0 &&
    keyMatches(event, parsed) &&
    event.ctrlKey === parsed.requireCtrl &&
    event.metaKey === parsed.requireMeta &&
    event.altKey === parsed.requireAlt &&
    event.shiftKey === parsed.requireShift
  );
}

/** accelerator 解析（原 `oVe`）：CmdOrCtrl 按平台分流。 */
function parseAccelerator(accelerator: string): { key: string; requireAlt: boolean; requireCtrl: boolean; requireMeta: boolean; requireShift: boolean } {
  const parts = accelerator.split("+").filter(Boolean);
  const isMac = process.platform === "darwin";
  let key = "";
  let requireAlt = false;
  let requireCtrl = false;
  let requireMeta = false;
  let requireShift = false;
  for (const part of parts) {
    switch (part) {
      case "CmdOrCtrl":
        if (isMac) requireMeta = true;
        else requireCtrl = true;
        break;
      case "Command":
      case "Cmd":
        requireMeta = true;
        break;
      case "Control":
      case "Ctrl":
        requireCtrl = true;
        break;
      case "Alt":
      case "Option":
        requireAlt = true;
        break;
      case "Shift":
        requireShift = true;
        break;
      default:
        key = normalizeAcceleratorKey(part);
    }
  }
  return { key, requireAlt, requireCtrl, requireMeta, requireShift };
}

/** accelerator 键名归一（原 `cU`）。 */
function normalizeAcceleratorKey(key: string): string {
  switch (key.toLowerCase()) {
    case "space":
      return " ";
    case "plus":
      return "+";
    case "esc":
    case "escape":
      return "escape";
    case "up":
    case "arrowup":
      return "arrowup";
    case "down":
    case "arrowdown":
      return "arrowdown";
    case "left":
    case "arrowleft":
      return "arrowleft";
    case "right":
    case "arrowright":
      return "arrowright";
    case "pgup":
    case "pageup":
      return "pageup";
    case "pgdn":
    case "pagedown":
      return "pagedown";
    default:
      return key.toLowerCase();
  }
}

/** 事件键命中（原 `sVe`）：shift 要求时允许 shift 形态（1→! 等）。 */
function keyMatches(event: { altKey: boolean; code: string; key: string; shiftKey: boolean }, parsed: { key: string; requireShift: boolean }): boolean {
  const eventKey = domKeyOf(event);
  return eventKey === parsed.key || (parsed.requireShift && eventKey === (SHIFT_KEY_MAP.get(parsed.key) ?? parsed.key));
}

/** DOM 事件 → 归一化键名（原 `cVe`/`lVe`）。 */
function domKeyOf(event: { altKey: boolean; code: string; key: string }): string {
  return normalizeAcceleratorKey(rawDomKey(event) ?? "");
}

function rawDomKey(event: { altKey: boolean; code: string; key: string }): string | null {
  const { key, code, altKey } = event;
  if (MODIFIER_KEYS.has(key)) return null;
  if (altKey) {
    const fromCode = keyFromCode(code);
    if (fromCode != null) return fromCode;
  }
  return key === " "
    ? "Space"
    : key === "+"
      ? "Plus"
      : (KEY_ALIASES.get(key) ?? (/^f\d{1,2}$/i.test(key) || key.length === 1 ? key.toUpperCase() : (keyFromCode(code) ?? key)));
}

/** code → 键名（原 `lU`）：KeyA→A、Digit1→1、Space。 */
function keyFromCode(code: string): string | null {
  return code == null
    ? null
    : /^Key[A-Z]$/.test(code)
      ? code.slice(3)
      : /^Digit[0-9]$/.test(code)
        ? code.slice(5)
        : code === "Space"
          ? "Space"
          : null;
}

// ---------------------------------------------------------------------------
// before-input-event 分派（原 `uVe`~`yU`）
// ---------------------------------------------------------------------------

/** 焦点状态快照（结构化子集，renderer 提供）。 */
export interface AppShellFocusState {
  bottomPanelBrowserCanZoom?: boolean;
  bottomPanelBrowserConversationId?: string | null;
  bottomPanelBrowserTabId?: string | null;
  bottomPanelCanCloseActiveTab?: boolean;
  canAcceptAppshotShortcut?: boolean;
  canRedoAppAction?: boolean;
  canUndoAppAction?: boolean;
  focusArea: "bottom-panel" | "main" | "right-panel" | "hidden-browser-use" | null;
  focusedEditable?: string | null;
  imagePreviewOpen?: boolean;
  isNewChatRoute?: boolean;
  rightPanelBrowserCanZoom?: boolean;
  rightPanelBrowserConversationId?: string | null;
  rightPanelBrowserTabId?: string | null;
  rightPanelCanCloseActiveTab?: boolean;
  terminalFocused?: boolean;
}

/** 分派动作。 */
export type AppShellAction =
  | { type: "run-command"; id: string; keyboardEvent: ReturnType<typeof toDomKeyboardEvent> }
  | { type: "toggle-debug-modal" }
  | { type: "image-preview-zoom-command"; command: ZoomCommand }
  | { type: "browser-sidebar-command"; conversationId: string; browserTabId: string; command: ZoomCommand }
  | { type: "clear-active-terminal" }
  | { type: "close-active-app-shell-tab"; panelId: "bottom" | "right" };

/** 终端命令（webview 命令表项，结构化子集）。 */
interface TerminalCommand {
  id: string;
  kind: string;
  allowsKeyRepeat?: boolean;
}

/** closeTab 的默认 accelerator（原 `yU`）。 */
function defaultCloseTabAccelerators(): string[] {
  return defaultAcceleratorsFor({ commandId: "closeTab", isMacOS: process.platform === "darwin" });
}

/** Ctrl/Cmd+<key> 判定（原 `gU`）。 */
function isPrimaryShortcut(event: InputEvent, key: string): boolean {
  const isMac = process.platform === "darwin";
  return (
    event.type === "keyDown" &&
    event.key.toLowerCase() === key &&
    event.alt !== true &&
    event.shift !== true &&
    (isMac ? event.meta === true && event.control !== true : event.control === true && event.meta !== true)
  );
}

/** 命中 keymap 命令（原 `vU`）。 */
function matchesCommand(event: InputEvent, commandId: string, keymapState: unknown): boolean {
  return acceleratorsForCommand({ commandId, keymapState, isMacOS: process.platform === "darwin" }).some((accelerator: string) =>
    matchesAccelerator(event, accelerator),
  );
}

/** 终端聚焦时的命令（原 `fVe`）：webview 命令表查找。 */
function terminalCommandForEvent(event: InputEvent, keymapState: unknown): TerminalCommand | null {
  return ((webviewCommandList as TerminalCommand[]).find((command) => matchesCommand(event, command.id, keymapState)) ?? null);
}

/** 面板归属（原 `dVe`/`fU`/`hU`/`mU`）。 */
function panelForConversation(state: AppShellFocusState | null, conversationId: string | null, tabId: string | null): "bottom" | "right" | null {
  return state?.bottomPanelBrowserConversationId === conversationId && state.bottomPanelBrowserTabId === tabId
    ? "bottom"
    : state?.rightPanelBrowserConversationId === conversationId && state.rightPanelBrowserTabId === tabId
      ? "right"
      : null;
}

function focusAreaPanel(state: AppShellFocusState | null): "bottom" | "right" | null {
  switch (state?.focusArea) {
    case "bottom-panel":
      return "bottom";
    case "main":
    case "right-panel":
      return "right";
    case "hidden-browser-use":
    case null:
      return null;
  }
}

/** close-active-app-shell-tab 动作（原 `dU`/`pU`/`mU`）。 */
function closeTabAction(state: AppShellFocusState | null, conversationId?: string | null, tabId?: string | null, forcedPanel?: "bottom" | "right" | null): AppShellAction | null {
  if (state == null) return null;
  let panel: "bottom" | "right" | null;
  if (forcedPanel != null) panel = forcedPanel;
  else if (conversationId != null && tabId != null) {
    const matched = panelForConversation(state, conversationId, tabId);
    panel = matched ?? focusAreaPanel(state);
  } else panel = focusAreaPanel(state);
  switch (panel) {
    case "bottom":
      return state.bottomPanelCanCloseActiveTab ? { panelId: "bottom", type: "close-active-app-shell-tab" } : null;
    case "right":
      return state.rightPanelCanCloseActiveTab ? { panelId: "right", type: "close-active-app-shell-tab" } : null;
    case null:
      return null;
  }
}

/** 单事件 → 动作（原 `uU`，供 browser-shortcuts 复用）。 */
export function actionForEvent(
  event: InputEvent,
  {
    allowDebugMenu,
    closeTabAccelerators = defaultCloseTabAccelerators(),
    getCommandKeymapState = () => null,
    state,
  }: {
    allowDebugMenu: boolean;
    closeTabAccelerators?: string[];
    getCommandKeymapState?: () => unknown;
    state: AppShellFocusState | null;
  },
): AppShellAction | null {
  const keymapState = getCommandKeymapState();
  if (allowDebugMenu && matchesCommand(event, "toggleDebugModal", keymapState)) return { type: "toggle-debug-modal" };
  if (state == null) return null;
  if (
    (state.canUndoAppAction || state.canRedoAppAction) &&
    event.type === "keyDown" &&
    state.focusArea === "main" &&
    (state.focusedEditable == null || state.focusedEditable === "composer") &&
    state.terminalFocused !== true &&
    event.isAutoRepeat !== true
  ) {
    const command =
      state.canUndoAppAction && matchesCommand(event, "undoAppAction", keymapState)
        ? "undoAppAction"
        : state.canRedoAppAction && matchesCommand(event, "redoAppAction", keymapState)
          ? "redoAppAction"
          : null;
    if (command != null) return { type: "run-command", id: command, keyboardEvent: toDomKeyboardEvent(event) };
  }
  if (state.imagePreviewOpen) {
    const zoom = zoomCommandForEvent(event);
    if (zoom != null) return { type: "image-preview-zoom-command", command: zoom };
  }
  let browserConversationId: string | null = null;
  let browserTabId: string | null = null;
  switch (state.focusArea) {
    case "bottom-panel":
      if (state.bottomPanelBrowserCanZoom) {
        browserConversationId = state.bottomPanelBrowserConversationId ?? null;
        browserTabId = state.bottomPanelBrowserTabId ?? null;
      }
      break;
    case "main":
      break;
    case "right-panel":
      if (state.rightPanelBrowserCanZoom) {
        browserConversationId = state.rightPanelBrowserConversationId ?? null;
        browserTabId = state.rightPanelBrowserTabId ?? null;
      }
      break;
  }
  if (browserConversationId != null && browserTabId != null) {
    const zoom = zoomCommandForEvent(event);
    if (zoom != null)
      return { type: "browser-sidebar-command", conversationId: browserConversationId, browserTabId: browserTabId, command: zoom };
  }
  return state.terminalFocused === true && isPrimaryShortcut(event, "k")
    ? { type: "clear-active-terminal" }
    : closeTabAccelerators.some((accelerator) => matchesAccelerator(event, accelerator))
      ? closeTabAction(state)
      : null;
}

/**
 * before-input-event 处理器工厂（原 `uVe`）：
 * terminal 聚焦时优先走 webview 命令表（非 webview 命令 preventDefault 后
 * run-command；repeat 受 allowsKeyRepeat 约束）；其余按焦点状态分派。
 */
export function createAppShellKeyboardDispatcher({
  allowDebugMenu,
  getCloseTabAccelerators = defaultCloseTabAccelerators,
  getCommandKeymapState = () => null,
  getState,
  sendAction,
}: {
  allowDebugMenu: boolean;
  getCloseTabAccelerators?: () => string[];
  getCommandKeymapState?: () => unknown;
  getState: () => AppShellFocusState | null;
  sendAction: (action: AppShellAction) => void;
}): (event: { preventDefault(): void } & InputEvent, webContents: unknown) => void {
  return (event, _webContents) => {
    const state = getState();
    if (state?.terminalFocused === true && isPrimaryShortcut(event, "t")) {
      const command = terminalCommandForEvent(event, getCommandKeymapState());
      if (command != null && command.kind !== "webview") return;
      event.preventDefault();
      if (command != null && (event.isAutoRepeat !== true || command.allowsKeyRepeat === true)) {
        sendAction({ type: "run-command", id: command.id, keyboardEvent: toDomKeyboardEvent(event) });
      }
      return;
    }
    const action = actionForEvent(event, {
      allowDebugMenu,
      closeTabAccelerators: getCloseTabAccelerators(),
      getCommandKeymapState,
      state,
    });
    if (action != null) {
      event.preventDefault();
      if (action.type !== "toggle-debug-modal" || event.isAutoRepeat !== true) sendAction(action);
    }
  };
}
