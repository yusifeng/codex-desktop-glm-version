// hotkey-window-home-page — Quick Chat workspace selection, composer controls, and window gestures.

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
// @ts-ignore -- semantic module is present in the published renderer graph.
import * as floatingPointerChunk from "@rchunk/use-floating-window-pointer-interactivity";
// @ts-ignore -- semantic module is present in the published renderer graph.
import * as hotkeyDismissChunk from "@rchunk/use-hotkey-window-dismiss-on-escape";
import * as environmentDropdownChunk from "@rchunk/worktree-environment-dropdown";
import "@rchunk/rolldown-runtime";
import { deriveCloudUnavailableReason } from "../app-primary/runtime/derive-cloud-unavailable-reason";

type ComposerMode = "cloud" | "local" | "worktree";
type ProjectSelection =
  | { projectId: string; type: "local" }
  | { projectId: string; type: "remote" }
  | null;

interface Ref<Value> { current: Value }
interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useLayoutEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useRef<Value>(value: Value): Ref<Value>;
  useState<Value>(value: Value): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface IntlRuntime {
  formatMessage(descriptor: { defaultMessage: string; description?: string; id: string }, values?: Record<string, unknown>): string;
}
interface ScopeApi { get(signal: unknown, parameter?: unknown): unknown }
interface LocalProject { rootPaths?: readonly string[] | null }
interface RemoteProject { hostId?: string; label?: string | null; projectId?: string; remotePath?: string | null }
interface HostConfig { id: string; [key: string]: unknown }
interface ModeAvailability {
  cloudUnavailableReason?: string | null;
  fallbackMode: "local";
  isAvailabilityLoading: boolean;
  isLocalAvailable: true;
  isWorktreeAvailable: boolean;
}
interface WorkspaceContext {
  availability: ModeAvailability;
  effectiveMode: ComposerMode;
  gitRoot: string | null;
  hostConfig: HostConfig;
  hostId: string;
  isGitlessLocalProject: boolean;
  isProjectLoading: boolean;
  isProjectless: boolean;
  projectKey: unknown;
  projectRoot: string | null;
  remoteProject: RemoteProject | null;
  workspaceRoot: string | null;
}
interface Environment { configPath: string | null; name: string }
interface EnvironmentState {
  environments: Environment[];
  error?: unknown;
  isFetching: boolean;
  isLoading: boolean;
  repairConfigPath?: string | null;
  resolvedConfigPath?: string | null;
  updateSelection(configPath: string | null): void;
}
interface HotkeyServices {
  hotkeyWindowHotkeys?: {
    homeDragEnd(): void;
    homeDragMove(): void;
    homeDragStart(input: { guideColor: string; pointerWindowX: number; pointerWindowY: number; reducedMotion: boolean }): void;
    homeLayoutChanged(input: LayoutMetrics): void;
    homePointerInteractionChanged(input: { isInteractive: boolean }): void;
    open(input: { path: string }): void;
  };
}
interface LayoutMetrics {
  composerHeightPx: number;
  composerLeftInsetPx: number;
  composerWidthPx: number;
  minimumComposerTopInsetPx: number;
  restingComposerTopInsetPx: number;
}
interface RectLike { height: number; left: number; top: number; width: number }
interface ElementLike {
  contains(target: unknown): boolean;
  getBoundingClientRect(): RectLike;
  hasPointerCapture?(pointerId: number): boolean;
  releasePointerCapture?(pointerId: number): void;
  setPointerCapture?(pointerId: number): void;
}
interface PointerTarget { closest(selector: string): unknown }
interface PointerEventLike {
  button: number;
  clientX: number;
  clientY: number;
  currentTarget: ElementLike;
  pointerId: number;
  preventDefault(): void;
  target: unknown;
}
interface AppSharedApi {
  $3?: () => void; Ef?: () => void; FX?: () => void; If?: () => void; K2?: () => void; QT?: () => void; W3?: () => void; Zh?: () => void; _u?: () => void; c_?: () => void; jO?: () => void; lD?: () => void; wL?: () => void; xD?: () => void;
  $T: unknown; AO: unknown; BX(family: unknown, parameter: unknown): unknown; CH(value: string): string; Cf: unknown; G3: { dispatchMessage(name: string, payload: unknown): void }; HX<Value>(signal: unknown): Value; I3(): JsxRuntime; K3(name: string, callback: (payload: { topInsetPx: number }) => void): void; LX(scope: unknown): ScopeApi; Tf: unknown; UB(value: string): string; Y2: unknown; Yh: unknown; bD: unknown; cD: unknown; e6(): ReactRuntime; gu: unknown; jf: { Item: unknown }; kf: unknown; l3(left: unknown, right: unknown): boolean; n4(): IntlRuntime; o_: unknown; rZ(scope: unknown, resolver: (parameter: { authMethod?: string | null; project?: ProjectSelection }, helpers: { get(signal: unknown, parameter?: unknown): unknown; scope: ScopeApi }) => WorkspaceContext, options: { isEqual(left: unknown, right: unknown): boolean }): unknown; xf: unknown;
}
interface AppInitialApi {
  Bfn?: () => void; Dht?: () => void; E?: () => void; Evt?: () => void; Fht?: () => void; M6t?: () => void; Qgn?: () => void; Rht?: () => void; Vcn?: () => void; Yln?: () => void; _cn?: () => void; aW?: () => void; jst?: () => void; mnt?: () => void; pfn?: () => void; rW?: () => void; x3?: () => void; xlt?: () => void; xvt?: () => void; yb?: () => void;
  A3(scope: ScopeApi, value: unknown, projectKey: unknown): void; Bcn(get: ScopeApi["get"], setting: { key: string }): unknown; C: unknown; Ecn: unknown; Fb(path: string | null, label?: string | null): string | null; I4: unknown; Ki(command: Record<string, unknown>): void; N6t(): { authMethod?: string | null }; Oht: unknown; OLt: unknown; Q4: unknown; R4: unknown; Scn: unknown; Slt(): boolean; Ww(input: { configPath: string; projectId?: string; workspaceRoot: string }): string; iW: unknown; i_n(): { hash: string; pathname: string; search: string; state?: { focusComposerNonce?: unknown; project?: ProjectSelection } | null }; j3(scope: ScopeApi, projectKey: unknown, mode: ComposerMode): void; jcn: unknown; kht: unknown; kst(input: { cwd: string | null; hostId: string; isLoading?: boolean }): unknown; l3: unknown; mcn: unknown; mfn: unknown; nW: unknown; o_n(): (destination: { hash: string; pathname: string; search: string }, options: { replace: boolean; state: unknown }) => void; pcn: unknown; pnt: HotkeyServices; rpt(input: { hostId: string; workspaceRoot: string | null }): EnvironmentState; ugn: string; vb: unknown; vcn: unknown; vfn: unknown; y3(...values: unknown[]): unknown;
}
interface AppPrimaryApi {
  Cf?: () => void; Dn?: () => void; Ns?: () => void; dg?: () => void; dt?: () => void; eg?: () => void; fg?: () => void; ko?: () => void; l?: () => void; rg?: () => void; sg?: () => void; ug?: unknown; ut: unknown; zo?: () => void;
  Nt(input: { composerMode: ComposerMode; setComposerMode(mode: ComposerMode): void }): void; Oo: unknown; Ps(command: string, callback: () => void, options: { enabled: boolean }): void; Qh: unknown; Ro: unknown; c: unknown; ig(input: { cloudAccess: unknown; isPrimaryReviewComposer: unknown; isRemoteProject: boolean; supportsCloud: boolean }): string | null; kn(root: string | null, options: { enabled: boolean; hostId: string; source: string }): { gitRoot?: string | null }; lg: unknown; ng(input: ModeAvailability & { composerMode: ComposerMode; isEverydayWorkMode: false }): ComposerMode; wf(root: string | null, config: HostConfig, source: string, options: { enabled: boolean }): { data?: unknown };
}
interface FloatingPointerApi { n(options: { activationNonce: unknown; floatingElementSelectors: readonly string[]; includeInteractiveRegion: true; interactiveRegionRef: Ref<ElementLike | null>; onInteractiveChange(value: boolean): void }): boolean; t?: () => void }
interface DismissApi { n?: () => void; t(): void }
interface EnvironmentDropdownApi { c?: () => void; i?: () => void; n?: () => void; o?: () => void; r: unknown; s: unknown; t: unknown }

