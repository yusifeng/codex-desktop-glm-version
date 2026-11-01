// composer-utility-bar —— Composer 底部运行上下文控制栏。
//
// 原版：app/webview/assets/composer-utility-bar-a9b94a95b731.js
//（183KB / 6,522 行）。
//
// 唯一导出：ComposerUtilityBar（原 `zs`）。原组件使用 215 个 React
// Compiler memo-cache 槽位，把以下控制装配成 home/default 两种布局：
//   - local/cloud/worktree 执行模式与既有 workspace 提示；
//   - 本地/远程项目选择和远程 host 状态；
//   - Git 分支、starting state、git init；
//   - worktree environment 与项目设置入口；
//   - cloud follow-up、thread handoff、运行时控制和免费版 upsell。
//
// 依赖集合严格对应原 chunk 的 11 个静态 import。除三个聚合 chunk 外，
// 其余依赖分别承载 git-submodule、branch switcher、handoff、dock/create
// dialog、git init 与 environment dropdown。这里用副作用 import 保持 chunk
// 图边界；具体压缩导出仍由 transform-only 轨道提供。

import "@rchunk/rolldown-runtime";
import * as shared from "@rchunk/app-shared";
import * as initial from "@rchunk/app-initial";
import * as primary from "@rchunk/app-primary";
import "@rchunk/use-git-submodule-paths";
import "@rchunk/git-branch-switcher";
import "@rchunk/thread-handoff-modal";
import "@rchunk/dock";
import "@rchunk/create-dialog";
import "@rchunk/use-create-git-repository";
import * as worktreeEnvironment from "@rchunk/worktree-environment-dropdown";
import type { JsxRuntime } from "@rchunk/app-shared";

export type ComposerMode = "local" | "cloud" | "worktree";
export type ComposerUtilityBarVariant = "home" | "default";

export interface StartingStateWorkingTree {
  type: "working-tree";
}

export interface StartingStateBranch {
  type: "branch";
  branchName: string;
  remoteRef?: string;
}

export type AsyncThreadStartingState = StartingStateWorkingTree | StartingStateBranch;

export interface HostConfigLike {
  id: string;
  [key: string]: unknown;
}

export interface ExecutionTargetLike {
  cwd?: string | null;
  hostId: string;
  hostConfig: HostConfigLike;
}

export interface RemoteConfigLike {
  currentHostId?: string | null;
  getProjectPathForHostId(hostId: string): string | null;
}

export interface ExistingWorkspaceLike {
  workspaceRoot: string;
  sourceConversationTitle?: string | null;
  isWorktree?: boolean;
}

export interface ComposerUtilityBarProps {
  asyncThreadStartingState: AsyncThreadStartingState;
  variant: ComposerUtilityBarVariant;
  isHidden?: boolean;
  composerMode: ComposerMode;
  setComposerMode(mode: ComposerMode): void;
  isResponseInProgress: boolean;
  isWorktreeAvailable?: boolean;
  worktreeEnvironmentHostId?: string | null;
  worktreeEnvironmentWorkspaceRoot: string;
  codexHome?: string | null;
  homeAuxiliaryControl?: unknown;
  showRuntimeControls?: boolean;
  hideRunLocationDropdown?: boolean;
  showWorkspaceDropdown?: boolean;
  gitRootForStartingState?: string | null;
  startingStateRepositoryKey?: string | null;
  showUtilityBarBranchWhen?: "always" | string;
  freeUpsellButton?: unknown;
  remoteConfig: RemoteConfigLike;
  activeProjectIdOverride?: string | null;
  onProjectChange?: ((projectId: string | null) => void) | null;
  localRemoteExecutionTarget?: ExecutionTargetLike;
  existingWorkspace?: ExistingWorkspaceLike | null;
}

export type ComposerUtilityControlKind =
  | "branch-switcher"
  | "cloud-follow-up-starting-state"
  | "cloud-run-location"
  | "create-git-repository"
  | "existing-workspace"
  | "free-upsell"
  | "home-auxiliary"
  | "mode-selector"
  | "project-picker"
  | "remote-host"
  | "runtime-controls"
  | "thread-handoff"
  | "worktree-environment";

export interface ComposerUtilityControl {
  kind: ComposerUtilityControlKind;
  disabled?: boolean;
  details?: Record<string, unknown>;
}

/**
 * 语义化后的渲染描述。项目当前 renderer 重写层用可检查的 view node 表达
 * 大型 React chunk 的装配关系；压缩版依赖继续由双轨构建提供。
 */
type ScopeLike = { value?: Record<string, unknown> };

