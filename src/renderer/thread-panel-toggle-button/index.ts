// Thread panel launcher, new-tab actions, toolbar controls and layout bridge.
import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import "@rchunk/thread-shell-runtime";
import "@rchunk/appgen-card-layout";
import "@rchunk/google-drive-resource-icon";
import "@rchunk/artifact-file-preview-icon";
import "@rchunk/local-conversation-artifacts-signals";
import "@rchunk/tab-input";
import "@rchunk/text-shorter";
import "@rchunk/local-conversation-side-chat";
import "@rchunk/thread-side-panel-tabs";
import "@rchunk/local-conversation-external-resource-icon";
import "@rchunk/local-conversation-summary-panel-image-preview";
import "@rchunk/partition";
import "@rchunk/thread-emoji";
import "@rchunk/quick-chat-drop-zones";
import "@rchunk/view-control-labels";
import "@rchunk/registered-conversation-thumbnail";
import "@rchunk/thread-tab-entity";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type UnknownRecord = Record<string, unknown>;
export interface PanelArtifact { id?: string; name?: string; title?: string; type?: string; url?: string; [key: string]: unknown }
export interface PanelAction {
  deferSelectionUntilDropdownClose?: boolean; disabled?: boolean; icon?: unknown; id: string;
  keyboardShortcut?: string; label: string; onSelect(): boolean | void; shortcut?: string; subText?: unknown;
}
export interface LauncherState {
  actions: PanelAction[]; hasOutputArtifacts: boolean; onOpenArtifact?(artifact: PanelArtifact): void; outputArtifacts: PanelArtifact[];
}
export interface PanelLauncherOptions {
  actions?: PanelAction[]; capabilities?: Partial<Record<string, boolean>>; isCommandActive?: boolean;
  loadArtifactSuggestions?: boolean; onClose?(): void; onOpenArtifact?(artifact: PanelArtifact): void;
  outputArtifacts?: PanelArtifact[]; surface?: "new-tab" | "panel-launcher"; target?: "left" | "right" | "bottom";
  onOpenBrowser?(): void; onOpenReview?(): void; onOpenSideChat?(): void; onOpenTerminal?(): void; onSearchFiles?(): void;
}
export interface PanelLauncherProps extends PanelLauncherOptions {
  children?: unknown; onActionSelect?(action: PanelAction): void; onToggleBottomPanel?(): void;
}

const shared = sharedChunk as unknown as UnknownRecord;
const initial = initialChunk as unknown as UnknownRecord;
const primary = primaryChunk as unknown as UnknownRecord;
let jsx: JsxRuntime;
let React: ReactRuntime;
let LazyLocalConversationSideChatTab: unknown;
let initialized = false;

function getJsx(): JsxRuntime {
  if (jsx == null) jsx = (sharedChunk.I3 as () => JsxRuntime)();
  return jsx;
}
function getReact(): ReactRuntime {
  if (React == null) {
    const candidate = sharedChunk.e6 as unknown;
    React = (typeof candidate === "function" && !(candidate as { useState?: unknown }).useState
      ? (candidate as () => ReactRuntime)()
      : candidate) as ReactRuntime;
  }
  return React;
}
function classNames(...values: Array<string | false | null | undefined>): string {
  const runtimeClassNames = shared.m4;
  return typeof runtimeClassNames === "function" ? (runtimeClassNames as (...input: unknown[]) => string)(...values) : values.filter(Boolean).join(" ");
}

function ToolbarIconButton(props: UnknownRecord & { size?: string }): unknown {
  const { size = "toolbar", ...rest } = props;
  const Button = shared.Yh ?? "button";
  return getJsx().jsx(Button as never, { size, ...rest });
}
function initializeToolbarIconButton(): void { getJsx(); }
function TabStackIcon({ count = 0 }: { count?: number | null }): unknown {
  const r = getJsx();
  return r.jsxs("span", { className: "relative inline-flex shrink-0", "aria-hidden": true, children: [
    r.jsx("span", { className: "tab-stack-icon", children: count === 0 ? "□" : "▣" }),
    count > 0 ? r.jsx("span", { className: "tab-stack-count", "data-multiple-digits": count > 9, children: count > 9 ? "9+" : count }) : null,
  ] });
}
function initializeTabStackIcon(): void { getJsx(); }