const shared = appSharedChunk as unknown as AppSharedApi;
const initial = appInitialChunk as unknown as AppInitialApi;
const primary = appPrimaryChunk as unknown as AppPrimaryApi;
const floating = floatingPointerChunk as unknown as FloatingPointerApi;
const dismiss = hotkeyDismissChunk as unknown as DismissApi;
const environmentUi = environmentDropdownChunk as unknown as EnvironmentDropdownApi;

const FLOATING_SELECTORS = [
  "[data-composer-overlay-floating-ui]",
  "[data-above-composer-portal] > *",
  "[data-radix-popper-content-wrapper] > *",
] as const;
const INTERACTIVE_SELECTOR = "button, a, input, textarea, select, [contenteditable=true], [role=button], [role=combobox], [role=menuitem]";
const HOME_CLASSES = { Home: "_Home_1cwbe_1", HomeShell: "_HomeShell_1cwbe_26", ShellUnderlay: "_ShellUnderlay_1cwbe_27", ComposerSurface: "_ComposerSurface_1cwbe_28" } as const;

let jsx: JsxRuntime;
let React: ReactRuntime;
let workspaceContextFamily: unknown;

function callInitializer(value: unknown): void { if (typeof value === "function") value(); }
function firstRoot(roots: readonly string[] | null | undefined): string | null { return roots?.[0] ?? null; }
function resolveWorkspaceRoot(input: { activeWorkspaceRoot: string | null; defaultToProjectless: boolean; localProjects: Record<string, LocalProject>; projectId: string | null | undefined }): string | null {
  if (input.projectId === undefined) return input.defaultToProjectless ? "~" : input.activeWorkspaceRoot;
  if (input.projectId === null) return "~";
  return firstRoot(input.localProjects[input.projectId]?.rootPaths);
}
function resolveProjectRoot(workspaceRoot: string | null, remotePath: string | null): string | null { return remotePath ?? (workspaceRoot === "~" ? null : workspaceRoot); }
function pathWithinRoot(path: string, root: string | null | undefined): boolean {
  if (!root) return false;
  const normalizedRoot = root.replace(/[\\/]+$/, "");
  return path === normalizedRoot || path.startsWith(`${normalizedRoot}/`) || path.startsWith(`${normalizedRoot}\\`);
}
function readRecord(value: unknown): Record<string, unknown> { return value != null && typeof value === "object" ? value as Record<string, unknown> : {}; }

