import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface WorkspaceTarget { hostId?: string | null; workspaceRoot?: string | null }
export interface TerminalWarningInput { binding?: WorkspaceTarget | null; currentTarget: WorkspaceTarget; currentWorkspaceRoots: readonly string[]; dismissedTarget?: WorkspaceTarget | null }
export interface TerminalWarningState { dismissedTarget: WorkspaceTarget | null; dismiss(target: WorkspaceTarget): void; reset(): void }
function normalizePath(path: string): string { return path.replaceAll("\\", "/").replace(/\/+$/, "").toLocaleLowerCase(); }
function targetsMatch(left: WorkspaceTarget | null | undefined, right: WorkspaceTarget): boolean {
  if (left == null || (left.hostId != null && right.hostId != null && left.hostId !== right.hostId)) return false;
  if (left.workspaceRoot == null || right.workspaceRoot == null) return left.workspaceRoot === right.workspaceRoot;
  return normalizePath(left.workspaceRoot) === normalizePath(right.workspaceRoot);
}
function shouldShowTerminalWorkspaceWarning({ binding, currentTarget, currentWorkspaceRoots, dismissedTarget }: TerminalWarningInput): boolean {
  return binding != null && !targetsMatch(binding, currentTarget) && !currentWorkspaceRoots.some(workspaceRoot => targetsMatch(binding, { hostId: currentTarget.hostId, workspaceRoot })) && !targetsMatch(dismissedTarget, currentTarget);
}
const terminalWorkspaceWarningState: TerminalWarningState = { dismissedTarget: null, dismiss(target) { this.dismissedTarget = { ...target }; }, reset() { this.dismissedTarget = null; } };
function initializeTerminalWorkspaceWarningState(): void {}
export { shouldShowTerminalWorkspaceWarning as n, terminalWorkspaceWarningState as r, initializeTerminalWorkspaceWarningState as t };