function createDefaultActions(options: PanelLauncherOptions): PanelAction[] {
  const capability = (id: string): boolean => options.capabilities?.[id] !== false;
  const definitions: Array<[string, string, (() => void) | undefined, string]> = [
    ["search-files", "Search files", options.onSearchFiles, "⌘P"],
    ["side-chat", "Open side chat", options.onOpenSideChat, "⌘⇧I"],
    ["browser", "Open browser", options.onOpenBrowser, "⌘⇧B"],
    ["review", "Open review", options.onOpenReview, "⌘⇧R"],
    ["terminal", "Toggle terminal", options.onOpenTerminal, "⌘J"],
  ];
  const actions: PanelAction[] = [];
  for (const [id, label, handler, shortcut] of definitions) {
    if (handler == null && options.capabilities?.[id] == null) continue;
    actions.push({ id, label, shortcut, keyboardShortcut: shortcut, disabled: !capability(id), onSelect: () => { if (!capability(id)) return false; handler?.(); options.onClose?.(); return true; } });
  }
  return actions;
}
function usePanelLauncher(options: PanelLauncherOptions = {}): LauncherState {
  // The published hook derives these from scoped runtime signals. Explicit props remain the
  // testable boundary, while injected runtime state supplies them in the desktop app.
  const injected = typeof initial.usePanelLauncherState === "function"
    ? (initial.usePanelLauncherState as (input: PanelLauncherOptions) => Partial<LauncherState>)(options)
    : undefined;
  const actions = options.actions ?? injected?.actions ?? createDefaultActions(options);
  const outputArtifacts = options.outputArtifacts ?? injected?.outputArtifacts ?? [];
  const onOpenArtifact = options.onOpenArtifact ?? injected?.onOpenArtifact;
  return { actions, outputArtifacts, onOpenArtifact, hasOutputArtifacts: outputArtifacts.length > 0 };
}
function initializePanelLauncherActions(): void { getJsx(); }

function ActionList({ actions, onActionSelect }: { actions: PanelAction[]; onActionSelect(action: PanelAction): void }): unknown {
  const r = getJsx();
  return r.jsx("ul", { role: "menu", className: "panel-launcher-actions", children: actions.map((action) => r.jsx("li", {
    children: r.jsxs("button", { type: "button", role: "menuitem", disabled: action.disabled,
      onClick: () => onActionSelect(action), children: [action.icon, r.jsx("span", { children: action.label }),
        action.shortcut == null ? null : r.jsx("kbd", { children: action.shortcut })] }),
  }, action.id)) });
}
function ArtifactList({ artifacts, onOpen }: { artifacts: PanelArtifact[]; onOpen?(artifact: PanelArtifact): void }): unknown {
  if (artifacts.length === 0) return null;
  const r = getJsx();
  return r.jsxs("section", { "aria-label": "Output artifacts", children: [r.jsx("h3", { children: "Output" }), r.jsx("ul", {
    children: artifacts.map((artifact, index) => r.jsx("li", { children: r.jsx("button", { type: "button", onClick: () => onOpen?.(artifact),
      children: artifact.title ?? artifact.name ?? artifact.id ?? `Artifact ${index + 1}` }) }, String(artifact.id ?? index))),
  })] });
}
function PanelLauncher(props: PanelLauncherProps = {}): unknown {
  const r = getJsx();
  const launcher = usePanelLauncher(props);
  const select = props.onActionSelect ?? ((action: PanelAction) => { action.onSelect(); });
  const list = ActionList({ actions: launcher.actions, onActionSelect: select });
  const artifacts = ArtifactList({ artifacts: launcher.outputArtifacts, onOpen: launcher.onOpenArtifact });
  if (props.surface === "new-tab") {
    return r.jsx("div", { "data-new-tab-scroll-root": true, className: "new-tab-panel-launcher", children: r.jsxs("div", {
      className: "new-tab-panel-launcher__content", children: [list, props.children, artifacts],
    }) });
  }
  return r.jsxs("div", { "data-panel-launcher-surface": props.surface ?? "panel-launcher", "data-panel-target": props.target ?? "right",
    children: [list, artifacts] });
}
function initializePanelLauncher(): void { getJsx(); getReact(); }

function PanelLauncherDropdown(props: { launcher: LauncherState; onOpenChange?(open: boolean): void; open: boolean; triggerButton: unknown }): unknown {
  const r = getJsx();
  return r.jsxs("div", { "data-panel-launcher-dropdown": props.open, children: [props.triggerButton,
    props.open ? PanelLauncher({ actions: props.launcher.actions, outputArtifacts: props.launcher.outputArtifacts,
      onOpenArtifact: props.launcher.onOpenArtifact, onClose: () => props.onOpenChange?.(false) }) : null] });
}
function initializePanelLauncherDropdown(): void { getJsx(); }