function deriveWorkspaceContext(parameter: { authMethod?: string | null; project?: ProjectSelection }, helpers: { get(signal: unknown, parameter?: unknown): unknown; scope: ScopeApi }): WorkspaceContext {
  const activeRoots = helpers.get(initial.pcn) as readonly string[] | null | undefined;
  const localProjects = readRecord(helpers.get(initial.vcn)) as Record<string, LocalProject>;
  const routeProject = parameter.project;
  const localProjectId = routeProject === undefined ? undefined : routeProject?.type === "local" ? routeProject.projectId : null;
  const defaultProjectless = initial.Bcn(helpers.scope.get, { key: "hotkeyWindowProjectlessDefaultEnabled" }) === true;
  const workspaceRoot = resolveWorkspaceRoot({ activeWorkspaceRoot: activeRoots?.[0] ?? null, defaultToProjectless: defaultProjectless, localProjects, projectId: localProjectId });
  const remoteProject = (routeProject === undefined ? helpers.get(initial.Ecn) : helpers.get(initial.Scn, routeProject?.type === "remote" ? routeProject.projectId : null)) as RemoteProject | null;
  const isProjectless = remoteProject == null && workspaceRoot === "~";
  const hostId = remoteProject?.hostId ?? "local";
  const hostConfig = (helpers.get(initial.jcn, hostId) ?? { id: hostId }) as HostConfig;
  const projectRoot = resolveProjectRoot(workspaceRoot, remoteProject?.remotePath ?? null);
  const isProjectLoading = remoteProject == null && workspaceRoot == null && activeRoots == null;
  const projectKey = initial.kst({ cwd: projectRoot, hostId, isLoading: isProjectLoading });
  const gitQuery = helpers.get(primary.Qh, { cwd: projectRoot, hostId, hostConfig, surface: "hotkey" }) as { data?: { root?: string | null }; isLoading?: boolean };
  const gitRoot = gitQuery.data?.root ?? null;
  const isGitlessLocalProject = remoteProject == null && activeRoots != null && gitQuery.isLoading !== true && gitRoot == null;
  const blocksRemoteModes = isProjectless || isGitlessLocalProject;
  const codexHome = (helpers.get(initial.mcn, { hostId }) as { data?: { codexHome?: string | null } } | null)?.data?.codexHome;
  const worktreesEnabled = helpers.get(initial.mfn, "505458") === true;
  const availability: ModeAvailability = {
    fallbackMode: "local",
    isAvailabilityLoading: !blocksRemoteModes && ((remoteProject == null && activeRoots == null) || gitQuery.isLoading === true || helpers.get(initial.vfn) === true),
    cloudUnavailableReason: deriveCloudUnavailableReason({ cloudAccess: helpers.get(primary.dg, parameter.authMethod), supportsCloud: !blocksRemoteModes, isPrimaryReviewComposer: helpers.get(primary.lg) === true, isRemoteProject: remoteProject != null || routeProject?.type === "remote" }),
    isLocalAvailable: true,
    isWorktreeAvailable: projectRoot != null && gitRoot != null && worktreesEnabled && !pathWithinRoot(projectRoot, codexHome),
  };
  const composerMode = (helpers.get(initial.Q4, projectKey) ?? "local") as ComposerMode;
  return { workspaceRoot, remoteProject, hostId, hostConfig, projectRoot, isProjectless, isProjectLoading, isGitlessLocalProject, projectKey, gitRoot, availability, effectiveMode: primary.ng({ ...availability, composerMode, isEverydayWorkMode: false }) };
}

