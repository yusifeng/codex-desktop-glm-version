// Git branch queries, commit workflow and composer branch switcher.
// The short exports at the bottom intentionally match the published chunk.

import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as gitActionsChunk from "@rchunk/git-action-new-branch-field";
import "@rchunk/commit-icon";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export interface HostConfig { id: string; [key: string]: unknown }
export interface RepositoryTarget { cwd: string; hostConfig: HostConfig; hostId?: string; repo?: string | null; root?: string | null; dispatchGitAction?(input: UnknownRecord): Promise<unknown> }
export interface StatusSummary { branch?: string | null; stagedCount: number; type: string; unstagedCount: number; untrackedCount?: number | null }
export interface QueryResult<Value> { data?: Value; isError?: boolean; isFetching?: boolean; isLoading?: boolean; refetch?(): unknown }
export interface BranchListProps {
  branches: string[]; disabled?: boolean; isError?: boolean; isLoading?: boolean; isSearchError?: boolean;
  isSearchLoading?: boolean; onClose?(): void; onRetry?(): void; onRetrySearch?(): void;
  onSearchQueryChange?(query: string): void; onSelectBranch?(branch: string): void;
  onSelectCustomBranch?(branch: string): void; renderBranchSubText?(branch: string): unknown;
  repositoryName?: string; searchedBranches?: string[]; searchQuery?: string; selectedBranch?: string | null;
}
export interface BranchSwitcherProps {
  align?: "start" | "center" | "end"; cwd: string; detachedControl?: boolean; gitRoot?: string | null;
  hostConfig: HostConfig; isLoading?: boolean; isReadOnly?: boolean; localConversationId?: string | null;
  onOpenChange?(open: boolean): void; onSelectBranch?(branch: string): void; open?: boolean;
  renderControl?(state: { branch: string; isLoading: boolean; open: boolean; toggle(): void }): unknown;
  renderStaticBranch?(branch: string): unknown; renderWhileLoading?: boolean; revalidateBranchSelection?(branch: string): void;
  shouldShow?: boolean; side?: "top" | "right" | "bottom" | "left";
}
export interface CommitModalProps {
  codexWorktree?: boolean; conversationId?: string | null; enablePushActions?: boolean; open: boolean;
  onOpenChange(open: boolean): void; onRequestReset?(): void; onStatusChange?(status: "loading" | "success" | "error"): void;
  operationSource?: string; target: RepositoryTarget;
}

type UnknownRecord = Record<string, unknown>;
const shared = sharedChunk as unknown as UnknownRecord;
const initial = initialChunk as unknown as UnknownRecord;
const primary = primaryChunk as unknown as UnknownRecord;
const gitActions = gitActionsChunk as unknown as UnknownRecord;
let jsx: JsxRuntime;
let React: ReactRuntime;
let branchLookupSignal: unknown;
let branchSearchSignal: unknown;

function runtime(): JsxRuntime {
  if (jsx == null) jsx = (sharedChunk.I3 as () => JsxRuntime)();
  return jsx;
}
function react(): ReactRuntime {
  if (React == null) {
    const candidate = sharedChunk.e6 as unknown;
    React = (typeof candidate === "function" && !(candidate as { useState?: unknown }).useState
      ? (candidate as () => ReactRuntime)()
      : candidate) as ReactRuntime;
  }
  return React;
}
function call<Value>(owner: UnknownRecord, names: string[], ...args: unknown[]): Value | undefined {
  for (const name of names) {
    const fn = owner[name];
    if (typeof fn === "function") return (fn as (...values: unknown[]) => Value)(...args);
  }
  return undefined;
}
function useQuery<Value>(descriptor: UnknownRecord, fallback: Value): QueryResult<Value> {
  const result = call<QueryResult<Value>>(shared, ["BX"], descriptor);
  return result ?? { data: fallback };
}

