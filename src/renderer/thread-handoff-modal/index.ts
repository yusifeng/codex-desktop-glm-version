// Thread handoff between a repository checkout and a managed Codex worktree.
import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import "@rchunk/use-codex-worktrees";
import "@rchunk/git-branch-switcher";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type Direction = "to-local" | "to-worktree";
type UnknownRecord = Record<string, unknown>;
interface WorkspaceRoot { gitRoot?: string | null; hostId?: string; label?: string; root: string; workspaceRoot?: string }
interface HandoffOperation {
  conversationTitle?: string; cwd?: string; direction?: Direction; error?: string | null; isPending?: boolean;
  perform?(input: UnknownRecord): Promise<unknown>; sourceHostId?: string; targetHostId?: string;
}
interface ThreadHandoffModalProps {
  conversationId: string; composerViewState?: unknown; executionTarget?: UnknownRecord;
  getActiveWorkspaceRoots?(): WorkspaceRoot[] | Promise<WorkspaceRoot[]>; gitRoot?: string;
  isLocalModeRemote?: boolean; onClose(): void; showCrossHostHandoff?: boolean; threadHandoff: HandoffOperation;
}

const shared = sharedChunk as unknown as UnknownRecord;
const initial = initialChunk as unknown as UnknownRecord;
const primary = primaryChunk as unknown as UnknownRecord;
let jsx: JsxRuntime;
let React: ReactRuntime;

function getJsx(): JsxRuntime {
  if (jsx == null) jsx = (sharedChunk.I3 as () => JsxRuntime)();
  return jsx;
}
function getReact(): ReactRuntime {
  if (React == null) {
    const candidate = sharedChunk.e6 as unknown;
    React = (typeof candidate === "function" && !(candidate as { useState?: unknown }).useState
      ? (candidate as () => ReactRuntime)()
      : candidate) as ReactRuntime;
  }
  return React;
}
function normalizePath(value: string | null | undefined): string {
  return (value ?? "").replaceAll("\\", "/").replace(/\/$/, "");
}
function defaultBranchName(title: string | undefined): string {
  const slug = (title ?? "thread").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "thread";
  return `codex/${slug}`;
}
function branchError(branch: string): string | null {
  if (branch.length === 0) return "Enter a branch name";
  if (branch.endsWith("/")) return "Branch name cannot end with “/”";
  if (/\s/.test(branch)) return "Branch name cannot contain spaces";
  if (branch.startsWith("-") || branch.includes("..") || branch.includes("//")) return "Enter a valid branch name";
  return null;
}
function resolveDirection(props: ThreadHandoffModalProps): Direction {
  if (props.threadHandoff.direction != null) return props.threadHandoff.direction;
  const resolver = primary.Xe as undefined | ((input: UnknownRecord) => Direction);
  if (resolver != null) {
    const resolved = resolver({ codexWorktree: props.isLocalModeRemote !== true, operation: props.executionTarget, threadHandoff: props.threadHandoff });
    if (resolved === "to-local" || resolved === "to-worktree") return resolved;
  }
  return props.isLocalModeRemote === true ? "to-local" : "to-worktree";
}
async function executeHandoff(props: ThreadHandoffModalProps, input: UnknownRecord): Promise<unknown> {
  if (props.threadHandoff.perform != null) return props.threadHandoff.perform(input);
  const executionTarget = props.executionTarget as { performThreadHandoff?(value: UnknownRecord): Promise<unknown>; handoffThread?(value: UnknownRecord): Promise<unknown> } | undefined;
  if (executionTarget?.performThreadHandoff != null) return executionTarget.performThreadHandoff(input);
  if (executionTarget?.handoffThread != null) return executionTarget.handoffThread(input);
  for (const name of ["performThreadHandoff", "handoffThread", "Ce", "Qln"]) {
    const fn = initial[name];
    if (typeof fn === "function") return (fn as (...values: unknown[]) => Promise<unknown>)(input);
  }
  throw new Error("Thread handoff runtime is unavailable");
}

