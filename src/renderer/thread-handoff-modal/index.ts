import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import "@rchunk/use-codex-worktrees";
import "@rchunk/git-branch-switcher";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface ThreadHandoffModalProps { conversationId: string; composerViewState?: unknown; executionTarget?: Record<string, unknown>; getActiveWorkspaceRoots?(): unknown; gitRoot?: string; isLocalModeRemote?: boolean; onClose(): void; showCrossHostHandoff?: boolean; threadHandoff: { conversationTitle?: string; cwd?: string; direction?: "to-local" | "to-worktree"; perform?(input: Record<string, unknown>): Promise<unknown> } }
const jsx = getJsxRuntime();
const React = getReactRuntime();
function ThreadHandoffModal({ conversationId, onClose, threadHandoff, gitRoot, isLocalModeRemote = false }: ThreadHandoffModalProps): unknown {
  const [branch, setBranch] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const direction = threadHandoff.direction ?? (isLocalModeRemote ? "to-local" : "to-worktree");
  const submit = async () => {
    if (pending) return;
    setPending(true);
    try { await threadHandoff.perform?.({ conversationId, branch: branch.trim() || undefined, cwd: threadHandoff.cwd, gitRoot, direction }); onClose(); } finally { setPending(false); }
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: direction === "to-local" ? "Move thread to local checkout" : "Move thread to worktree" }), jsx.jsx("p", { children: threadHandoff.conversationTitle ?? conversationId }), jsx.jsxs("label", { children: ["Branch", jsx.jsx("input", { value: branch, placeholder: "Use current branch", onChange: (event: { currentTarget: { value: string } }) => setBranch(event.currentTarget.value) })] }), jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Cancel" }), jsx.jsx("button", { type: "button", disabled: pending, onClick: submit, children: "Move thread" })] })] });
}
function initializeThreadHandoffModal(): void { initializeApiClient(); }
export { initializeThreadHandoffModal as n, ThreadHandoffModal as t };
