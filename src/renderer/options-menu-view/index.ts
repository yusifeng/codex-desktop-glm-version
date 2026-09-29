import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/browser-clear-browsing-data-dialog-view";
import "@rchunk/profile";

interface EventLike { preventDefault(): void; stopPropagation?(): void }
interface ZoomCommand { delta?: number; type: "reset-zoom" | "set-zoom-percent" | "step-zoom"; zoomPercent?: number }
interface Extension { iconDataUrl?: string | null; id: string; name: string }
interface ExtensionAction { enabled: boolean; hasPopup?: boolean; iconDataUrl?: string | null; id: string; title?: string | null }
interface ExtensionActionsData { actions: ExtensionAction[]; status: "available"; supportsContextMenu?: boolean }
interface ToolbarProfile { forcePinnedExtensionIds: string[]; pinnedExtensionIds: string[]; ready: boolean }
interface BrowserProfile { extensions: Extension[]; recentlyUsedExtensionIds?: string[]; toolbar: ToolbarProfile }
interface BrowserService {
  getExtensionActions?(target: unknown): Promise<unknown> | unknown;
  setExtensionPinned?(target: unknown): Promise<string> | string;
  showExtensionActionContextMenu?(target: unknown): Promise<string> | string;
  triggerExtensionAction?(target: unknown): Promise<string> | string;
}
interface QueryClient { invalidateQueries(options: { queryKey: unknown[] }): Promise<unknown> | unknown }
interface IntlShape { formatMessage(message: { defaultMessage: string; id: string }, values?: Record<string, unknown>): string }
interface ActionDependencies { intl: IntlShape; notifyError(message: string, id: string): void; queryClient?: QueryClient; service?: BrowserService | null }

const sharedRuntime = appSharedChunk as unknown as {
  $3(): void;
  I3(): import("@rchunk/app-shared").JsxRuntime;
  e6(): import("@rchunk/app-shared").ReactRuntime;
  n4(): IntlShape;
};
const { $3: initializeRuntimeLazy, I3: getJsxRuntime, e6: getReactRuntime, n4: useIntl } = sharedRuntime;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200] as const;
function clampZoom(value: number): number { return Math.min(500, Math.max(25, Math.round(value))); }
function stepZoom(current: number, delta: number): number {
  if (delta > 0) return ZOOM_LEVELS.find((value) => value > current) ?? 500;
  for (let index = ZOOM_LEVELS.length - 1; index >= 0; index -= 1) if (ZOOM_LEVELS[index] < current) return ZOOM_LEVELS[index];
  return current;
}
function renderedZoomToPageZoom({ renderedZoomPercent, viewportScale }: { renderedZoomPercent: number; viewportScale: number }): number { return clampZoom(viewportScale <= 0 ? renderedZoomPercent : renderedZoomPercent / viewportScale); }
function pageZoomToRenderedZoom(pageZoomPercent: number, viewportScale: number): number { return Math.round(pageZoomPercent * viewportScale); }
function translateZoomCommand({ command, currentRenderedZoomPercent, viewportScale }: { command: ZoomCommand; currentRenderedZoomPercent: number; viewportScale: number }): { command: ZoomCommand; renderedZoomPercent: number } {
  const renderedZoomPercent = command.type === "reset-zoom" ? 100 : command.type === "set-zoom-percent" ? clampZoom(command.zoomPercent ?? currentRenderedZoomPercent) : stepZoom(currentRenderedZoomPercent, command.delta ?? 0);
  if (viewportScale === 1) return { command, renderedZoomPercent };
  const pageZoom = renderedZoomToPageZoom({ renderedZoomPercent, viewportScale });
  return { command: { type: "set-zoom-percent", zoomPercent: pageZoom }, renderedZoomPercent: pageZoomToRenderedZoom(pageZoom, viewportScale) };
}