function ThreadHandoffModal(props: ThreadHandoffModalProps): unknown {
  const r = getJsx();
  const state = getReact();
  const direction = resolveDirection(props);
  const [branch, setBranch] = state.useState(defaultBranchName(props.threadHandoff.conversationTitle));
  const [pending, setPending] = state.useState(props.threadHandoff.isPending === true);
  const [error, setError] = state.useState<string | null>(props.threadHandoff.error ?? null);
  const [workspaceRoot, setWorkspaceRoot] = state.useState(props.gitRoot ?? props.threadHandoff.cwd ?? "");
  const [targetHostId, setTargetHostId] = state.useState(props.threadHandoff.targetHostId ?? "");
  const [workspaceRoots, setWorkspaceRoots] = state.useState<WorkspaceRoot[]>([]);
  const [rootsLoading, setRootsLoading] = state.useState(false);
  const trimmedBranch = branch.trim();
  const validation = branchError(trimmedBranch);

  const loadRoots = async () => {
    if (props.getActiveWorkspaceRoots == null || rootsLoading) return;
    setRootsLoading(true);
    try {
      const roots = await props.getActiveWorkspaceRoots();
      setWorkspaceRoots(Array.isArray(roots) ? roots : []);
      if (!workspaceRoot && roots[0] != null) setWorkspaceRoot(roots[0].workspaceRoot ?? roots[0].root);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load local workspaces");
    } finally { setRootsLoading(false); }
  };

  const submit = async () => {
    if (pending || validation != null) return;
    if (direction === "to-local" && workspaceRoot.trim().length === 0) {
      setError("Select a local workspace"); return;
    }
    setPending(true); setError(null);
    try {
      await executeHandoff(props, {
        conversationId: props.conversationId,
        branch: trimmedBranch,
        composerViewState: props.composerViewState,
        cwd: props.threadHandoff.cwd,
        direction,
        gitRoot: props.gitRoot,
        sourceHostId: props.threadHandoff.sourceHostId,
        targetHostId: targetHostId || props.threadHandoff.targetHostId,
        workspaceRoot: direction === "to-local" ? normalizePath(workspaceRoot) : undefined,
      });
      props.onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to move thread");
    } finally { setPending(false); }
  };

  const title = direction === "to-local" ? "Move thread to local checkout" : "Move thread to worktree";
  const description = direction === "to-local"
    ? "Continue this thread from a local repository checkout. The selected branch must not be checked out in another worktree."
    : "Move this thread and its Git state into an isolated Codex worktree.";
  return r.jsxs("dialog", { open: true, "data-handoff-direction": direction, children: [
    r.jsx("h2", { children: title }),
    r.jsx("p", { children: props.threadHandoff.conversationTitle ?? props.conversationId }),
    r.jsx("p", { children: description }),
    direction === "to-local" ? r.jsxs("label", { children: ["Local workspace", r.jsxs("select", {
      value: workspaceRoot, onFocus: loadRoots, onChange: (event: { currentTarget: { value: string } }) => setWorkspaceRoot(event.currentTarget.value),
      children: [
        r.jsx("option", { value: workspaceRoot, children: workspaceRoot || (rootsLoading ? "Checking workspaces…" : "Select workspace") }),
        ...workspaceRoots.filter((root) => (root.workspaceRoot ?? root.root) !== workspaceRoot).map((root) => r.jsx("option", {
          value: root.workspaceRoot ?? root.root, children: root.label ?? root.workspaceRoot ?? root.root,
        }, root.root)),
      ],
    })] }) : null,
    r.jsxs("label", { children: ["Branch", r.jsx("input", { value: branch, placeholder: "codex/feature",
      onChange: (event: { currentTarget: { value: string } }) => setBranch(event.currentTarget.value) })] }),
    validation == null ? null : r.jsx("p", { role: "alert", children: validation }),
    props.showCrossHostHandoff === true ? r.jsxs("label", { children: ["Destination host", r.jsx("input", {
      value: targetHostId, placeholder: "Current host", onChange: (event: { currentTarget: { value: string } }) => setTargetHostId(event.currentTarget.value),
    })] }) : null,
    error == null ? null : r.jsx("p", { role: "alert", children: error }),
    r.jsxs("footer", { children: [
      r.jsx("button", { type: "button", disabled: pending, onClick: props.onClose, children: "Cancel" }),
      r.jsx("button", { type: "button", disabled: pending || validation != null, onClick: submit,
        children: pending ? "Moving thread…" : "Move thread" }),
    ] }),
  ] });
}

function initializeThreadHandoffModal(): void {
  getJsx(); getReact();
  const initializeApiClient = initial.cJt;
  if (typeof initializeApiClient === "function") (initializeApiClient as () => void)();
}

export { initializeThreadHandoffModal as n, ThreadHandoffModal as t };

void shared;
