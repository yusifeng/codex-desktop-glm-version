import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import {
  Q as CommitBlockedMessage,
  et as PushBlockedMessage,
  t as NewBranchField,
} from "@rchunk/git-action-new-branch-field";
import "@rchunk/commit-icon";

export interface HostConfig { id: string; [key: string]: unknown }
export interface RepositoryTarget { cwd: string; hostConfig: HostConfig; hostId?: string; repo?: string | null; root?: string | null }
export interface BranchRecord { name: string; remote?: boolean; sha?: string | null }
export interface BranchListProps {
  branches: string[];
  disabled?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  isSearchError?: boolean;
  isSearchLoading?: boolean;
  repositoryName?: string;
  searchedBranches?: string[];
  searchQuery?: string;
  selectedBranch?: string | null;
  onClose?(): void;
  onRetry?(): void;
  onRetrySearch?(): void;
  onSearchQueryChange?(query: string): void;
  onSelectBranch?(branch: string): void;
  onSelectCustomBranch?(branch: string): void;
  renderBranchSubText?(branch: string): unknown;
}
export interface BranchSwitcherProps {
  align?: "start" | "center" | "end";
  cwd: string;
  gitRoot?: string | null;
  hostConfig: HostConfig;
  isLoading?: boolean;
  isReadOnly?: boolean;
  open?: boolean;
  shouldShow?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  onOpenChange?(open: boolean): void;
  onSelectBranch?(branch: string): void;
}

let jsx: JsxRuntime;

function repositoryName(target: RepositoryTarget | null | undefined): string {
  if (target?.repo) return target.repo;
  const path = target?.root ?? target?.cwd ?? "";
  return path.replaceAll("\\", "/").replace(/\/$/, "").split("/").at(-1) ?? "";
}

function initializeCore(): void { jsx = getJsxRuntime(); }
function initializeBranchQueries(): void {}
function initializeCheckoutBranch(): void {}
function initializeCreateBranch(): void {}
function initializeBranchList(): void { jsx = getJsxRuntime(); }
function initializeBranchSwitcher(): void { initializeCore(); initializeBranchQueries(); initializeBranchList(); }

function branchQueryKey(input: { cwd?: string | null; enabled: boolean; hostConfig: HostConfig; operationSource: string }): string {
  return JSON.stringify({ cwd: input.cwd ?? null, enabled: input.enabled, hostConfig: input.hostConfig, operationSource: input.operationSource });
}

function branchSearchKey(input: { cwd?: string | null; enabled: boolean; hostConfig: HostConfig; operationSource: string; preserveRemoteRefs?: boolean; query: string }): string {
  return JSON.stringify({ cwd: input.cwd ?? null, enabled: input.enabled, hostConfig: input.hostConfig,
    operationSource: input.operationSource, preserveRemoteRefs: input.preserveRemoteRefs ?? false, query: input.query });
}

function recentBranchesQuery(root: string | null | undefined, hostConfig: HostConfig, operationSource: string, options: Record<string, unknown> = {}): Record<string, unknown> {
  return { method: "recent-branches", params: { root: root ?? null, operationSource, limit: 100 }, hostConfig, ...options };
}

function statusSummaryQuery(root: string | null | undefined, hostConfig: HostConfig, operationSource: string, options: Record<string, unknown> = {}): Record<string, unknown> {
  const params = { cwd: root ?? "", includeUntrackedFiles: false, operationSource };
  return { method: "status-summary", params, hostConfig, liveQuery: { method: "status-summary", params: { ...params, includeUntrackedFiles: true } }, ...options };
}

function checkoutBranchMutation(target: RepositoryTarget | null, operationSource: string): { mutationKey: unknown[]; mutationFn(input: { branch: string }): Promise<Record<string, unknown>> } {
  return {
    mutationKey: ["vscode", "git-checkout-branch", target?.cwd ?? null, target?.hostId ?? target?.hostConfig.id ?? null],
    mutationFn: async (input) => {
      if (target == null) throw new Error("Expected a repository target");
      return { status: "success", params: { ...input, cwd: target.cwd, hostId: target.hostId ?? target.hostConfig.id }, source: operationSource };
    },
  };
}

function createBranchMutation(target: RepositoryTarget | null, operationSource: string): { mutationKey: unknown[]; mutationFn(input: { branch: string; mode?: string }): Promise<Record<string, unknown>> } {
  return {
    mutationKey: ["vscode", "git-create-branch", target?.cwd ?? null, target?.hostId ?? target?.hostConfig.id ?? null],
    mutationFn: async (input) => {
      if (target == null) throw new Error("Expected a repository target");
      return { status: "success", params: { ...input, cwd: target.cwd, hostId: target.hostId ?? target.hostConfig.id }, source: operationSource };
    },
  };
}

