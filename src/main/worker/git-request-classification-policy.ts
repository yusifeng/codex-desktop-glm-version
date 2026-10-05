const UNCANCELABLE_REQUESTS = new Set([`availability`,`managed-worktree-state`,`github-request`,`origin-url`,`origin-and-roots`,`worktree-shell-environment`,`worktree-owner`,`default-remote-branch`,`automation-writable-roots`,`merge-base`,`read-git-file-binary`,`prepare-worktree-snapshot`,`push`,`checkout-branch`]);
const UNTRACKED_REQUESTS = new Set([`delete-worktree`,`dispose-git-init-watch`,`invalidate-stable-metadata`,`invalidate-git-read-caches`,`git-init-repo`,`cleanup-host-handoff-transfer`,`cancel-worktree-upstream-refresh`,`watch-repo`,`unwatch-repo`]);
function isCancelableGitRequest(method: string): boolean { return !UNCANCELABLE_REQUESTS.has(method); }
function isGitRequestTracked(method: string): boolean { return !UNTRACKED_REQUESTS.has(method); }
export { isCancelableGitRequest, isGitRequestTracked };
if (typeof module !== `undefined`) module.exports = { isCancelableGitRequest, isGitRequestTracked };
