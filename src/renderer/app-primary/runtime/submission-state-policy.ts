export interface SubmissionState {
  status?: string;
}

/** Collapse a successful submission state while preserving pending and failed states. */
export function getNonSuccessSubmissionState<T extends SubmissionState | null | undefined>(
  state: T,
): T | null {
  return state?.status === "success" ? null : state;
}

/** Toggle the composer between local and worktree execution. */
export function toggleComposerWorktreeMode({
  composerMode,
  setComposerMode,
}: {
  composerMode: string;
  setComposerMode: (mode: "local" | "worktree") => void;
}): void {
  setComposerMode(composerMode === "worktree" ? "local" : "worktree");
}

interface HostWorktreeOperation {
  direction?: string;
  request: {
    destinationHostId?: string | null;
    destinationWorkspaceRoot?: string | null;
  };
}

/** Match the in-flight host-worktree operation for a destination picker row. */
export function matchesDestinationHostWorktreeOperation({
  destinationHostId,
  destinationWorkspaceRoot,
  operation,
}: {
  destinationHostId?: string | null;
  destinationWorkspaceRoot?: string | null;
  operation?: HostWorktreeOperation | null;
}): boolean {
  return (
    operation?.direction === "to-host-worktree" &&
    operation.request.destinationHostId === destinationHostId &&
    operation.request.destinationWorkspaceRoot === destinationWorkspaceRoot
  );
}

