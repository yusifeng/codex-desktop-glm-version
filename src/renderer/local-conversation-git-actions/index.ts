import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/git-action-new-branch-field";
import "@rchunk/git-branch-switcher";
import "@rchunk/create-pull-request-modal-content";

export type GitActionPhase = "commit" | "create-branch" | "create-pr" | "create-draft-pr" | "push" | "worktree-branch-setup";
export interface LocalConversationGitActionsProps { conversationId?: string | null; codexWorktree?: boolean; deferQueries?: boolean; onCreatePullRequestActionReady?(action: () => void): void; onMenuOpenChange?(open: boolean): void; registerCommands?: boolean; renderActions?(actions: unknown): unknown; surface?: string; target: { hostId: string; cwd?: string; [key: string]: unknown } }
let jsx: JsxRuntime;
function GitActionStatus({ phase }: { phase: GitActionPhase }): unknown { return ensureJsx().jsx("span", { role: "status", children: phaseLabel(phase) }); }
function LocalConversationGitActions(props: LocalConversationGitActionsProps): unknown { const runtime = ensureJsx(); const actions = runtime.jsxs("div", { role: "menu", children: ["commit", "create-branch", "create-pr", "push"].map((phase) => runtime.jsx("button", { type: "button", role: "menuitem", onClick: () => props.onMenuOpenChange?.(false), children: phaseLabel(phase as GitActionPhase) }, phase)) }); props.onCreatePullRequestActionReady?.(() => props.onMenuOpenChange?.(true)); return runtime.jsx("section", { "data-conversation-id": props.conversationId, "data-host-id": props.target.hostId, "data-surface": props.surface, children: props.renderActions?.(actions) ?? actions }); }
const phaseLabel = (phase: GitActionPhase): string => ({ commit: "Commit changes", "create-branch": "Create branch", "create-pr": "Create pull request", "create-draft-pr": "Create draft pull request", push: "Push changes", "worktree-branch-setup": "Set up worktree branch" })[phase];
const initializeStatus = (): void => { jsx = getJsxRuntime(); };
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { initializeStatus as i, initialize as n, GitActionStatus as r, LocalConversationGitActions as t };
