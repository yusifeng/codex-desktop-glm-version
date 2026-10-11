type GitInitMetadataRefreshDependencies = {
  key: string;
  refreshes: Map<string, Promise<boolean>>;
  invalidateStableMetadata: () => void;
  refreshOnce: () => Promise<boolean>;
};

/** Owns single-flight Git-init metadata refresh and promise cleanup. */
async function refreshGitInitMetadata(dependencies: GitInitMetadataRefreshDependencies): Promise<boolean> {
  const { key, refreshes, invalidateStableMetadata, refreshOnce } = dependencies;
  const existing = refreshes.get(key);
  if (existing != null) return existing;
  invalidateStableMetadata();
  const promise = refreshOnce();
  refreshes.set(key, promise);
  try {
    return await promise;
  } finally {
    if (refreshes.get(key) === promise) refreshes.delete(key);
  }
}

export { refreshGitInitMetadata };
if (typeof module !== `undefined`) module.exports = { refreshGitInitMetadata };
