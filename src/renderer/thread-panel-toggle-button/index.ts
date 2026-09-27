import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  Y2 as FormattedMessage,
  Yh as Button,
  e6 as ReactRuntime,
  m4 as classNames,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
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

interface PanelAction {
  deferSelectionUntilDropdownClose?: boolean;
  disabled?: boolean;
  icon?: unknown;
  id: string;
  label: string;
  onSelect(): void;
  shortcut?: string;
}
interface LauncherState {
  actions: PanelAction[];
  hasOutputArtifacts: boolean;
  onOpenArtifact?(artifact: unknown): void;
  outputArtifacts: unknown[];
}
interface PanelLauncherProps {
  actions?: PanelAction[];
  children?: unknown;
  isCommandActive?: boolean;
  onActionSelect?(action: PanelAction): void;
  onClose?(): void;
  surface?: "new-tab" | "panel-launcher";
  target?: "left" | "right";
}

function ToolbarIconButton(props: Record<string, unknown> & { size?: string }): unknown {
  const { size = "toolbar", ...rest } = props;
  return getJsxRuntime().jsx(Button, { size, ...rest });
}

function TabStackIcon(props: { count?: number | null }): unknown {
  const runtime = getJsxRuntime();
  const count = props.count ?? 0;
  return runtime.jsxs("span", { className: "relative inline-flex shrink-0", "aria-hidden": true, children: [
    runtime.jsx("span", { children: "▣" }),
    count <= 0 ? null : runtime.jsx("span", { className: "tab-stack-count", "data-multiple-digits": count > 9, children: count > 9 ? "9+" : count }),
  ] });
}

function usePanelLauncher(options: { actions?: PanelAction[] } = {}): LauncherState {
  const actions = options.actions ?? [];
  return { actions, hasOutputArtifacts: false, outputArtifacts: [] };
}

function PanelLauncher(props: PanelLauncherProps = {}): unknown {
  const runtime = getJsxRuntime();
  const launcher = usePanelLauncher({ actions: props.actions });
  const select = props.onActionSelect ?? ((action: PanelAction) => action.onSelect());
  return runtime.jsxs("div", { "data-panel-launcher-surface": props.surface ?? "panel-launcher", "data-panel-target": props.target ?? "right", children: [
    props.children,
    runtime.jsx("ul", { children: launcher.actions.map((action) => runtime.jsx("li", { children: runtime.jsx("button", { type: "button", disabled: action.disabled, onClick: () => select(action), children: [action.icon, action.label] }) }, action.id)) }),
  ] });
}

function PanelLauncherDropdown(props: { launcher: LauncherState; onOpenChange?(open: boolean): void; open: boolean; triggerButton: unknown }): unknown {
  const runtime = getJsxRuntime();
  return runtime.jsxs("div", { "data-panel-launcher-dropdown": props.open, children: [props.triggerButton, props.open ? runtime.jsx(PanelLauncher, { actions: props.launcher.actions }) : null] });
}

function PanelLauncherContextMenu(props: { children: unknown; onOpenChange?(open: boolean): void }): unknown {
  const [open, setOpen] = ReactRuntime.useState(false);
  const launcher = usePanelLauncher();
  const onOpenChange = (next: boolean): void => { setOpen(next); props.onOpenChange?.(next); };
  return getJsxRuntime().jsx(PanelLauncherDropdown, {
    launcher,
    open,
    onOpenChange,
    triggerButton: getJsxRuntime().jsx("span", { onContextMenu: (event: { preventDefault(): void; stopPropagation(): void }) => { event.preventDefault(); event.stopPropagation(); onOpenChange(true); }, children: props.children }),
  });
}

function ThreadPanelToolbar(props: { mainToolbar?: unknown }): unknown {
  return getJsxRuntime().jsx(getJsxRuntime().Fragment, { children: props.mainToolbar ?? null });
}

function ToolbarButton(props: {
  children?: unknown; color?: "outline" | string; disabled?: boolean; label: string;
  onClick?(): void; pressed?: boolean; shortcut?: string;
}): unknown {
  const color = props.color === "outline" ? (props.pressed ? "outlineActive" : "outline") : props.pressed ? "secondary" : "ghost";
  return getJsxRuntime().jsx(Button, {
    "aria-label": props.label, "aria-pressed": props.pressed, color, disabled: props.disabled,
    onClick: props.onClick, size: "toolbar", title: props.shortcut == null ? props.label : `${props.label} (${props.shortcut})`, uniform: true, children: props.children,
  });
}

function PanelLayoutBridge(): null { return null; }
function initializeToolbarIconButton(): void { getJsxRuntime(); }
function initializeTabStackIcon(): void { getJsxRuntime(); }
function initializePanelLauncherActions(): void { getJsxRuntime(); }
function initializeThreadPanelToolbar(): void { getJsxRuntime(); }
function initializePanelLauncherDropdown(): void { getJsxRuntime(); }
function initializePanelLauncherContextMenu(): void { getJsxRuntime(); }
function initializePanelLauncher(): void { getJsxRuntime(); }

let LazyLocalConversationSideChatTab: ((props: Record<string, unknown>) => unknown) | undefined;
function initializeLazySideChat(): void {
  if (LazyLocalConversationSideChatTab != null) return;
  LazyLocalConversationSideChatTab = createLazyComponent(async () => {
    const module = await import("@rchunk/local-conversation-thread-entry");
    return module.LocalConversationSideChatTab;
  }, { propagateLoadError: true });
}

let initialized = false;
function initializeThreadPanelToggleButton(): void {
  if (initialized) return;
  initialized = true;
  initializeToolbarIconButton(); initializeTabStackIcon(); initializePanelLauncherActions();
  initializeThreadPanelToolbar(); initializePanelLauncherDropdown(); initializePanelLauncherContextMenu();
  initializePanelLauncher(); initializeLazySideChat();
}

const lazySideChat = (): unknown => LazyLocalConversationSideChatTab;

export {
  ToolbarIconButton as _,
  PanelLauncherContextMenu as a,
  PanelLayoutBridge as b,
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
  lazySideChat as p,
  ThreadPanelToolbar as r,
  PanelLauncherDropdown as s,
  ToolbarButton as t,
  initializePanelLauncher as u,
  initializeToolbarIconButton as v,
  PanelLayoutBridge as y,
};

void FormattedMessage;
void classNames;
