import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import { t as BranchSwitcher } from "@rchunk/git-branch-switcher";
import "@rchunk/environment-labels";
import "@rchunk/local-environment-workflow-messages";
import "@rchunk/use-git-recent-branches";

export interface StartingState { branchName?: string; remoteRef?: string; type: "branch" | "working-tree" }
export interface Environment { configPath: string | null; name: string }
export interface StartingStateDropdownProps {
  branchSource?: "worktree" | "repository";
  className?: string;
  gitRootOverride?: string | null;
  hostConfig: { id: string; [key: string]: unknown };
  side?: "top" | "right" | "bottom" | "left";
  startingState: StartingState;
  setStartingState(value: StartingState): void;
}
export interface EnvironmentDropdownProps {
  align?: "start" | "center" | "end";
  className?: string;
  environments: Environment[];
  hasError?: boolean;
  isLoading?: boolean;
  labelClassName?: string;
  repairConfigPath?: string | null;
  selectedConfigPath?: string | null;
  showDefaultOption?: boolean;
  showIcon?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  workspaceRoot: string;
  onOpenSettings?(): void;
  onSelectConfigPath?(configPath: string | null): void;
}

let jsx: JsxRuntime;

function stripRemoteRef(branch: string): string { return branch.startsWith("refs/remotes/") ? branch.slice(13) : branch; }
function chooseRemoteDefault(input: { currentBranch?: string | null; gitDefaultBranch?: string | null; recentBranches?: string[] | null; remoteDefaultBranch?: string | null }): string | null {
  const remote = input.remoteDefaultBranch;
  return remote && (remote === input.currentBranch || remote === input.gitDefaultBranch || input.recentBranches?.includes(remote)) ? remote : null;
}
function orderedBranches(input: { branches?: Array<string | null | undefined>; currentBranch?: string | null; gitDefaultBranch?: string | null; remoteDefaultBranch?: string | null }): string[] {
  const seen = new Set<string>(); const result: string[] = [];
  for (const branch of [input.gitDefaultBranch, input.currentBranch, input.remoteDefaultBranch, ...(input.branches ?? [])]) {
    if (branch && !seen.has(branch)) { seen.add(branch); result.push(branch); }
  }
  return result;
}

function StartingStateDropdown(props: StartingStateDropdownProps): unknown {
  const runtime = ensureJsx();
  const currentBranch = props.startingState.type === "branch" ? (props.startingState.remoteRef ?? props.startingState.branchName) : undefined;
  return runtime.jsx(BranchSwitcher, {
    cwd: props.gitRootOverride ?? "", gitRoot: props.gitRootOverride, hostConfig: props.hostConfig,
    side: props.side ?? "top", shouldShow: true,
    onSelectBranch: (branch: string) => props.setStartingState({ type: "branch", branchName: stripRemoteRef(branch), remoteRef: branch }),
    currentBranch,
  });
}

function StaticUtilityLabel(props: { categoryLabel?: unknown; className?: string; icon?: unknown; value: unknown; valueClassName?: string }): unknown {
  return ensureJsx().jsx("div", { className: props.className, "data-category": props.categoryLabel, children: props.value });
}

function ComposerBranchSwitcher(props: Record<string, unknown>): unknown {
  return ensureJsx().jsx(BranchSwitcher, { ...props, renderWhileLoading: true });
}

function EnvironmentDropdown(props: EnvironmentDropdownProps): unknown {
  const runtime = ensureJsx();
  const selected = props.environments.find((environment) => environment.configPath === props.selectedConfigPath);
  return runtime.jsxs("div", { className: props.className, "data-side": props.side ?? "top", "data-align": props.align ?? "start", children: [
    runtime.jsx("button", { type: "button", disabled: props.isLoading, children: environmentLabel({ isLoading: props.isLoading, environmentResult: selected == null ? null : { type: "success", environment: selected } }) }),
    props.hasError ? runtime.jsx("button", { type: "button", onClick: props.onOpenSettings, children: "Environment needs attention" }) : null,
    runtime.jsxs("div", { role: "listbox", children: [
      props.showDefaultOption === false ? null : runtime.jsx("button", { type: "button", onClick: () => props.onSelectConfigPath?.(null), children: "Default environment" }),
      ...props.environments.map((environment) => runtime.jsx("button", { type: "button", "aria-selected": environment.configPath === props.selectedConfigPath,
        onClick: () => props.onSelectConfigPath?.(environment.configPath), children: environment.name }, environment.configPath ?? "default")),
    ] }),
  ] });
}

function isSuccessfulEnvironmentResult(value: { type?: string } | null | undefined): boolean { return value?.type === "success"; }
function environmentTitle(workspaceRoot: string, roots: string[] = [workspaceRoot]): string {
  if (roots.length <= 1) return "Environment";
  const name = workspaceRoot.replaceAll("\\", "/").replace(/\/$/, "").split("/").at(-1) ?? workspaceRoot;
  return `Environment · ${name}`;
}
function environmentLabel(input: { isLoading?: boolean; environmentResult?: { type: "error" } | { type: "success"; environment: Environment } | null }): string {
  if (input.isLoading) return "Loading environments…";
  if (input.environmentResult?.type === "error") return "Needs attention";
  if (input.environmentResult?.type === "success") return input.environmentResult.environment.name;
  return "No environment";
}

function initializeStartingStateDropdown(): void { jsx = getJsxRuntime(); }
function initializeStaticUtilityLabel(): void { jsx = getJsxRuntime(); }
function initializeComposerBranchSwitcher(): void { jsx = getJsxRuntime(); }
function initializeEnvironmentDropdown(): void { jsx = getJsxRuntime(); }
function initializeAll(): void { initializeStartingStateDropdown(); initializeStaticUtilityLabel(); initializeComposerBranchSwitcher(); initializeEnvironmentDropdown(); }
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export {
  StaticUtilityLabel as a,
  initializeStartingStateDropdown as c,
  initializeComposerBranchSwitcher as i,
  initializeAll as n,
  initializeStaticUtilityLabel as o,
  ComposerBranchSwitcher as r,
  StartingStateDropdown as s,
  EnvironmentDropdown as t,
};

void chooseRemoteDefault;
void environmentTitle;
void isSuccessfulEnvironmentResult;
void orderedBranches;