function ModeSelector(props: { canUseCloud: boolean; composerMode: ComposerMode; disabledTooltipText?: string; setComposerMode(mode: ComposerMode): void; showLabel?: boolean; showWorktree: boolean }): unknown {
  const intl = shared.n4();
  const icon = props.composerMode === "cloud" ? initial.vb : props.composerMode === "worktree" && props.showWorktree ? initial.nW : initial.iW;
  const label = props.showLabel ? (props.composerMode === "cloud" ? "Cloud" : props.composerMode === "worktree" && props.showWorktree ? "Worktree" : "Local project") : null;
  const triggerContent = jsx.jsxs(jsx.Fragment, { children: [icon, label, shared.bD] });
  const button = jsx.jsx(shared.Yh, { size: "composerSm", color: "ghost", className: "gap-1 px-1.5", disabled: Boolean(props.disabledTooltipText), children: triggerContent });
  const trigger = jsx.jsx(shared.o_, { tooltipContent: props.disabledTooltipText ?? intl.formatMessage({ id: "composer.hotkeyWindow.modeDropdown.tooltip", defaultMessage: "Select where to run the chat" }), children: button });
  const item = (mode: ComposerMode, title: string, disabled: boolean, tooltipText?: string): unknown => jsx.jsx(shared.jf.Item, {
    leftIconAsset: mode === "cloud" ? shared.cD : mode === "worktree" ? shared.AO : shared.$T,
    rightIconAsset: props.composerMode === mode ? shared.bD : undefined,
    disabled, tooltipText, onSelect: () => props.setComposerMode(mode), children: title,
  });
  return jsx.jsxs(shared.kf, { triggerButton: trigger, contentWidth: "menuNarrow", children: [
    item("local", "Work locally", false),
    item("cloud", "Cloud", !props.canUseCloud, props.canUseCloud ? undefined : "Cloud is unavailable"),
    item("worktree", "Worktree", !props.showWorktree, props.showWorktree ? undefined : "Initialize a git repo to run tasks in worktrees"),
  ] });
}

