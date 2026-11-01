import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  IK as pathsEqual,
  RI as initializePathRuntime,
  oZ as createSignalFamily,
} from "@rchunk/app-shared";
import {
  Ftn as initializeThreadState,
  wtn as terminalBindingFamily,
} from "@rchunk/app-initial";

export interface WorkspaceTarget {
  hostId?: string | null;
  workspaceRoot?: string | null;
}

export interface TerminalWarningInput {
  binding?: WorkspaceTarget | null;
  currentTarget: WorkspaceTarget;
  currentWorkspaceRoots: readonly string[];
  dismissedTarget?: WorkspaceTarget | null;
}

let terminalWorkspaceWarningState: unknown;

function targetsMatch(
  left: WorkspaceTarget | null | undefined,
  right: WorkspaceTarget,
): boolean {
  if (
    left == null ||
    (left.hostId != null &&
      right.hostId != null &&
      left.hostId !== right.hostId)
  ) {
    return false;
  }
  if (left.workspaceRoot == null || right.workspaceRoot == null) {
    return left.workspaceRoot === right.workspaceRoot;
  }
  return pathsEqual(left.workspaceRoot, right.workspaceRoot);
}

function shouldShowTerminalWorkspaceWarning({
  binding,
  currentTarget,
  currentWorkspaceRoots,
  dismissedTarget,
}: TerminalWarningInput): boolean {
  return (
    binding != null &&
    !targetsMatch(binding, currentTarget) &&
    !currentWorkspaceRoots.some((workspaceRoot) =>
      targetsMatch(binding, { hostId: currentTarget.hostId, workspaceRoot }),
    ) &&
    !targetsMatch(dismissedTarget, currentTarget)
  );
}

function initializeTerminalWorkspaceWarningState(): void {
  initializeSignalRuntime();
  initializeThreadState();
  initializePathRuntime();
  const createFamily = createSignalFamily as unknown as (
    source: unknown,
    initialValue: (parameter: unknown) => null,
  ) => unknown;
  terminalWorkspaceWarningState = createFamily(
    terminalBindingFamily,
    () => null,
  );
}

export {
  shouldShowTerminalWorkspaceWarning as n,
  terminalWorkspaceWarningState as r,
  initializeTerminalWorkspaceWarningState as t,
};