function PanelLauncherContextMenu(props: PanelLauncherProps & { children: unknown; onOpenChange?(open: boolean): void }): unknown {
  const state = getReact();
  const [open, setOpen] = state.useState(false);
  const launcher = usePanelLauncher(props);
  const setOpenState = (next: boolean) => { setOpen(next); props.onOpenChange?.(next); };
  const trigger = getJsx().jsx("span", { onContextMenu: (event: { preventDefault(): void; stopPropagation(): void }) => {
    event.preventDefault(); event.stopPropagation(); setOpenState(true);
  }, children: props.children });
  return getJsx().jsx(PanelLauncherDropdown, { launcher, open, onOpenChange: setOpenState, triggerButton: trigger });
}
function initializePanelLauncherContextMenu(): void { getJsx(); getReact(); }

function ThreadPanelToolbar(props: { leadingToolbar?: unknown; mainToolbar?: unknown; trailingToolbar?: unknown }): unknown {
  const r = getJsx();
  return r.jsxs(r.Fragment, { children: [props.leadingToolbar ?? null, props.mainToolbar ?? null, props.trailingToolbar ?? null] });
}
function initializeThreadPanelToolbar(): void { getJsx(); }
function ToolbarButton(props: { children?: unknown; color?: "outline" | string; disabled?: boolean; label: string; onClick?(): void; pressed?: boolean; shortcut?: string }): unknown {
  const Button = shared.Yh ?? "button";
  const color = props.color === "outline" ? (props.pressed ? "outlineActive" : "outline") : props.pressed ? "secondary" : (props.color ?? "ghost");
  const control = getJsx().jsx(Button as never, { "aria-label": props.label, "aria-pressed": props.pressed, color,
    disabled: props.disabled, onClick: props.onClick, size: "toolbar", uniform: true, children: props.children });
  const Tooltip = shared.jf;
  return typeof Tooltip === "function" ? getJsx().jsx(Tooltip as never, { tooltipContent: props.label, shortcut: props.shortcut, delayOpen: true, children: control })
    : { ...(control as UnknownRecord), props: { ...((control as { props?: UnknownRecord }).props ?? {}), title: props.shortcut == null ? props.label : `${props.label} (${props.shortcut})` } };
}

function PanelLayoutBridge(props: { controller?: { setLayout?(layout: unknown): void }; layout?: unknown }): null {
  const reactRuntime = getReact() as ReactRuntime & { useLayoutEffect?(effect: () => void | (() => void), deps: unknown[]): void };
  reactRuntime.useLayoutEffect?.(() => {
    props.controller?.setLayout?.(props.layout);
    return () => props.controller?.setLayout?.(null);
  }, [props.controller, props.layout]);
  return null;
}
function initializePanelLayoutBridge(): void { getReact(); }

function initializeLazySideChat(): void {
  if (LazyLocalConversationSideChatTab != null) return;
  const createLazy = shared.Jm as undefined | ((loader: () => Promise<unknown>, options: UnknownRecord) => unknown);
  LazyLocalConversationSideChatTab = createLazy == null ? null : createLazy(async () => {
    const module = await import("@rchunk/local-conversation-thread-entry");
    return module.LocalConversationSideChatTab;
  }, { propagateLoadError: true });
}
function initializeThreadPanelToggleButton(): void {
  if (initialized) return;
  initialized = true;
  initializePanelLayoutBridge(); initializeToolbarIconButton(); initializeTabStackIcon(); initializeLazySideChat();
  initializePanelLauncherActions(); initializePanelLauncher(); initializePanelLauncherDropdown();
  initializePanelLauncherContextMenu(); initializeThreadPanelToolbar();
  for (const owner of [initial, primary]) {
    const initializer = owner.n;
    if (typeof initializer === "function") (initializer as () => void)();
  }
}

initializeThreadPanelToggleButton();

export {
  ToolbarIconButton as _,
  PanelLauncherContextMenu as a,
  initializePanelLayoutBridge as b,
  initializePanelLauncherDropdown as c,
  initializePanelLauncherActions as d,
  usePanelLauncher as f,
  initializeTabStackIcon as g,
  TabStackIcon as h,
  initializeThreadPanelToolbar as i,
  PanelLauncher as l,
  initializeLazySideChat as m,
  initializeThreadPanelToggleButton as n,
  initializePanelLauncherContextMenu as o,
  LazyLocalConversationSideChatTab as p,
  ThreadPanelToolbar as r,
  PanelLauncherDropdown as s,
  ToolbarButton as t,
  initializePanelLauncher as u,
  initializeToolbarIconButton as v,
  PanelLayoutBridge as y,
};

void classNames;