function ModeCommands(props: { composerMode: ComposerMode; enabled: boolean; setComposerMode(mode: ComposerMode): void; showWorktree: boolean }): null {
  const toggle = () => primary.Nt({ composerMode: props.composerMode, setComposerMode: props.setComposerMode });
  primary.Ps("composer.toggleWorktreeMode", toggle, { enabled: props.enabled && props.showWorktree });
  initial.Ki({ id: "local", title: "Work locally", description: "Run this chat locally", requiresEmptyComposer: false, Icon: initial.iW, enabled: props.enabled && props.composerMode !== "local", onSelect: async () => props.setComposerMode("local") });
  initial.Ki({ id: "worktree", title: "New worktree", description: "Run this chat in a new worktree", requiresEmptyComposer: false, Icon: initial.nW, enabled: props.enabled && props.showWorktree && props.composerMode !== "worktree", onSelect: async () => props.setComposerMode("worktree") });
  return null;
}

function usePointerInteractivity(activationNonce: unknown, interactiveRegionRef: Ref<ElementLike | null>): boolean {
  return floating.n({ activationNonce, floatingElementSelectors: FLOATING_SELECTORS, includeInteractiveRegion: true, interactiveRegionRef, onInteractiveChange: onInteractiveChange });
}
function onInteractiveChange(isInteractive: boolean): void { initial.pnt.hotkeyWindowHotkeys?.homePointerInteractionChanged({ isInteractive }); }
function openConversation(conversationId: string): void { initial.pnt.hotkeyWindowHotkeys?.open({ path: shared.UB(conversationId) }); }
function parsePixels(value: string): number { return Number.parseFloat(value) || 0; }
function isPointerTarget(value: unknown): value is PointerTarget { return value != null && typeof value === "object" && typeof (value as { closest?: unknown }).closest === "function"; }

function SettingRow(props: { control: unknown; label: unknown }): unknown {
  return jsx.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    jsx.jsx("div", { className: "shrink-0 text-sm font-medium text-default", children: props.label }),
    jsx.jsx("div", { className: "min-w-0", children: props.control }),
  ] });
}
function PermissionsContainer(props: { children?: unknown }): unknown { return jsx.jsx(SettingRow, { label: "Permissions", control: props.children }); }

