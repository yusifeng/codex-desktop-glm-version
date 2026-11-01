// Local conversation Git command registration, action menu and workflow dialogs.
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as branchChunk from "@rchunk/git-branch-switcher";
import * as pullRequestChunk from "@rchunk/create-pull-request-modal-content";
import "@rchunk/git-action-new-branch-field";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export type GitActionPhase = "commit" | "create-branch" | "create-pr" | "create-draft-pr" | "push" | "worktree-branch-setup";
type UnknownRecord = Record<string, unknown>;
export interface LocalConversationGitActionsProps {
  conversationId?: string | null; codexWorktree?: boolean; deferQueries?: boolean;
  onCreatePullRequestActionReady?(action: () => void): void; onMenuOpenChange?(open: boolean): void;
  registerCommands?: boolean; renderActions?(actions: unknown): unknown; surface?: string;
  target: { hostId: string; cwd?: string; hostConfig?: UnknownRecord; [key: string]: unknown };
}

const shared = sharedChunk as unknown as UnknownRecord;
const initial = initialChunk as unknown as UnknownRecord;
const primary = primaryChunk as unknown as UnknownRecord;
const branches = branchChunk as unknown as UnknownRecord;
const pullRequest = pullRequestChunk as unknown as UnknownRecord;
let jsx: JsxRuntime;
let React: ReactRuntime;

function getJsx(): JsxRuntime {
  if (jsx == null) jsx = (sharedChunk.I3 as () => JsxRuntime)();
  return jsx;
}
function getReact(): ReactRuntime {
  if (React != null) return React;
  const candidate = sharedChunk.e6 as unknown;
  if (candidate != null) {
    React = (typeof candidate === "function" && !(candidate as { useState?: unknown }).useState
      ? (candidate as () => ReactRuntime)()
      : candidate) as ReactRuntime;
  } else {
    React = {
      useState<Value>(initialValue: Value) { let value = initialValue; return [value, (next: Value | ((current: Value) => Value)) => { value = typeof next === "function" ? (next as (current: Value) => Value)(value) : next; }]; },
      useEffect(effect: () => void | (() => void)) { effect(); },
    } as unknown as ReactRuntime;
  }
  return React;
}
function phaseLabel(phase: GitActionPhase): string {
  return ({ commit: "Commit changes", "create-branch": "Create branch", "create-pr": "Create pull request",
    "create-draft-pr": "Create draft pull request", push: "Push changes", "worktree-branch-setup": "Set up worktree branch" })[phase];
}
function GitActionStatus({ phase }: { phase: GitActionPhase }): unknown {
  return getJsx().jsx("span", { role: "status", "data-git-action-phase": phase, children: phaseLabel(phase) });
}

