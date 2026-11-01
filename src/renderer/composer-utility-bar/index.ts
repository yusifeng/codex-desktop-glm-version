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
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/use-git-submodule-paths";
import "@rchunk/git-branch-switcher";
import "@rchunk/thread-handoff-modal";
import "@rchunk/dock";
import "@rchunk/create-dialog";
import "@rchunk/use-create-git-repository";
import "@rchunk/worktree-environment-dropdown";

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
  props?: Record<string, unknown>;
}

/**
 * 语义化后的渲染描述。项目当前 renderer 重写层用可检查的 view node 表达
 * 大型 React chunk 的装配关系；压缩版依赖继续由双轨构建提供。
 */
export interface ComposerUtilityBarView {
  kind: "composer-utility-bar";
  layout: "floating-home" | "inline-footer";
  hidden: boolean;
  leadingControls: ComposerUtilityControl[];
  trailingControls: ComposerUtilityControl[];
}

/** 原 `Bs`：远程 host 名称 + 状态图标，projectPath 作为 tooltip。 */
function createRemoteHostControl(
  hostId: string | null | undefined,
  connectionDisplayName: string | null | undefined,
  projectPath: string | null | undefined,
): ComposerUtilityControl | null {
  if (hostId == null) return null;
  const control: ComposerUtilityControl = {
    kind: "remote-host",
    disabled: projectPath == null,
    props: {
      hostId,
      label: connectionDisplayName ?? hostId,
      projectPath: projectPath ?? null,
    },
  };
  return control;
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
      props: {
        activeProjectId: props.activeProjectIdOverride ?? null,
        allowProjectCreation: props.onProjectChange == null,
        variant: isHome ? "home" : "default",
      },
    });
  }

  if (props.homeAuxiliaryControl != null && isHome) {
    leadingControls.push({ kind: "home-auxiliary", props: { content: props.homeAuxiliaryControl } });
  }

  if (hasExistingWorkspace && props.composerMode === "local") {
    const workspace = props.existingWorkspace as ExistingWorkspaceLike;
    leadingControls.push({
      kind: "existing-workspace",
      props: {
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
      props: {
        mode: props.composerMode,
        allowWorktree: props.isWorktreeAvailable === true && !props.isResponseInProgress,
      },
    });
  }

  if (isCloudMode) {
    leadingControls.push({ kind: "cloud-run-location" });
    leadingControls.push({
      kind: "cloud-follow-up-starting-state",
      props: { startingState: props.asyncThreadStartingState },
    });
  }

  if ((isCloudMode || isWorktreeMode) && !hasExistingWorkspace) {
    leadingControls.push({
      kind: "branch-switcher",
      props: {
        branchSource: isWorktreeMode ? "worktree" : "cloud",
        gitRootOverride: props.gitRootForStartingState ?? null,
        startingState: props.asyncThreadStartingState,
      },
    });
  }

  if (isWorktreeMode) {
    leadingControls.push({
      kind: "worktree-environment",
      props: {
        hostId: props.worktreeEnvironmentHostId ?? null,
        workspaceRoot: props.worktreeEnvironmentWorkspaceRoot,
      },
    });
  }

  if (props.showRuntimeControls) trailingControls.push({ kind: "runtime-controls" });
  if (props.freeUpsellButton != null) {
    trailingControls.push({ kind: "free-upsell", props: { content: props.freeUpsellButton } });
  }

  if (props.localRemoteExecutionTarget != null && props.composerMode === "local") {
    const target = props.localRemoteExecutionTarget;
    const projectPath = props.remoteConfig.getProjectPathForHostId(target.hostId);
    const remoteHost = createRemoteHostControl(target.hostId, null, projectPath);
    if (remoteHost != null) trailingControls.push(remoteHost);
  }

  const view: ComposerUtilityBarView = {
    kind: "composer-utility-bar",
    layout: isHome ? "floating-home" : "inline-footer",
    hidden: props.isHidden === true,
    leadingControls,
    trailingControls,
  };
  const jsx = (appSharedChunk as any).I3?.();
  if (jsx == null) return null;
  const renderControl = (control: ComposerUtilityControl, index: number): unknown => {
    const details = control.props ?? {};
    if (control.kind === "home-auxiliary" || control.kind === "free-upsell") return details.content ?? null;
    if (control.kind === "mode-selector") return jsx.jsxs("label", { children: [
      jsx.jsx("span", { className: "sr-only", children: "Run location" }),
      jsx.jsxs("select", { disabled: control.disabled, value: props.composerMode, onChange: (event: { target: { value: ComposerMode } }) => props.setComposerMode(event.target.value), children: [
        jsx.jsx("option", { value: "local", children: "Local" }),
        details.allowWorktree ? jsx.jsx("option", { value: "worktree", children: "Worktree" }) : null,
        jsx.jsx("option", { value: "cloud", children: "Cloud" }),
      ] }),
    ] }, `${control.kind}:${index}`);
    const label = details.label ?? details.projectPath ?? ({
      "branch-switcher": "Branch",
      "cloud-follow-up-starting-state": "Starting state",
      "cloud-run-location": "Cloud",
      "existing-workspace": "Existing workspace",
      "project-picker": "Project",
      "remote-host": "Remote host",
      "runtime-controls": "Runtime",
      "worktree-environment": "Environment",
    } as Record<string, string>)[control.kind] ?? control.kind;
    return jsx.jsx("button", { disabled: control.disabled, type: "button", "data-composer-utility-control": control.kind, title: typeof details.projectPath === "string" ? details.projectPath : undefined, children: String(label) }, `${control.kind}:${index}`);
  };
  return jsx.jsxs("div", {
    className: view.layout === "floating-home" ? "flex items-center justify-between" : "flex items-center gap-2",
    hidden: view.hidden,
    "data-composer-utility-bar": view.layout,
    children: [jsx.jsx("div", { className: "flex min-w-0 items-center gap-2", children: view.leadingControls.map(renderControl) }), jsx.jsx("div", { className: "ml-auto flex items-center gap-2", children: view.trailingControls.map(renderControl) })],
  });
}

export { ComposerUtilityBar };