function HotkeyWindowHomePage(): unknown {
  const scope = shared.LX(initial.kht);
  dismiss.t();
  const intl = shared.n4();
  const location = initial.i_n();
  const navigate = initial.o_n();
  const identity = initial.N6t();
  const outerRef = React.useRef<ElementLike | null>(null);
  const shellRef = React.useRef<ElementLike | null>(null);
  const dragPointerRef = React.useRef<number | null>(null);
  const lastLayoutRef = React.useRef<LayoutMetrics | null>(null);
  const reducedMotion = initial.Slt();
  const routeState = location.state ?? null;
  const activationNonce = routeState?.focusComposerNonce ?? null;
  const routeProject = routeState?.project;
  const localProjectId = routeProject?.type === "local" ? routeProject.projectId : null;
  const context = shared.BX(workspaceContextFamily, { authMethod: identity.authMethod, project: routeProject }) as WorkspaceContext;
  const selectedProject = shared.HX<ProjectSelection>(initial.Oht);
  const worktreeAvailable = context.availability.isWorktreeAvailable;
  const initialBranch = shared.HX<unknown>(initial.I4);
  const recentBranch = shared.HX<unknown>(initial.R4);
  const launchState = shared.HX<unknown>(initial.l3);
  const modeScope = { enabled: context.effectiveMode === "worktree" && context.projectRoot != null, hostId: context.hostId, source: "hotkey_window_worktree_source" };
  const worktreeGitRoot = primary.kn(context.projectRoot, modeScope).gitRoot ?? null;
  const worktreeProjectKey = context.effectiveMode === "worktree" ? initial.kst({ cwd: worktreeGitRoot ?? context.gitRoot, hostId: context.hostId }) : null;
  const taskData = primary.wf(worktreeGitRoot ?? context.projectRoot, context.hostConfig, "hotkey_window_home_page", { enabled: context.effectiveMode === "worktree" && context.projectRoot != null }).data ?? null;
  const startingState = initial.y3(initialBranch, recentBranch, taskData, launchState, worktreeProjectKey);
  const environments = initial.rpt({ hostId: context.hostId, workspaceRoot: context.effectiveMode === "worktree" ? context.projectRoot : null });
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [topInset, setTopInset] = React.useState<number | null>(null);
  const pointerInteractive = usePointerInteractivity(activationNonce, shellRef);
  shared.K3("hotkey-window-home-composer-position-changed", (payload) => setTopInset(payload.topInsetPx));

  const measureLayout = (includeFloating: boolean): void => {
    const outer = outerRef.current;
    const shell = shellRef.current;
    if (!outer || !shell || typeof window === "undefined") return;
    const paddingBottom = parsePixels(window.getComputedStyle(outer as unknown as Element).paddingBottom);
    const outerRect = outer.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    let top = shellRect.top;
    if (includeFloating && typeof document !== "undefined") {
      for (const selector of FLOATING_SELECTORS) for (const node of document.querySelectorAll(selector)) top = Math.min(top, node.getBoundingClientRect().top);
    }
    const next: LayoutMetrics = { composerHeightPx: Math.ceil(shellRect.height), composerLeftInsetPx: shellRect.left, composerWidthPx: shellRect.width, minimumComposerTopInsetPx: Math.max(0, Math.ceil(shellRect.top - top)), restingComposerTopInsetPx: Math.ceil(Math.max(0, outerRect.height - shellRect.height - paddingBottom)) };
    const previous = lastLayoutRef.current;
    if (!previous || !shared.l3(previous, next)) { lastLayoutRef.current = next; initial.pnt.hotkeyWindowHotkeys?.homeLayoutChanged(next); }
  };
  React.useEffect(() => { callInitializer(initial.xvt); }, [activationNonce]);
  React.useLayoutEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    let frame: number | null = null;
    const schedule = () => { if (frame == null) frame = window.requestAnimationFrame(() => { frame = null; measureLayout(pointerInteractive || menuOpen); }); };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    const mutation = pointerInteractive || menuOpen ? (typeof MutationObserver === "undefined" ? null : new MutationObserver(schedule)) : null;
    if (shellRef.current) resize?.observe(shellRef.current as unknown as Element);
    mutation?.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => { if (frame != null) window.cancelAnimationFrame(frame); resize?.disconnect(); mutation?.disconnect(); };
  }, [pointerInteractive, menuOpen]);

  const setComposerMode = (mode: ComposerMode): void => initial.j3(scope, context.projectKey, mode);
  const setStartingState = (value: unknown): void => initial.A3(scope, value, worktreeProjectKey);
  const selectProject = (project: ProjectSelection): void => navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, { replace: true, state: { ...routeState, project } });
  const openEnvironmentSettings = (configPath?: string | null): void => {
    if (context.projectRoot == null) { shared.G3.dispatchMessage("show-settings", { section: "local-environments" }); return; }
    const projectId = (routeProject === undefined ? selectedProject : routeProject)?.projectId;
    const parameters = new URLSearchParams({ workspaceRoot: context.projectRoot });
    if (projectId) parameters.set("projectId", projectId);
    const section = configPath == null && (environments.isLoading || environments.isFetching || environments.error != null || environments.environments.length > 0)
      ? `local-environments?${parameters.toString()}`
      : initial.Ww({ configPath: configPath ?? "", projectId: projectId ? shared.CH(projectId) : undefined, workspaceRoot: context.projectRoot }).slice(10);
    shared.G3.dispatchMessage("show-settings", { section, state: { hostId: context.hostId, returnTo: "/settings/local-environments" } });
  };
  const endDrag = (event: PointerEventLike): void => {
    if (dragPointerRef.current !== event.pointerId) return;
    dragPointerRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
    initial.pnt.hotkeyWindowHotkeys?.homeDragEnd();
  };
  const startDrag = (event: PointerEventLike): void => {
    if (event.button !== 0 || !event.currentTarget.contains(event.target) || !isPointerTarget(event.target) || event.target.closest(INTERACTIVE_SELECTOR)) return;
    event.preventDefault();
    dragPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const guideColor = typeof getComputedStyle === "function" ? getComputedStyle(event.currentTarget as unknown as Element).getPropertyValue("--codex-base-accent").trim() : "";
    initial.pnt.hotkeyWindowHotkeys?.homeDragStart({ pointerWindowX: event.clientX, pointerWindowY: event.clientY, guideColor, reducedMotion });
  };
  const moveDrag = (event: PointerEventLike): void => { if (dragPointerRef.current === event.pointerId) initial.pnt.hotkeyWindowHotkeys?.homeDragMove(); };

  const displayProject = initial.Fb(context.remoteProject?.remotePath ?? context.projectRoot, context.remoteProject?.label) ?? intl.formatMessage({ id: "hotkeyWindow.home.placeholder.unknownProject", defaultMessage: "this project" });
  const placeholder = context.isProjectless ? "Ask ChatGPT anything locally" : context.effectiveMode === "cloud" ? "Ask ChatGPT anything in the cloud" : context.effectiveMode === "worktree" ? intl.formatMessage({ id: "hotkeyWindow.home.placeholder.worktree", defaultMessage: "Ask ChatGPT anything in a worktree in {project}" }, { project: displayProject }) : intl.formatMessage({ id: "hotkeyWindow.home.placeholder.local", defaultMessage: "Ask ChatGPT anything locally in {project}" }, { project: displayProject });
  const disabledTooltip = context.isProjectLoading ? "Loading project" : context.isProjectless ? "Standalone chats run in a local folder" : context.isGitlessLocalProject ? "Initialize a git repo to start in cloud or worktree mode" : undefined;
  const branchControl = context.effectiveMode === "worktree" ? jsx.jsx(environmentUi.s, { startingState, setStartingState, hostConfig: context.hostConfig, gitRootOverride: worktreeGitRoot ?? context.projectRoot, branchSource: "worktree" }) : context.gitRoot == null ? null : jsx.jsx(environmentUi.r, { gitRoot: context.gitRoot, hostConfig: context.hostConfig, localConversationId: null, shouldShow: true });
  const modeControl = jsx.jsx(ModeSelector, { canUseCloud: context.availability.cloudUnavailableReason == null, composerMode: context.effectiveMode, setComposerMode, showLabel: true, disabledTooltipText: disabledTooltip, showWorktree: worktreeAvailable });
  const environmentControl = context.effectiveMode === "worktree" ? jsx.jsx(environmentUi.t, { environments: environments.environments, isLoading: environments.isLoading || (environments.isFetching && environments.environments.length === 0), hasError: environments.error != null, selectedConfigPath: environments.resolvedConfigPath, repairConfigPath: environments.repairConfigPath, onSelectConfigPath: environments.updateSelection, onOpenSettings: openEnvironmentSettings }) : null;
  const permissions = context.effectiveMode === "cloud" ? null : jsx.jsx(initial.C, { conversationId: null, hostId: initial.ugn, DropdownContainer: PermissionsContainer });
  const menuContent = jsx.jsx(shared.Cf, { align: "center", side: "top", sideOffset: 10, className: "w-auto min-w-[320px] rounded-3xl p-0 no-drag", children: jsx.jsxs("div", { className: "flex flex-col gap-4 p-3", children: [
    jsx.jsx(SettingRow, { label: "Project", control: jsx.jsx(primary.c, { activeProjectIdOverride: routeProject === undefined ? undefined : localProjectId, allowRemoteProjects: false, onProjectSelected: selectProject }) }),
    jsx.jsx(SettingRow, { label: "Start in", control: modeControl }),
    environmentControl ? jsx.jsx(SettingRow, { label: "Environment", control: environmentControl }) : null,
    branchControl ? jsx.jsx(SettingRow, { label: "Branch", control: branchControl }) : null, permissions,
  ] }) });
  const menu = jsx.jsxs(shared.xf, { open: menuOpen, onOpenChange: setMenuOpen, children: [jsx.jsx(shared.Tf, { asChild: true, children: jsx.jsx(shared.gu, { label: "Chat settings", size: "composer" }) }), menuContent] });
  const composer = jsx.jsx(primary.Oo, { children: jsx.jsx(primary.ut, { showWorkspaceDropdownInUtilityBar: false, showUtilityBar: false, surfaceClassName: HOME_CLASSES.ComposerSurface, composerModeAvailability: context.availability, placeholderText: placeholder, defaultCwd: context.workspaceRoot ?? (context.isProjectless || routeProject !== undefined ? "~" : undefined), selectedProject: context.isProjectless ? null : (routeProject ?? selectedProject), hotkeyWindowHomeFooterControls: menu, onLocalConversationCreated: openConversation }) });
  const adjustedStyle = topInset == null ? undefined : { bottom: "auto", top: topInset };
  return jsx.jsxs("div", { ref: outerRef, className: HOME_CLASSES.Home, children: [
    jsx.jsx(primary.ug ?? "header", {}),
    jsx.jsxs("div", { ref: shellRef, className: HOME_CLASSES.HomeShell, onLostPointerCapture: endDrag, onPointerCancel: endDrag, onPointerDown: startDrag, onPointerMove: moveDrag, onPointerUp: endDrag, "data-drag-reactivation": pointerInteractive ? "" : undefined, style: adjustedStyle, children: [
      jsx.jsx("div", { className: HOME_CLASSES.ShellUnderlay, "aria-hidden": "true" }),
      jsx.jsx(ModeCommands, { composerMode: context.effectiveMode, enabled: !context.isProjectless && !context.isProjectLoading, setComposerMode, showWorktree: worktreeAvailable }),
      jsx.jsx("div", { className: "relative no-drag", children: composer }),
    ] }),
  ] });
}

function initializeHotkeyWindowHomePage(): void {
  for (const initializer of [shared.$3, shared.FX, shared.wL, shared.K2, shared.jO, shared.xD, shared.lD, shared.QT, shared.Zh, shared.If, shared.c_, shared.Ef, shared._u, shared.W3, initial.mnt, initial.xvt, initial.jst, initial.x3, initial.pfn, initial.rW, initial.Dht, initial.Bfn, initial.Qgn, initial.Rht, initial.Vcn, initial.Yln, initial._cn, initial.aW, initial.xlt, initial.yb, primary.Cf, primary.Dn, primary.Ns, primary.dt, primary.ko, primary.l, primary.rg, primary.sg, primary.zo, primary.eg, primary.fg, floating.t, dismiss.n, environmentUi.n, environmentUi.c, environmentUi.i, environmentUi.o]) callInitializer(initializer);
  jsx = shared.I3();
  React = shared.e6();
  workspaceContextFamily = shared.rZ(initial.kht, deriveWorkspaceContext, { isEqual: shared.l3 });
}

initializeHotkeyWindowHomePage();
export { HotkeyWindowHomePage };
