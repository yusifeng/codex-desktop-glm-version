type GitRepoChangeEmissionDependencies = {
  changeType: string;
  consumeRawEventCount: (changeType: string) => number;
  getPendingWorkingTreePaths: () => Set<string> | null;
  resetPendingWorkingTreePaths: () => void;
  getOperationState: () => Promise<any>;
  isDisposed: () => boolean;
  createEvent: (input: {
    changeType: string;
    commonDir: string;
    hostId: string;
    rebaseInProgress: boolean | null;
    root: string;
    changedPaths: string[] | null;
  }) => any;
  commonDir: string;
  hostId: string;
  root: string;
  onCoalescedChange?: (input: { changeType: string; rawEventCount: number }) => void;
  emit: (event: any) => Promise<void>;
  isHeadRefKnown: () => boolean;
  getCurrentBranchState: () => Promise<any>;
  resolveHeadRefPath: (branch: string) => string | null;
  setHeadRefState: (path: string | null, known: boolean) => void;
  logRepoChanged: (changeType: string, rawEventCount: number, operationState: any) => void;
  complete: (changeType: string) => void;
};

/** Emits one coalesced repository change and always completes its debounce lifecycle. */
async function emitGitRepoChange(input: GitRepoChangeEmissionDependencies): Promise<void> {
  const rawEventCount = input.consumeRawEventCount(input.changeType);
  const pendingPaths = input.getPendingWorkingTreePaths();
  const changedPaths = input.changeType === `working-tree` && pendingPaths != null
    ? [...pendingPaths]
    : null;
  if (input.changeType === `working-tree`) input.resetPendingWorkingTreePaths();

  try {
    const operationState = await input.getOperationState();
    if (input.isDisposed()) return;
    const event = input.createEvent({
      changeType: input.changeType,
      commonDir: input.commonDir,
      hostId: input.hostId,
      rebaseInProgress: operationState.rebaseInProgress,
      root: input.root,
      changedPaths,
    });
    input.onCoalescedChange?.({ changeType: input.changeType, rawEventCount });
    await input.emit({ type: `worker-event`, event });

    if (input.changeType === `head` && !input.isHeadRefKnown()) {
      const branchState = await input.getCurrentBranchState();
      input.setHeadRefState(
        branchState.type === `branch` ? input.resolveHeadRefPath(branchState.branch) : null,
        branchState.type !== `unknown`,
      );
    }
    input.logRepoChanged(input.changeType, rawEventCount, operationState);
  } finally {
    input.complete(input.changeType);
  }
}

export { emitGitRepoChange };
if (typeof module !== `undefined`) module.exports = { emitGitRepoChange };
