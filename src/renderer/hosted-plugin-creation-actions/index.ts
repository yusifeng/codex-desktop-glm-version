import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/toolbar-breadcrumb";
import "@rchunk/canonical-plugin-query";
import "@rchunk/prepare-plugin-creator";

export interface HostedCreateAction { canCreateMcpApp?: boolean; canUploadArchive?: boolean; onCreate?(mode: "archive" | "mcp"): void }
export interface CreationMenuProps { canCreatePlugin?: boolean; canCreateSkill?: boolean; currentBrowseTab?: "plugins" | "skills"; hostedCreateAction?: HostedCreateAction; isCreatingPlugin?: boolean; isPluginCreatorDisabledByAdmin?: boolean; mode?: "browse" | "manage"; onAddMarketplace?(): void; onAddMcpServer?(): void; onCreatePlugin?(): void; onCreateSkill?(): void }
let jsx: JsxRuntime;

function CreationMenu(props: CreationMenuProps): unknown {
  const runtime = ensureJsx();
  const actions = [
    menuAction("plugin", "Create plugin", props.onCreatePlugin, !props.canCreatePlugin),
    menuAction("skill", "Create skill", props.onCreateSkill, !props.canCreateSkill),
    menuAction("archive", "Upload plugin archive", props.hostedCreateAction?.canUploadArchive ? () => props.hostedCreateAction?.onCreate?.("archive") : undefined),
    menuAction("mcp", "Create MCP App", props.hostedCreateAction?.canCreateMcpApp ? () => props.hostedCreateAction?.onCreate?.("mcp") : props.onAddMcpServer),
    menuAction("marketplace", "Add marketplace", props.onAddMarketplace),
  ].filter((action) => action.onSelect != null || action.disabled);
  return runtime.jsx("div", { role: "menu", "aria-busy": props.isCreatingPlugin === true, children: actions.map((action) => runtime.jsx("button", { type: "button", role: "menuitem", disabled: action.disabled, onClick: action.onSelect, children: action.label }, action.id)) });
}
function PluginsToolbar(props: CreationMenuProps & { breadcrumb?: unknown; hostSelector?: unknown; onExitManageMode?(): void }): unknown { const runtime = ensureJsx(); return runtime.jsxs("header", { className: "plugins-toolbar", children: [props.breadcrumb ?? runtime.jsx("span", { children: props.mode === "manage" ? "Manage" : "Plugins" }), props.hostSelector, runtime.jsx(CreationMenu, props)] }); }
function PluginCreatorBoundary(props: { canCreatePlugin?: boolean; children(input: { canCreatePlugin: boolean; isCreatingPlugin: boolean; isPluginCreatorDisabledByAdmin: boolean; onCreatePlugin?(): void }): unknown; onCreatePlugin?(): void }): unknown { return props.children({ canCreatePlugin: props.canCreatePlugin === true, isCreatingPlugin: false, isPluginCreatorDisabledByAdmin: false, onCreatePlugin: props.onCreatePlugin }); }
function WorkspaceCreationBoundary(props: { children(input: { canCreatePlugin: boolean; canCreateSkill: boolean; isPluginCreatorDisabledByAdmin: boolean; onCreatePlugin?(): void; onCreateSkill?(): void }): unknown; enabled?: boolean; onCreatePlugin?(): void; onCreateSkill?(): void }): unknown { const enabled = props.enabled !== false; return props.children({ canCreatePlugin: enabled, canCreateSkill: enabled, isPluginCreatorDisabledByAdmin: false, onCreatePlugin: enabled ? props.onCreatePlugin : undefined, onCreateSkill: enabled ? props.onCreateSkill : undefined }); }
const menuAction = (id: string, label: string, onSelect?: () => void, disabled = false): { disabled: boolean; id: string; label: string; onSelect?: () => void } => ({ disabled, id, label, onSelect });
const initializeMenu = (): void => { jsx = getJsxRuntime(); };
const initializeCreatorBoundary = (): void => { jsx = getJsxRuntime(); };
const initializeAll = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { CreationMenu as a, initializeCreatorBoundary as i, initializeAll as n, PluginsToolbar as o, PluginCreatorBoundary as r, initializeMenu as s, WorkspaceCreationBoundary as t };