function preventAndRun(event: EventLike, action: () => void): void { event.preventDefault(); event.stopPropagation?.(); action(); }
function actionQueryKey(target: { browserTabId?: string; conversationId?: string }): unknown[] { return ["browser-extension-actions", target.conversationId, target.browserTabId]; }
function extensionActionsQuery(service: BrowserService | null | undefined, target: unknown, enabled: boolean): Record<string, unknown> { return { enabled, gcTime: 0, queryFn: async () => await service?.getExtensionActions?.(target) ?? { status: "unsupported" }, queryKey: actionQueryKey(target as { browserTabId?: string; conversationId?: string }), refetchOnMount: "always", retry: false, staleTime: 0 }; }
async function triggerExtensionAction(dependencies: ActionDependencies, target: unknown, name: string): Promise<string> { const result = await Promise.resolve(dependencies.service?.triggerExtensionAction?.(target) ?? "unsupported").catch(() => "popup-failed"); if (result !== "triggered") dependencies.notifyError("Unable to open " + name, "state.triggerBrowserExtensionAction"); return result; }
async function setExtensionPinned(dependencies: ActionDependencies, target: unknown, name: string): Promise<string> { const result = await Promise.resolve(dependencies.service?.setExtensionPinned?.(target) ?? "unsupported").catch(() => "invalid-target"); await dependencies.queryClient?.invalidateQueries({ queryKey: actionQueryKey(target as { browserTabId?: string; conversationId?: string }) }); if (result !== "updated" && result !== "unchanged") dependencies.notifyError("Unable to update the pinned state of " + name, "thread.browser.extensions.pinError"); return result; }
async function showExtensionContextMenu(dependencies: ActionDependencies, target: unknown, name: string): Promise<string> { const result = await Promise.resolve(dependencies.service?.showExtensionActionContextMenu?.(target) ?? "unsupported").catch(() => "menu-failed"); await dependencies.queryClient?.invalidateQueries({ queryKey: actionQueryKey(target as { browserTabId?: string; conversationId?: string }) }); if (result !== "closed") dependencies.notifyError("Unable to open the menu for " + name, "thread.browser.extensions.menuError"); return result; }
function annotationAvailability(features: { annotations?: string; webMcp?: string } | null | undefined, includeWebMcp: boolean): string { const candidates = [features?.annotations, ...(includeWebMcp ? [features?.webMcp] : [])]; return candidates.find((value) => value === "available" || value === "pending-available" || value === "pending-unavailable") ?? "unavailable"; }

function MenuButton({ checked, children, disabled = false, label, loading = false, onClick }: { checked?: boolean; children?: unknown; disabled?: boolean; label: string; loading?: boolean; onClick?(): void }): unknown {
  return jsx.jsx("button", { type: "button", role: checked == null ? undefined : "menuitemcheckbox", "aria-checked": checked, "aria-label": label, disabled: disabled || loading, onClick, children: loading ? "Loading…" : children ?? label });
}

interface BrowserOptionsProps {
  clearBrowsingData?: { isClearing?: boolean; isOpening?: boolean; kind: "dialog"; onOpen(): void } | { isClearing?: boolean; kind: "submenu"; onClear(kind: "cache" | "cookies" | "downloads"): void } | null;
  currentZoomPercent: number;
  direction?: "ltr" | "rtl";
  isDeviceToolbarEnabled?: boolean;
  isDeviceToolbarVisible?: boolean;
  isFloatingComposerMenuItemVisible?: boolean;
  isFloatingComposerVisible?: boolean;
  isPrintMenuItemVisible?: boolean;
  isScreenshotCaptureEnabled?: boolean;
  onCaptureScreenshot?(): void;
  onImportBrowserProfile?(): void;
  onOpenBrowserSettings?(): void;
  onOpenChange(open: boolean): void;
  onOpenContactInfo?(): void;
  onOpenDownloads?(): void;
  onOpenExtensions?(): void;
  onOpenFindInPage(): void;
  onOpenHistory?(): void;
  onOpenPasswordManager?(): void;
  onPrint?(): void;
  onResetZoom(): void;
  onToggleDeviceToolbar?(): void;
  onToggleFloatingComposer?(): void;
  onZoomIn(): void;
  onZoomOut(): void;
  open?: boolean;
  pageActionsDisabled?: boolean;
  showExtensionsOverflow?: boolean;
}