const sharedRuntime = shared as Record<string, unknown>;
const initialRuntime = initial as Record<string, unknown>;
const primaryRuntime = primary as Record<string, unknown>;
const worktreeRuntime = worktreeEnvironment as Record<string, unknown>;
let jsx: JsxRuntime;

function initializeComposerUtilityBar(): void {
  if (jsx != null) return;
  const getJsxRuntime = sharedRuntime.I3;
  if (typeof getJsxRuntime !== "function") {
    throw new Error("Composer utility bar requires the renderer JSX runtime");
  }
  jsx = (getJsxRuntime as () => JsxRuntime)();
  const initializeWorktreeEnvironment = worktreeRuntime.n;
  if (typeof initializeWorktreeEnvironment === "function") {
    (initializeWorktreeEnvironment as () => void)();
  }
}

function useComposerScope(): ScopeLike | null {
  const useScope = sharedRuntime.LX;
  const routeScope = initialRuntime.$en;
  if (typeof useScope !== "function" || routeScope == null) return null;
  try {
    return (useScope as (scope: unknown) => ScopeLike)(routeScope);
  } catch {
    return null;
  }
}

function setStartingState(scope: ScopeLike | null, state: AsyncThreadStartingState): void {
  const setter = initialRuntime.F3;
  if (scope != null && typeof setter === "function") {
    (setter as (scope: ScopeLike, key: string, value: unknown) => void)(scope, "asyncThreadStartingState", state);
  }
}

/** 原 `Bs`：远程 host 名称 + 状态图标，projectPath 作为 tooltip。 */
function createRemoteHostControl(
  hostId: string | null | undefined,
  connectionDisplayName: string | null | undefined,
  projectPath: string | null | undefined,
): ComposerUtilityControl | null {
  if (hostId == null) return null;
  return {
    kind: "remote-host",
    disabled: projectPath == null,
    details: {
      hostId,
      label: connectionDisplayName ?? hostId,
      projectPath: projectPath ?? null,
    },
  };
}