function resolveHostConfig(target: LocalConversationGitActionsProps["target"]): UnknownRecord {
  if (target.hostConfig != null) return target.hostConfig;
  for (const name of ["Vfn", "getHostConfig", "ue"]) {
    const fn = initial[name];
    if (typeof fn === "function") {
      const result = (fn as (hostId: string) => UnknownRecord)(target.hostId);
      if (result != null) return result;
    }
  }
  return { id: target.hostId };
}
function registerCommand(id: string, action: () => void, enabled: boolean): (() => void) | undefined {
  for (const name of ["pEt", "registerCommand", "J"]) {
    const fn = initial[name];
    if (typeof fn === "function") return (fn as (command: string, handler: () => void, options: UnknownRecord) => (() => void) | undefined)(id, action, { enabled });
  }
  return undefined;
}
function WorkflowModal(props: { phase: GitActionPhase; owner: LocalConversationGitActionsProps; onClose(): void }): unknown {
  const r = getJsx();
  const state = getReact();
  const [branch, setBranch] = state.useState("");
  const [pending, setPending] = state.useState(false);
  const target = { ...props.owner.target, cwd: props.owner.target.cwd ?? "", hostConfig: resolveHostConfig(props.owner.target) };
  if (props.phase === "commit" || props.phase === "push") {
    const CommitModal = branches.p as undefined | ((input: UnknownRecord) => unknown);
    return CommitModal == null ? null : r.jsx(CommitModal, {
      codexWorktree: props.owner.codexWorktree, conversationId: props.owner.conversationId ?? null,
      enablePushActions: true, open: true, operationSource: "local_conversation_git_actions", target,
      onOpenChange: (open: boolean) => { if (!open) props.onClose(); }, onRequestReset: props.onClose,
    });
  }
  if (props.phase === "create-pr" || props.phase === "create-draft-pr") {
    const PullRequestModal = pullRequest.t as undefined | ((input: UnknownRecord) => unknown);
    if (PullRequestModal != null) return r.jsx(PullRequestModal, {
      defaultToDraft: props.phase === "create-draft-pr", conversationId: props.owner.conversationId ?? null,
      open: true, target, onOpenChange: (open: boolean) => { if (!open) props.onClose(); }, onRequestReset: props.onClose,
    });
  }
  const submitBranch = async () => {
    const value = branch.trim();
    if (pending || !value || value.endsWith("/")) return;
    setPending(true);
    try {
      const dispatch = props.owner.target.dispatchGitAction as undefined | ((input: UnknownRecord) => Promise<unknown>);
      if (dispatch != null) await dispatch({ kind: "create-branch", branch: value, cwd: target.cwd, hostId: target.hostId });
      props.onClose();
    } finally { setPending(false); }
  };
  return r.jsxs("dialog", { open: true, children: [
    r.jsx("h2", { children: "Create branch" }),
    r.jsxs("label", { children: ["Branch name", r.jsx("input", { value: branch, placeholder: "codex/feature",
      onChange: (event: { target: { value: string } }) => setBranch(event.target.value) })] }),
    branch.endsWith("/") ? r.jsx("p", { role: "alert", children: "Branch name cannot end with “/”" }) : null,
    r.jsxs("footer", { children: [
      r.jsx("button", { type: "button", disabled: pending, onClick: props.onClose, children: "Cancel" }),
      r.jsx("button", { type: "button", disabled: pending || !branch.trim() || branch.endsWith("/"), onClick: submitBranch, children: "Create branch" }),
    ] }),
  ] });
}

function LocalConversationGitActions(props: LocalConversationGitActionsProps): unknown {
  const r = getJsx();
  const state = getReact();
  const [phase, setPhase] = state.useState<GitActionPhase | null>(null);
  const available = props.deferQueries !== true;
  const open = (next: GitActionPhase) => { setPhase(next); props.onMenuOpenChange?.(true); };
  const close = () => { setPhase(null); props.onMenuOpenChange?.(false); };
  const openCreatePullRequest = () => open("create-pr");

  state.useEffect(() => {
    props.onCreatePullRequestActionReady?.(openCreatePullRequest);
  }, [props.onCreatePullRequestActionReady]);
  state.useEffect(() => {
    if (props.registerCommands === false) return;
    const disposers = [
      registerCommand("git.commit", () => open("commit"), available),
      registerCommand("git.createPullRequest", openCreatePullRequest, available),
      registerCommand("git.createDraftPullRequest", () => open("create-draft-pr"), available),
      registerCommand("git.createBranch", () => open("create-branch"), available && props.codexWorktree === true),
    ].filter((dispose): dispose is () => void => typeof dispose === "function");
    return () => { for (const dispose of disposers) dispose(); };
  }, [available, props.codexWorktree, props.registerCommands]);

  const actionPhases: GitActionPhase[] = ["commit", "create-branch", "create-pr", "create-draft-pr", "push"];
  const menu = r.jsx("div", { role: "menu", "aria-label": "Git actions", children: actionPhases.map((item) => r.jsx("button", {
    type: "button", role: "menuitem", disabled: !available || (item === "create-branch" && props.codexWorktree !== true),
    onClick: () => open(item), children: phaseLabel(item),
  }, item)) });
  const renderedMenu = props.surface === "summary-panel" ? (props.renderActions?.(menu) ?? menu) : null;
  return r.jsxs("section", {
    "data-conversation-id": props.conversationId ?? null, "data-host-id": props.target.hostId, "data-surface": props.surface,
    children: [renderedMenu, phase == null ? null : r.jsx(WorkflowModal, { phase, owner: props, onClose: close })],
  });
}

function initializeStatus(): void { getJsx(); }
function initialize(): void {
  getJsx(); getReact();
  for (const owner of [branches, pullRequest, primary]) {
    const initializer = owner.n;
    if (typeof initializer === "function") (initializer as () => void)();
  }
}

export { initializeStatus as i, initialize as n, GitActionStatus as r, LocalConversationGitActions as t };

void shared;
