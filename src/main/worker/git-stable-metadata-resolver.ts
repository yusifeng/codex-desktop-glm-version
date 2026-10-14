type GitStableMetadataResolverOptions = {
  cacheRoot: (
    cwd: string,
    host: any,
    root: string | null,
    generation: number,
  ) => void;
  getActiveTrace: () => any;
  getKey: (cwd: string, host: any) => string;
  isResolutionError: (error: unknown) => boolean;
  resolveCommonDir: (root: string, host: any) => Promise<string | null>;
  resolveRoot: (
    cwd: string,
    host: any,
    generation: number,
  ) => Promise<string | null>;
  resolveRootAndCommonDir: (
    cwd: string,
    host: any,
  ) => Promise<{ root: string; commonDir: string } | null>;
  trace: <T>(span: any, operation: () => Promise<T>) => Promise<T>;
};

class GitStableMetadataResolver {
  private readonly options: GitStableMetadataResolverOptions;
  private readonly pendingTraceByKey = new Map<string, any>();

  constructor(options: GitStableMetadataResolverOptions) {
    this.options = options;
  }

  get pendingTraceCount() {
    return this.pendingTraceByKey.size;
  }

  getPendingTrace(cwd: string, host: any) {
    return this.pendingTraceByKey.get(this.options.getKey(cwd, host)) ?? null;
  }

  clearPendingTraces() {
    this.pendingTraceByKey.clear();
  }

  async resolve(cwd: string, host: any, generation: number) {
    const key = this.options.getKey(cwd, host);
    const activeTrace = this.options.getActiveTrace();
    if (activeTrace != null) this.pendingTraceByKey.set(key, activeTrace);
    try {
      try {
        const metadata = await this.options.trace(
          this.metadataSpan(host),
          () => this.options.resolveRootAndCommonDir(cwd, host),
        );
        this.options.cacheRoot(cwd, host, metadata?.root ?? null, generation);
        return metadata;
      } catch (error) {
        if (!this.options.isResolutionError(error)) throw error;
      }

      const root = await this.options.trace(
        this.metadataSpan(host),
        () => this.options.resolveRoot(cwd, host, generation),
      );
      if (!root) return null;
      const commonDir = await this.options.trace(
        {
          attributes: { "git.host_kind": host.isLocal ? `local` : `remote` },
          name: `git.metadata_common_dir`,
          op: `codex.git.metadata_common_dir`,
        },
        () => this.options.resolveCommonDir(root, host),
      );
      return commonDir ? { root, commonDir } : null;
    } finally {
      if (this.pendingTraceByKey.get(key) === activeTrace)
        this.pendingTraceByKey.delete(key);
    }
  }

  private metadataSpan(host: any) {
    return {
      attributes: { "git.host_kind": host.isLocal ? `local` : `remote` },
      name: `git.metadata_root`,
      op: `codex.git.metadata_root`,
    };
  }
}

export { GitStableMetadataResolver };
if (typeof module !== `undefined`)
  module.exports = { GitStableMetadataResolver };
