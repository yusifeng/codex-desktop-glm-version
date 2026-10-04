type GitLiveQuerySubscriptionSetupDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  getExistingWatch: (root: string) => any;
  ensureWatching: (metadata: { commonDir: string; root: string }, host: any, signal?: AbortSignal) => Promise<() => void>;
  resolveQueryRoot: (query: any) => string;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
};

async function prepareGitLiveQuerySubscription(
  params: { query: any; trace?: any },
  deps: GitLiveQuerySubscriptionSetupDependencies,
) {
  return deps.trace(
    {
      attributes: { "git.operation": params.query.method, "worker.id": `git`, "worker.method": `subscribe-live-query` },
      name: `git.subscription_setup`,
      op: `codex.git.subscription_setup`,
      trace: params.trace,
    },
    async () => {
      const root = deps.resolveQueryRoot(params.query);
      const pendingMetadataTrace = deps.gitManager.getPendingStableMetadataTrace(root, deps.host);
      const metadata = await deps.trace(
        {
          attributes: {
            "git.metadata_coalesced": pendingMetadataTrace != null,
            "git.operation": params.query.method,
            "worker.id": `git`,
            "worker.method": `subscribe-live-query`,
          },
          links: pendingMetadataTrace == null ? [] : [pendingMetadataTrace],
          name: `git.metadata_lookup`, op: `codex.git.metadata_lookup`,
        },
        () => deps.gitManager.getStableMetadata(root, deps.host),
      ) as { commonDir: string; root: string } | null;
      if (deps.signal.aborted) return null;
      if (metadata == null) throw new Error(`Live Git query requires repository metadata`);
      const existingWatch = deps.getExistingWatch(metadata.root);
      return {
        metadata,
        releaseWatch: await deps.trace(
          {
            attributes: {
              "git.operation": params.query.method,
              "git.watcher_reused": existingWatch != null,
              "worker.id": `git`, "worker.method": `subscribe-live-query`,
            },
            links: existingWatch?.startTrace == null ? [] : [existingWatch.startTrace],
            name: `git.watcher_start`, op: `codex.git.watcher_start`,
          },
          () => deps.ensureWatching(metadata, deps.host, deps.signal),
        ),
      };
    },
  );
}

export { prepareGitLiveQuerySubscription };
if (typeof module !== `undefined`) module.exports = { prepareGitLiveQuerySubscription };