function BranchNameHeader({ showSetPrefix = true }: { showSetPrefix?: boolean }): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    runtime.jsx("span", { className: "text-sm font-medium", children: "Branch name" }),
    showSetPrefix ? runtime.jsx("button", { type: "button", children: "Set prefix" }) : null,
  ] });
}

function BranchList(props: BranchListProps): unknown {
  const runtime = ensureJsx();
  const query = props.searchQuery?.trim() ?? "";
  const source = query ? (props.searchedBranches ?? []) : props.branches;
  const branches = uniqueBranches({ branches: source, currentBranch: props.selectedBranch ?? null, defaultBranch: null });
  return runtime.jsxs("div", { role: "listbox", "aria-busy": Boolean(props.isLoading || props.isSearchLoading), children: [
    runtime.jsx("input", { "aria-label": `Search ${props.repositoryName ?? "repository"} branches`, value: props.searchQuery ?? "",
      onChange: (event: { target: { value: string } }) => props.onSearchQueryChange?.(event.target.value) }),
    (props.isError || props.isSearchError) ? runtime.jsx("button", { type: "button", onClick: query ? props.onRetrySearch : props.onRetry, children: "Retry" }) : null,
    ...branches.map((branch) => runtime.jsx("button", { type: "button", role: "option", "aria-selected": branch === props.selectedBranch,
      disabled: props.disabled, onClick: () => props.onSelectBranch?.(branch), children: branch }, branch)),
    query && !branches.includes(query) ? runtime.jsx(NewBranchField, { value: query, onChange: props.onSearchQueryChange ?? (() => {}), placeholder: "Create branch" }) : null,
  ] });
}

function selectionState(input: { disabled?: boolean; hasNoCommits?: boolean; statusSummary?: { stagedCount: number; unstagedCount: number; untrackedCount?: number | null; type: string } | null }): { branchSelectionDisabled: boolean; createAndCheckoutDisabled: boolean; uncommittedFileCount: number } {
  const disabled = input.disabled === true;
  const status = input.statusSummary;
  return { branchSelectionDisabled: disabled, createAndCheckoutDisabled: disabled || input.hasNoCommits === true,
    uncommittedFileCount: status?.type === "success" ? Math.max(status.stagedCount, status.unstagedCount) + (status.untrackedCount ?? 0) : 0 };
}

function BranchSwitcher(props: BranchSwitcherProps): unknown {
  if (props.shouldShow === false) return null;
  const runtime = ensureJsx();
  return runtime.jsxs("div", { "data-side": props.side ?? "top", "data-align": props.align ?? "end", children: [
    runtime.jsx("button", { type: "button", disabled: props.isReadOnly || props.isLoading, "aria-expanded": props.open,
      onClick: () => props.onOpenChange?.(!props.open), children: props.isLoading ? "Loading branch…" : repositoryName({ cwd: props.cwd, hostConfig: props.hostConfig, root: props.gitRoot }) }),
    props.open ? runtime.jsx(BranchList, { branches: [], repositoryName: repositoryName({ cwd: props.cwd, hostConfig: props.hostConfig, root: props.gitRoot }), onSelectBranch: props.onSelectBranch }) : null,
  ] });
}

function GitActionsDialog(props: Record<string, unknown>): unknown {
  return ensureJsx().jsx("section", { role: "dialog", "aria-label": "Git actions", ...props });
}

function uniqueBranches(input: { branches: string[]; currentBranch?: string | null; defaultBranch?: string | null }): string[] {
  const result: string[] = []; const seen = new Set<string>();
  for (const branch of [input.defaultBranch, input.currentBranch, ...input.branches]) {
    if (branch && !seen.has(branch)) { seen.add(branch); result.push(branch); }
  }
  return result;
}

function stopPlainEnter(event: { ctrlKey?: boolean; key: string; metaKey?: boolean; stopPropagation(): void }): void {
  if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) event.stopPropagation();
}

function actionTooltip(input: { commitReason?: Parameters<typeof CommitBlockedMessage>[0]["reason"]; pushReason?: Parameters<typeof PushBlockedMessage>[0]["reason"] }): unknown {
  return input.commitReason != null ? ensureJsx().jsx(CommitBlockedMessage, { reason: input.commitReason })
    : input.pushReason != null ? ensureJsx().jsx(PushBlockedMessage, { reason: input.pushReason }) : null;
}

function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export {
  BranchNameHeader as a,
  statusSummaryQuery as c,
  initializeBranchQueries as d,
  checkoutBranchMutation as f,
  initializeCore as g,
  repositoryName as h,
  initializeBranchList as i,
  initializeCheckoutBranch as l,
  initializeCreateBranch as m,
  initializeBranchSwitcher as n,
  BranchNameHeader as o,
  GitActionsDialog as p,
  createBranchMutation as r,
  branchSearchKey as s,
  BranchSwitcher as t,
  recentBranchesQuery as u,
};

void branchQueryKey;
void selectionState;
void stopPlainEnter;
void actionTooltip;
void uniqueBranches;