function repositoryName(target: RepositoryTarget | null | undefined): string {
  if (target?.repo) return target.repo;
  const path = target?.root ?? target?.cwd ?? "";
  return path.replaceAll("\\", "/").replace(/\/$/, "").split("/").at(-1) ?? "";
}
function branchQueryKey(input: { cwd?: string | null; enabled: boolean; hostConfig: HostConfig; operationSource: string }): string {
  return JSON.stringify({ cwd: input.cwd ?? null, enabled: input.enabled, hostConfig: input.hostConfig, operationSource: input.operationSource });
}
function branchSearchKey(input: { cwd?: string | null; enabled: boolean; hostConfig: HostConfig; operationSource: string; preserveRemoteRefs?: boolean; query: string }): string {
  return JSON.stringify({ cwd: input.cwd ?? null, enabled: input.enabled, hostConfig: input.hostConfig,
    operationSource: input.operationSource, preserveRemoteRefs: input.preserveRemoteRefs ?? false, query: input.query });
}
function normalizeRoot(root: string | null | undefined): string { return (root ?? "").replace(/\/$/, ""); }
function statusSummaryQuery(root: string | null | undefined, hostConfig: HostConfig, operationSource: string, options: UnknownRecord = {}): UnknownRecord {
  const params = { cwd: normalizeRoot(root), includeUntrackedFiles: false, operationSource };
  const liveQuery = { method: "status-summary", params: { ...params, includeUntrackedFiles: true } };
  const query = call<UnknownRecord>(initial, ["Zan"], root, hostConfig, "status-summary", params, operationSource, { liveQuery, staleTime: Infinity, ...options });
  return query ?? { method: "status-summary", params, hostConfig, liveQuery, ...options };
}
function recentBranchesQuery(root: string | null | undefined, hostConfig: HostConfig, operationSource: string, options: UnknownRecord = {}): UnknownRecord {
  const select = (value: { branches?: string[] }) => value.branches ?? [];
  const liveQuery = { method: "recent-branches", params: { root: normalizeRoot(root), operationSource, limit: 100 } };
  const query = call<UnknownRecord>(initial, ["Zan"], root, hostConfig, "recent-branches",
    ({ root: resolvedRoot }: { root: string }) => ({ root: resolvedRoot, operationSource, limit: 100 }), operationSource,
    { liveQuery, select, staleTime: Infinity, ...options });
  return query ?? { method: "recent-branches", params: liveQuery.params, hostConfig, liveQuery, select, ...options };
}

function initializeCore(): void { runtime(); }
function initializeBranchQueries(): void {
  if (branchLookupSignal != null) return;
  const createDerived = shared.QX as undefined | ((base: unknown, derive: (...args: unknown[]) => unknown, options: UnknownRecord) => unknown);
  if (createDerived == null) {
    branchLookupSignal = { key: branchQueryKey };
    branchSearchSignal = { key: branchSearchKey };
    return;
  }
  branchLookupSignal = createDerived(shared.ZI, (input: { cwd?: string | null; enabled: boolean; hostConfig: HostConfig; operationSource: string }) => ({
    method: "repository-root", params: input, enabled: input.enabled,
  }), { key: branchQueryKey });
  branchSearchSignal = createDerived(shared.ZI, (input: { cwd?: string | null; enabled: boolean; hostConfig: HostConfig; operationSource: string; preserveRemoteRefs?: boolean; query: string }) => ({
    method: "search-branches", params: { root: input.cwd ?? null, operationSource: input.operationSource,
      preserveRemoteRefs: input.preserveRemoteRefs ?? false, query: input.query, limit: 20 }, enabled: input.enabled,
  }), { key: branchSearchKey });
}
function initializeRecentBranches(): void { runtime(); }
function initializeCommitModal(): void { runtime(); react(); }
function initializeBranchNameHeader(): void { runtime(); }
function initializeBranchList(): void { runtime(); react(); }
function initializeStatusSummaryQuery(): void { runtime(); }
function initializeBranchSwitcher(): void {
  initializeCore(); initializeBranchQueries(); initializeRecentBranches(); initializeCommitModal();
  initializeBranchNameHeader(); initializeBranchList(); initializeStatusSummaryQuery();
}

function BranchNameHeader({ showSetPrefix = true }: { showSetPrefix?: boolean }): unknown {
  const r = runtime();
  const navigate = call<(path: string) => void>(shared, ["Oh", "He"]) ?? (() => {});
  return r.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    r.jsx("span", { className: "text-sm font-medium text-default", children: "Branch name" }),
    showSetPrefix ? r.jsx("button", { className: "text-sm", type: "button", onClick: () => navigate("/settings/git-settings"), children: "Set prefix" }) : null,
  ] });
}

