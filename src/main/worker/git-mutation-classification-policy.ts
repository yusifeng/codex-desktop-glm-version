const OPERATION_SOURCES = new Set([`async_task_starting_state_dropdown`,`commit_modal`,`composer_branch_switcher`,`composer_worktree_source`,`create_pull_request_modal`,`local_conversation_git_actions`]);
const MUTATING_REQUEST_KINDS = new Set([`checkout-branch`,`create-branch`,`git-checkout-branch`,`git-create-branch`,`git-init-repo`]);
function isGitMutationRequest({ requestKind, source }: { requestKind?: string | null; source?: string | null }): boolean {
  return MUTATING_REQUEST_KINDS.has(requestKind ?? ``) || OPERATION_SOURCES.has(source ?? ``);
}
export { isGitMutationRequest };
if (typeof module !== `undefined`) module.exports = { isGitMutationRequest };