const WORKTREE_NAME_PATTERN =
  /^(?![0-9a-f]{4,}$)(?!(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizePath(value: string): string {
  const replaced = value.replaceAll("\\", "/");
  const parts: string[] = [];
  for (const part of replaced.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  const prefix = replaced.startsWith("/") ? "/" : "";
  return `${prefix}${parts.join("/")}`.replace(/\/+$/, "");
}

function inferManagedWorktreesRoot(worktreePath: string): string | null {
  const normalized = normalizePath(worktreePath);
  const match = /^(.*\/(?:\.codex|\.codex-workspaces(?:\/instances\/[^/]+)?|OpenAI\/Codex\/workspaces(?:\/instances\/[^/]+)?)\/worktrees)(?:\/|$)/i.exec(
    normalized,
  );
  return match?.[1] ?? null;
}

function relativePathParts(path: string, root: string): string[] | null {
  const normalizedPath = normalizePath(path);
  const normalizedRoot = normalizePath(root);
  const lowerPath = normalizedPath.toLowerCase();
  const lowerRoot = normalizedRoot.toLowerCase();
  if (lowerPath !== lowerRoot && !lowerPath.startsWith(`${lowerRoot}/`)) return null;
  return normalizedPath
    .slice(normalizedRoot.length)
    .split("/")
    .filter(Boolean);
}

function lastTwoPathParts(path: string): string {
  const normalized = normalizePath(path);
  return normalized.split("/").filter(Boolean).slice(-2).join("/") || normalized;
}

/**
 * 原 `qa`：优先取受管 worktrees 根目录后的首段；合法的人类可读名称会
 * 首字母大写并把连字符换成空格，随机十六进制目录则保留原名。无法定位
 * worktrees 根目录时回退为路径末两段。
 */
function formatExistingWorktreePath(codexHome: string | null | undefined, worktreePath: string): string {
  const roots = [
    codexHome == null ? null : `${normalizePath(codexHome)}/worktrees`,
    inferManagedWorktreesRoot(worktreePath),
  ];
  let name: string | undefined;
  for (const root of roots) {
    if (root == null) continue;
    name = relativePathParts(worktreePath, root)?.[0];
    if (name != null) break;
  }
  if (name != null && WORKTREE_NAME_PATTERN.test(name)) {
    return name[0].toUpperCase() + name.slice(1).replaceAll("-", " ");
  }
  return name ?? lastTwoPathParts(worktreePath);
}

/**
 * ComposerUtilityBar（原 `zs`）。
 *
 * 保留原组件最重要的布局判定：home 使用浮动 surface，default 使用行内
 * footer；compact/home 场景把项目和辅助控制放在 leading 区；运行模式、
 * Git、环境和远程 host 状态按当前任务类型装配到对应区域。
 */
function ComposerUtilityBar(props: ComposerUtilityBarProps): unknown {
  initializeComposerUtilityBar();
  const scope = useComposerScope();
  const isHome = props.variant === "home";
  const hasExistingWorkspace = props.existingWorkspace != null;
  const isWorktreeMode = props.composerMode === "worktree";
  const isCloudMode = props.composerMode === "cloud";
  const showProjectPicker = props.showWorkspaceDropdown === true || isHome;
  const leadingControls: ComposerUtilityControl[] = [];
  const trailingControls: ComposerUtilityControl[] = [];

  if (showProjectPicker) {
    leadingControls.push({
      kind: "project-picker",
      details: {
        activeProjectId: props.activeProjectIdOverride ?? null,
        allowProjectCreation: props.onProjectChange == null,
        variant: isHome ? "home" : "default",
      },
    });
  }

  if (props.homeAuxiliaryControl != null && isHome) {
    leadingControls.push({ kind: "home-auxiliary", details: { content: props.homeAuxiliaryControl } });
  }

  if (hasExistingWorkspace && props.composerMode === "local") {
    const workspace = props.existingWorkspace as ExistingWorkspaceLike;
    leadingControls.push({
      kind: "existing-workspace",
      details: {
        label: workspace.isWorktree === true
          ? formatExistingWorktreePath(props.codexHome, workspace.workspaceRoot)
          : "Existing workspace",
        sourceConversationTitle: workspace.sourceConversationTitle ?? null,
        workspaceRoot: workspace.workspaceRoot,
      },
    });
  } else if (!props.hideRunLocationDropdown) {
    leadingControls.push({
      kind: "mode-selector",
      disabled: props.isResponseInProgress,
      details: {
        mode: props.composerMode,
        allowWorktree: props.isWorktreeAvailable === true && !props.isResponseInProgress,
      },
    });
  }

  if (isCloudMode) {
    leadingControls.push({ kind: "cloud-run-location" });
    leadingControls.push({
      kind: "cloud-follow-up-starting-state",
      details: { startingState: props.asyncThreadStartingState },
    });
  }

  if ((isCloudMode || isWorktreeMode) && !hasExistingWorkspace) {
    leadingControls.push({
      kind: "branch-switcher",
      details: {
        branchSource: isWorktreeMode ? "worktree" : "cloud",
        gitRootOverride: props.gitRootForStartingState ?? null,
        startingState: props.asyncThreadStartingState,
      },
    });
  }

  if (isWorktreeMode) {
    leadingControls.push({
      kind: "worktree-environment",
      details: {
        hostId: props.worktreeEnvironmentHostId ?? null,
        workspaceRoot: props.worktreeEnvironmentWorkspaceRoot,
      },
    });
  }

  if (props.showRuntimeControls) trailingControls.push({ kind: "runtime-controls" });
  if (props.freeUpsellButton != null) {
    trailingControls.push({ kind: "free-upsell", details: { content: props.freeUpsellButton } });
  }

  if (props.localRemoteExecutionTarget != null && props.composerMode === "local") {
    const target = props.localRemoteExecutionTarget;
    const projectPath = props.remoteConfig.getProjectPathForHostId(target.hostId);
    const remoteHost = createRemoteHostControl(target.hostId, null, projectPath);
    if (remoteHost != null) trailingControls.push(remoteHost);
  }

  const leading = leadingControls.map((control, index) =>
    renderControl(control, props, scope, `leading-${control.kind}-${index}`),
  );
  const trailing = trailingControls.map((control, index) =>
    renderControl(control, props, scope, `trailing-${control.kind}-${index}`),
  );

  if (isHome) {
    const content = jsx.jsx("div", { className: "composer-utility-bar__leading", children: leading });
    const FloatingSurface = primaryRuntime.Po;
    if (typeof FloatingSurface === "function") {
      return jsx.jsx(FloatingSurface, {
        adaptToFloatingSurface: true,
        isHidden: props.isHidden === true,
        trailingControls: trailing.length === 0 ? null : jsx.jsx("div", { className: "composer-utility-bar__trailing", children: trailing }),
        children: content,
      });
    }
    return jsx.jsxs("div", {
      "aria-hidden": props.isHidden === true || undefined,
      className: "composer-utility-bar composer-utility-bar--home",
      "data-composer-footer-layout": "floating",
      hidden: props.isHidden === true,
      children: [
        content,
        trailing.length === 0
          ? null
          : jsx.jsx("div", { className: "composer-utility-bar__trailing", children: trailing }),
      ],
    });
  }

  const footerProps = {
    "aria-hidden": props.isHidden === true || undefined,
    className: "composer-utility-bar composer-utility-bar--inline",
    "data-composer-footer-layout": "inline",
    hidden: props.isHidden === true,
    children: [
      jsx.jsx("div", { className: "composer-utility-bar__leading", children: leading }),
      trailing.length === 0
        ? null
        : jsx.jsx("div", { className: "composer-utility-bar__trailing", children: trailing }),
    ],
  };
  const UtilityFooter = initialRuntime.bt;
  return typeof UtilityFooter === "function" ? jsx.jsx(UtilityFooter, footerProps) : jsx.jsxs("footer", footerProps);
}

function renderControl(
  control: ComposerUtilityControl,
  props: ComposerUtilityBarProps,
  scope: ScopeLike | null,
  key: string,
): unknown {
  switch (control.kind) {
    case "project-picker":
      if (typeof primaryRuntime.c === "function") {
        return jsx.jsx(primaryRuntime.c, {
          activeProjectIdOverride: props.activeProjectIdOverride ?? null,
          allowProjectCreation: props.onProjectChange == null,
          allowLocalProjectActions: true,
          allowRemoteProjects: true,
          onProjectSelected: props.onProjectChange ?? undefined,
          variant: props.variant === "home" ? "home" : "default",
        }, key);
      }
      return jsx.jsx("button", {
        type: "button",
        className: "composer-utility-bar__project-picker",
        "aria-label": "Choose project",
        "data-active-project-id": props.activeProjectIdOverride ?? undefined,
        onClick: () => props.onProjectChange?.(props.activeProjectIdOverride ?? null),
        children: props.activeProjectIdOverride ?? "Choose project",
      }, key);
    case "home-auxiliary":
      return jsx.jsx(jsx.Fragment, { children: props.homeAuxiliaryControl }, key);
    case "existing-workspace": {
      const label = control.details?.label as string;
      const root = control.details?.workspaceRoot as string;
      const title = control.details?.sourceConversationTitle as string | null;
      return jsx.jsx("span", {
        className: "composer-utility-bar__workspace",
        title: title == null ? root : `From ${title}\n${root}`,
        children: label,
      }, key);
    }
    case "mode-selector":
      return jsx.jsx("div", {
        role: "group",
        "aria-label": "Run location",
        className: "composer-utility-bar__mode-selector",
        children: (["local", "cloud", "worktree"] as const).map((mode) =>
          jsx.jsx("button", {
            type: "button",
            "aria-pressed": props.composerMode === mode,
            disabled: control.disabled === true || (mode === "worktree" && control.details?.allowWorktree !== true),
            onClick: () => props.setComposerMode(mode),
            children: mode === "local" ? "Local" : mode === "cloud" ? "Cloud" : "Worktree",
          }, mode),
        ),
      }, key);
    case "branch-switcher": {
      const StartingStateDropdown = worktreeRuntime.s;
      if (typeof StartingStateDropdown !== "function") return null;
      const fallbackHostId = props.worktreeEnvironmentHostId ?? "local";
      return jsx.jsx(StartingStateDropdown, {
        branchSource: props.composerMode === "worktree" ? "worktree" : "repository",
        gitRootOverride: props.gitRootForStartingState ?? null,
        hostConfig: props.localRemoteExecutionTarget?.hostConfig ?? { id: fallbackHostId },
        side: "top",
        startingState: props.asyncThreadStartingState,
        setStartingState: (state: AsyncThreadStartingState) => setStartingState(scope, state),
      }, key);
    }
    case "cloud-run-location":
      return jsx.jsx("span", { className: "composer-utility-bar__cloud-location", children: "Cloud" }, key);
    case "cloud-follow-up-starting-state":
      return null;
    case "worktree-environment":
      return jsx.jsxs("span", {
        className: "composer-utility-bar__environment",
        title: props.worktreeEnvironmentWorkspaceRoot,
        children: ["Environment", props.worktreeEnvironmentHostId == null ? null : ` · ${props.worktreeEnvironmentHostId}`],
      }, key);
    case "runtime-controls":
      return jsx.jsx("span", { className: "composer-utility-bar__runtime-controls", "data-runtime-controls": true }, key);
    case "free-upsell":
      return jsx.jsx(jsx.Fragment, { children: props.freeUpsellButton }, key);
    case "remote-host":
      return jsx.jsxs("span", {
        className: "composer-utility-bar__remote-host",
        title: control.details?.projectPath as string | undefined,
        "aria-disabled": control.disabled === true || undefined,
        children: [
          jsx.jsx("span", { children: control.details?.label as string }),
          jsx.jsx("span", { "aria-hidden": true, "data-host-id": control.details?.hostId, children: "●" }),
        ],
      }, key);
    case "create-git-repository":
    case "thread-handoff":
      return null;
  }
}

export { ComposerUtilityBar };