function uniqueBranches(input: { branches: string[]; currentBranch?: string | null; defaultBranch?: string | null }): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const branch of [input.defaultBranch, input.currentBranch, ...input.branches]) {
    if (branch && !seen.has(branch)) { seen.add(branch); output.push(branch); }
  }
  return output;
}
function BranchList(props: BranchListProps): unknown {
  const r = runtime();
  const state = react();
  const [localSearch, setLocalSearch] = state.useState("");
  const query = props.searchQuery ?? localSearch;
  const setQuery = props.onSearchQueryChange ?? setLocalSearch;
  const source = query.trim() ? (props.searchedBranches ?? []) : props.branches;
  const branches = uniqueBranches({ branches: source, currentBranch: props.selectedBranch });
  const retry = query.trim() ? props.onRetrySearch : props.onRetry;
  let body: unknown;
  if (props.isError || props.isSearchError) {
    body = r.jsxs("div", { role: "alert", children: ["Branches could not be loaded.", r.jsx("button", { type: "button", onClick: retry, children: "Retry" })] });
  } else if ((props.isLoading || props.isSearchLoading) && branches.length === 0) {
    body = r.jsx("p", { role: "status", children: "Loading branches…" });
  } else {
    body = r.jsx("div", { role: "listbox", children: branches.map((branch) => r.jsxs("button", {
      type: "button", role: "option", disabled: props.disabled, "aria-selected": branch === props.selectedBranch,
      onClick: () => { props.onSelectBranch?.(branch); props.onClose?.(); },
      children: [r.jsx("span", { children: branch }), props.renderBranchSubText?.(branch)],
    }, branch)) });
  }
  const custom = query.trim();
  return r.jsxs("div", { className: "branch-list", children: [
    r.jsx("input", { "aria-label": `Search ${props.repositoryName ?? "repository"} branches`, autoFocus: true, value: query,
      onChange: (event: { target: { value: string } }) => setQuery(event.target.value) }),
    body,
    custom && !branches.includes(custom) ? r.jsx("button", { type: "button", disabled: props.disabled,
      onClick: () => props.onSelectCustomBranch?.(custom), children: `Create ${custom}` }) : null,
  ] });
}

function statusFileCount(summary: StatusSummary | null | undefined): number {
  return summary?.type === "success" ? Math.max(summary.stagedCount, summary.unstagedCount) + (summary.untrackedCount ?? 0) : 0;
}
function selectionState(input: { disabled?: boolean; hasNoCommits?: boolean; statusSummary?: StatusSummary | null }): { branchSelectionDisabled: boolean; createAndCheckoutDisabled: boolean; uncommittedFileCount: number } {
  const disabled = input.disabled === true;
  return { branchSelectionDisabled: disabled, createAndCheckoutDisabled: disabled || input.hasNoCommits === true,
    uncommittedFileCount: statusFileCount(input.statusSummary) };
}

function CommitModal(props: CommitModalProps): unknown {
  const r = runtime();
  const state = react();
  const [message, setMessage] = state.useState("");
  const [includeLocalChanges, setIncludeLocalChanges] = state.useState(true);
  const [newBranch, setNewBranch] = state.useState("");
  const [pending, setPending] = state.useState(false);
  const enablePush = props.enablePushActions === true;
  const submit = async (nextStep: "commit" | "push" | "commit-and-push") => {
    if (pending || (nextStep !== "push" && message.trim().length === 0)) return;
    setPending(true); props.onStatusChange?.("loading"); props.onOpenChange(false);
    try {
      const input: UnknownRecord = { kind: "commit", commitMessage: message.trim(), includeLocalChanges,
        newBranch: newBranch.trim() || undefined, nextStep, conversationId: props.conversationId ?? null,
        cwd: props.target.cwd, hostId: props.target.hostId ?? props.target.hostConfig.id };
      if (props.target.dispatchGitAction != null) await props.target.dispatchGitAction(input);
      else await call<Promise<unknown>>(initial, ["Qln", "Ce"], "git-commit", { params: input, source: props.operationSource ?? "commit_modal" });
      props.onStatusChange?.("success"); props.onRequestReset?.();
    } catch (error) {
      props.onStatusChange?.("error"); throw error;
    } finally { setPending(false); }
  };
  return r.jsxs("dialog", { open: props.open, "aria-label": enablePush ? "Commit or push" : "Commit", children: [
    r.jsx("h2", { children: enablePush ? "Commit or push" : "Commit" }),
    r.jsxs("label", { children: ["Commit message", r.jsx("textarea", { value: message,
      onChange: (event: { target: { value: string } }) => setMessage(event.target.value) })] }),
    props.codexWorktree ? r.jsxs("label", { children: [r.jsx("input", { type: "checkbox", checked: includeLocalChanges,
      onChange: (event: { target: { checked: boolean } }) => setIncludeLocalChanges(event.target.checked) }), "Include local changes"] }) : null,
    enablePush ? r.jsxs("label", { children: ["New branch", r.jsx("input", { value: newBranch,
      onChange: (event: { target: { value: string } }) => setNewBranch(event.target.value), placeholder: "Use current branch" })] }) : null,
    r.jsxs("footer", { children: [
      r.jsx("button", { type: "button", disabled: pending, onClick: () => props.onOpenChange(false), children: "Cancel" }),
      enablePush ? r.jsx("button", { type: "button", disabled: pending, onClick: () => submit("push"), children: "Push" }) : null,
      r.jsx("button", { type: "button", disabled: pending || message.trim().length === 0,
        onClick: () => submit(enablePush ? "commit-and-push" : "commit"), children: enablePush ? "Commit and push" : "Commit" }),
    ] }),
  ] });
}

