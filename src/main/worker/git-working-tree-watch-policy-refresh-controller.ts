type GitWorkingTreeWatchPolicyRefreshDependencies = {
  getPolicy: () => any;
  getTarget: () => any;
  awaitSessionStart: (target: any) => Promise<unknown>;
  isDisposed: () => boolean;
  hasRetryTimer: (target: any) => boolean;
  readPolicy: (policy: any) => Promise<any>;
  isCurrent: (policy: any, snapshot: any) => boolean;
  getAction: (input: { disposed: boolean; retryScheduled: boolean; policyCurrent: boolean; sessionActive: boolean; nextDirectories: string[]; previousDirectories: string[] }) => string;
  applyPolicy: (policy: any, snapshot: any) => boolean;
  onApplied: () => void;
  disposeSession: (target: any) => Promise<unknown>;
  startSession: (target: any, recovering: boolean) => Promise<unknown>;
  getPreviousDirectories: () => string[];
  setPreviousDirectories: (directories: string[]) => void;
  hasSession: (target: any) => boolean;
};

/** Coordinates ignore-policy refresh, freshness gates, apply/skip and watcher restart recovery. */
async function refreshGitWorkingTreeWatchPolicy(dependencies: GitWorkingTreeWatchPolicyRefreshDependencies) {
  const policy = dependencies.getPolicy();
  const target = dependencies.getTarget();
  if (policy == null || target == null) return;
  await dependencies.awaitSessionStart(target);
  if (dependencies.isDisposed() || dependencies.hasRetryTimer(target)) return;
  const snapshot = await dependencies.readPolicy(policy);
  await dependencies.awaitSessionStart(target);
  if (dependencies.isDisposed() || !dependencies.isCurrent(policy, snapshot) || dependencies.hasRetryTimer(target)) return;
  const action = dependencies.getAction({
    disposed: dependencies.isDisposed(),
    retryScheduled: dependencies.hasRetryTimer(target),
    policyCurrent: dependencies.isCurrent(policy, snapshot),
    sessionActive: dependencies.hasSession(target),
    nextDirectories: snapshot.directories,
    previousDirectories: dependencies.getPreviousDirectories(),
  });
  if (action === `apply`) {
    if (dependencies.applyPolicy(policy, snapshot)) dependencies.onApplied();
    return;
  }
  if (action === `skip`) return;
  await dependencies.disposeSession(target);
  if (!dependencies.isDisposed()) await dependencies.startSession(target, true);
}

export { refreshGitWorkingTreeWatchPolicy };
if (typeof module !== `undefined`) module.exports = { refreshGitWorkingTreeWatchPolicy };