function BrowserOptionsMenu(props: BrowserOptionsProps): unknown {
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = props.open ?? localOpen;
  const setOpen = (value: boolean) => { setLocalOpen(value); props.onOpenChange(value); };
  const run = (action?: () => void) => { action?.(); setOpen(false); };
  const more = props.onImportBrowserProfile != null || props.onOpenPasswordManager != null || props.onOpenContactInfo != null || props.onOpenDownloads != null || props.onOpenHistory != null || props.clearBrowsingData != null || props.onOpenBrowserSettings != null;
  return jsx.jsxs("div", { className: "relative inline-flex", dir: props.direction, children: [
    jsx.jsx("button", { type: "button", "aria-label": "Browser options", "aria-expanded": open, onClick: () => setOpen(!open), children: "Options" }),
    open ? jsx.jsxs("div", { role: "menu", "aria-label": "Browser options", className: "absolute right-0 top-full z-50 min-w-64 rounded-lg border bg-surface p-1", children: [
      props.showExtensionsOverflow && props.onOpenExtensions != null ? jsx.jsx(MenuButton, { label: "Extensions", onClick: () => run(props.onOpenExtensions) }) : null,
      jsx.jsx(MenuButton, { label: "Find in page", disabled: props.pageActionsDisabled, onClick: () => run(props.onOpenFindInPage) }),
      props.isPrintMenuItemVisible && props.onPrint != null ? jsx.jsx(MenuButton, { label: "Print", disabled: props.pageActionsDisabled, onClick: () => run(props.onPrint) }) : null,
      jsx.jsxs("div", { role: "group", "aria-label": "Zoom", children: [jsx.jsx("span", { children: "Zoom" }), jsx.jsx(MenuButton, { label: "Zoom out", disabled: props.pageActionsDisabled, onClick: props.onZoomOut }), jsx.jsx("span", { children: props.currentZoomPercent + "%" }), jsx.jsx(MenuButton, { label: "Zoom in", disabled: props.pageActionsDisabled, onClick: props.onZoomIn }), jsx.jsx(MenuButton, { label: "Reset", disabled: props.pageActionsDisabled || props.currentZoomPercent === 100, onClick: props.onResetZoom })] }),
      props.isFloatingComposerMenuItemVisible && props.onToggleFloatingComposer != null ? jsx.jsx(MenuButton, { checked: props.isFloatingComposerVisible ?? true, label: props.isFloatingComposerVisible === false ? "Show floating composer" : "Hide floating composer", onClick: () => run(props.onToggleFloatingComposer) }) : null,
      props.isDeviceToolbarEnabled && props.onToggleDeviceToolbar != null ? jsx.jsx(MenuButton, { checked: props.isDeviceToolbarVisible ?? false, label: props.isDeviceToolbarVisible ? "Hide device toolbar" : "Show device toolbar", disabled: props.pageActionsDisabled, onClick: () => run(props.onToggleDeviceToolbar) }) : null,
      props.isScreenshotCaptureEnabled && props.onCaptureScreenshot != null ? jsx.jsx(MenuButton, { label: "Capture screenshot", disabled: props.pageActionsDisabled, onClick: () => run(props.onCaptureScreenshot) }) : null,
      more ? jsx.jsx("hr", {}) : null,
      props.onImportBrowserProfile == null ? null : jsx.jsx(MenuButton, { label: "Import cookies and passwords…", onClick: () => run(props.onImportBrowserProfile) }),
      props.onOpenPasswordManager == null ? null : jsx.jsx(MenuButton, { label: "Password manager", onClick: () => run(props.onOpenPasswordManager) }),
      props.onOpenContactInfo == null ? null : jsx.jsx(MenuButton, { label: "Contact info", onClick: () => run(props.onOpenContactInfo) }),
      props.onOpenDownloads == null ? null : jsx.jsx(MenuButton, { label: "Downloads", onClick: () => run(props.onOpenDownloads) }),
      props.onOpenHistory == null ? null : jsx.jsx(MenuButton, { label: "History", onClick: () => run(props.onOpenHistory) }),
      props.clearBrowsingData?.kind === "dialog" ? jsx.jsx(MenuButton, { label: "Clear browsing data", loading: props.clearBrowsingData.isOpening, onClick: () => run(props.clearBrowsingData?.kind === "dialog" ? props.clearBrowsingData.onOpen : undefined) }) : null,
      props.clearBrowsingData?.kind === "submenu" ? jsx.jsxs("div", { children: [jsx.jsx("div", { children: "Clear browsing data" }), (["cookies", "cache", "downloads"] as const).map((kind) => jsx.jsx(MenuButton, { label: kind === "downloads" ? "Delete download history" : "Clear " + kind, disabled: props.clearBrowsingData?.isClearing, onClick: () => props.clearBrowsingData?.kind === "submenu" ? props.clearBrowsingData.onClear(kind) : undefined }, kind))] }) : null,
      props.onOpenBrowserSettings == null ? null : jsx.jsx(MenuButton, { label: "Browser settings", onClick: () => run(props.onOpenBrowserSettings) }),
    ] }) : null,
  ] });
}

interface ExtensionsMenuProps {
  actionsData?: ExtensionActionsData | { status: string } | null;
  actionsIsError?: boolean;
  onManageExtensions(): void;
  onOpenChange?(open: boolean): void;
  onPin(extension: Extension, pinned: boolean): void;
  onRefreshActions(): void;
  onTriggerAction(action: ExtensionAction, anchor?: unknown): Promise<unknown> | unknown;
  onVisitWebStore(event?: unknown): void;
  open?: boolean;
  profile?: BrowserProfile | null;
  ready?: boolean;
}
function isExtensionActionsData(value: ExtensionsMenuProps["actionsData"]): value is ExtensionActionsData { return value?.status === "available" && "actions" in value && Array.isArray(value.actions); }