function BranchSwitcher(props: BranchSwitcherProps): unknown {
  if (props.shouldShow === false) return null;
  const r = runtime();
  const state = react();
  const [internalOpen, setInternalOpen] = state.useState(false);
  const [search, setSearch] = state.useState("");
  const open = props.open ?? internalOpen;
  const setOpen = (value: boolean) => { setInternalOpen(value); props.onOpenChange?.(value); };
  const root = props.gitRoot ?? props.cwd;
  const status = useQuery<StatusSummary>(statusSummaryQuery(root, props.hostConfig, "composer_branch_switcher"),
    { type: "success", branch: null, stagedCount: 0, unstagedCount: 0, untrackedCount: 0 });
  const currentBranch = status.data?.branch ?? "";
  const recent = useQuery<string[]>(recentBranchesQuery(root, props.hostConfig, "composer_branch_switcher", { enabled: open }), []);
  const searched = useQuery<string[]>({ method: "search-branches", params: { root, query: search, limit: 20 }, hostConfig: props.hostConfig, enabled: Boolean(open && search.trim()) }, []);
  const loading = props.isLoading === true || status.isLoading === true;
  const toggle = () => setOpen(!open);
  if (loading && props.renderWhileLoading !== true) return null;
  if (!loading && !currentBranch && props.renderStaticBranch != null) return props.renderStaticBranch(currentBranch);
  const control = props.renderControl?.({ branch: currentBranch, isLoading: loading, open, toggle }) ?? r.jsx("button", {
    type: "button", disabled: props.isReadOnly || loading, "aria-expanded": open, onClick: toggle,
    children: loading ? "Loading branch…" : currentBranch || repositoryName({ cwd: props.cwd, root, hostConfig: props.hostConfig }),
  });
  return r.jsxs("div", { "data-side": props.side ?? "top", "data-align": props.align ?? "end", children: [
    control,
    open ? r.jsx(BranchList, { branches: recent.data ?? [], searchedBranches: searched.data ?? [], searchQuery: search,
      repositoryName: repositoryName({ cwd: props.cwd, root, hostConfig: props.hostConfig }), selectedBranch: currentBranch,
      disabled: props.isReadOnly, isError: recent.isError, isLoading: recent.isLoading || recent.isFetching,
      isSearchError: searched.isError, isSearchLoading: searched.isLoading || searched.isFetching,
      onClose: () => setOpen(false), onRetry: () => recent.refetch?.(), onRetrySearch: () => searched.refetch?.(),
      onSearchQueryChange: setSearch, onSelectBranch: (branch) => { props.onSelectBranch?.(branch); props.revalidateBranchSelection?.(branch); setOpen(false); },
      onSelectCustomBranch: (branch) => { props.onSelectBranch?.(branch); setOpen(false); },
      renderBranchSubText: (branch) => branch === currentBranch && statusFileCount(status.data) > 0 ? `${statusFileCount(status.data)} uncommitted files` : null,
    }) : null,
  ] });
}

initializeBranchQueries();

export {
  BranchNameHeader as a,
  statusSummaryQuery as c,
  branchSearchSignal as d,
  initializeBranchQueries as f,
  initializeCore as g,
  repositoryName as h,
  initializeBranchList as i,
  initializeRecentBranches as l,
  initializeCommitModal as m,
  initializeBranchSwitcher as n,
  initializeBranchNameHeader as o,
  CommitModal as p,
  BranchList as r,
  initializeStatusSummaryQuery as s,
  BranchSwitcher as t,
  recentBranchesQuery as u,
};

void branchLookupSignal;
void primary;
void gitActions;
void selectionState;
