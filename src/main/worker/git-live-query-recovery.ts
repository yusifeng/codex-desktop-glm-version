type LiveQueryRecoveryDependencies = {
  gitManager: { getStableMetadata: (cwd: unknown, host: any) => Promise<any> };
  host: any;
  liveQueryRegistry: { recover: (options: { hostId: string; root?: string; subscriptionIds: string[] }) => Promise<unknown> };
};

/** Recover live-query subscriptions after a worker reconnect or repository refresh. */
async function recoverGitLiveQueries(
  params: { cwd?: string | null; subscriptionIds: string[] },
  deps: LiveQueryRecoveryDependencies,
) {
  const metadata = params.cwd == null
    ? null
    : await deps.gitManager.getStableMetadata(params.cwd, deps.host);
  if (params.cwd == null || metadata != null) {
    await deps.liveQueryRegistry.recover({
      hostId: deps.host.id,
      root: metadata?.root,
      subscriptionIds: params.subscriptionIds,
    });
  }
}

export { recoverGitLiveQueries };
if (typeof module !== `undefined`) module.exports = { recoverGitLiveQueries };