function ExtensionsMenu(props: ExtensionsMenuProps): unknown {
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = props.open ?? localOpen;
  const setOpen = (value: boolean) => { setLocalOpen(value); props.onOpenChange?.(value); if (value) props.onRefreshActions(); };
  const profile = props.profile;
  if (profile == null) return null;
  const actionMap = new Map<string, ExtensionAction>(isExtensionActionsData(props.actionsData) ? props.actionsData.actions.map((action) => [action.id, action]) : []);
  const loading = props.ready === false || !profile.toolbar.ready;
  return jsx.jsxs("div", { children: [
    jsx.jsx("button", { type: "button", "aria-label": "Extensions", "aria-expanded": open, onClick: () => setOpen(!open), children: "Extensions" }),
    open ? jsx.jsxs("div", { role: "menu", "aria-label": "Extensions", children: [
      jsx.jsx("div", { children: "Extensions (" + profile.extensions.length + ")" }),
      props.actionsIsError ? jsx.jsx("p", { role: "alert", children: "Unable to load extensions" }) : null,
      loading ? jsx.jsx("p", { role: "status", children: "Loading extensions…" }) : null,
      !loading && profile.extensions.length === 0 ? jsx.jsx("p", { children: "No extensions installed" }) : null,
      ...profile.extensions.map((extension) => { const action = actionMap.get(extension.id); const pinned = profile.toolbar.pinnedExtensionIds.includes(extension.id); const forced = profile.toolbar.forcePinnedExtensionIds.includes(extension.id); return jsx.jsxs("div", { children: [jsx.jsx(MenuButton, { label: action?.title ?? extension.name, disabled: loading || action == null || !action.enabled, onClick: () => action == null ? undefined : props.onTriggerAction(action) }), jsx.jsx(MenuButton, { checked: pinned, label: forced ? "Pinned by your organization" : pinned ? "Unpin " + extension.name : "Pin " + extension.name, disabled: forced, onClick: () => props.onPin(extension, !pinned) })] }, extension.id); }),
      jsx.jsx(MenuButton, { label: "Manage extensions", onClick: () => { setOpen(false); props.onManageExtensions(); } }),
      jsx.jsx(MenuButton, { label: "Visit Web Store", onClick: () => { setOpen(false); props.onVisitWebStore(); } }),
    ] }) : null,
  ] });
}

function ToolbarContainer(props: Record<string, unknown>): unknown { return jsx.jsx("div", { ...props, className: "flex h-full min-w-0 items-center gap-1 " + String(props.className ?? "") }); }
function VisibilityButton({ onClick, saving, visible }: { onClick(): void; saving?: boolean; visible: boolean }): unknown { return jsx.jsx(MenuButton, { label: visible ? "Hide from toolbar" : "Pin to toolbar", loading: saving, onClick }); }
function passthroughComponent(props: Record<string, unknown>): unknown { return jsx.jsx("div", props); }
function permissionPrompt(props: Record<string, unknown>): unknown { return jsx.jsx("div", { role: "dialog", children: props.prompt == null ? "Permission request" : "Permission request" }); }
function cursorLayer(): { destroy(): void; setState(state: unknown): void } { return { destroy() {}, setState() {} }; }
class ExtensionProfileController { getSnapshot(): { popupActionId: null; ready: boolean } { return { popupActionId: null, ready: false }; } subscribe(): () => void { return () => {}; } }

function initializeOptionsMenuView(): void { initializeRuntimeLazy(); React = getReactRuntime(); jsx = getJsxRuntime(); }
initializeOptionsMenuView();

const A = () => {};
const C = passthroughComponent;
const D = passthroughComponent;
const E = passthroughComponent;
const F = () => {};
const I = () => {};
const L = cursorLayer;
const M = () => {};
const N = "data:image/png;base64,";
const O = pageZoomToRenderedZoom;
const P = () => {};
const S = () => {};
const T = passthroughComponent;
const _ = passthroughComponent;
const a = ExtensionsMenu;
const b = passthroughComponent;
const c = actionQueryKey;
const d = setExtensionPinned;
const f = showExtensionContextMenu;
const g = passthroughComponent;
const h = passthroughComponent;
const i = () => {};
const j = permissionPrompt;
const k = translateZoomCommand;
const l = extensionActionsQuery;
const m = passthroughComponent;
const n = initializeOptionsMenuView;
const o = () => {};
const p = triggerExtensionAction;
const r = VisibilityButton;
const s = ExtensionProfileController;
const t = BrowserOptionsMenu;
const u = () => {};
const v = annotationAvailability;
const w = ToolbarContainer;
const x = passthroughComponent;
const y = () => {};

export { A, C, D, E, F, I, L, M, N, O, P, S, T, _, a, b, c, d, f, g, h, i, j, k, l, m, n, o, p, r, s, t, u, v, w, x, y };
