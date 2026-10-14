type GitRepositoryRegistryOptions = {
  createKey: (hostKey: string, root: string) => string;
  createRepository: (root: string, host: any) => any;
  createWorktree: (root: string, host: any) => any;
  getHostKey: (host: any) => string;
  invalidateUntracked: (worktree: any) => void;
  isKeyForHost: (key: string, hostKey: string) => boolean;
  normalizeLocalRoot: (root: string) => string;
  pathsOverlap: (left: string, right: string, host: any) => boolean;
  selectWorktrees: (
    worktrees: any[],
    cwds: string[] | null | undefined,
    normalizedCwds: string[],
    overlaps: (worktree: any, cwd: string) => boolean,
  ) => any[];
};

class GitRepositoryRegistry {
  private readonly options: GitRepositoryRegistryOptions;
  private readonly repositoriesByKey = new Map<string, any>();
  private readonly worktreesByKey = new Map<string, any>();
  private readonly commonDirByWorktreeKey = new Map<string, string>();

  constructor(options: GitRepositoryRegistryOptions) {
    this.options = options;
  }

  get repositoriesCount() {
    return this.repositoriesByKey.size;
  }

  get worktreesCount() {
    return this.worktreesByKey.size;
  }

  getOrCreateRepository(root: string, host: any) {
    const key = this.getKey(root, host);
    const existing = this.repositoriesByKey.get(key);
    if (existing) return existing;
    const repository = this.options.createRepository(root, host);
    this.repositoriesByKey.set(key, repository);
    return repository;
  }

  getOrCreateWorktree(root: string, host: any) {
    const normalizedRoot = host.isLocal
      ? this.options.normalizeLocalRoot(root)
      : root;
    const key = this.getKey(normalizedRoot, host);
    const existing = this.worktreesByKey.get(key);
    if (existing) return existing;
    const worktree = this.options.createWorktree(normalizedRoot, host);
    this.worktreesByKey.set(key, worktree);
    return worktree;
  }

  getWorktrees() {
    return this.worktreesByKey.values();
  }

  getCommonDir(worktree: any) {
    return this.commonDirByWorktreeKey.get(
      this.getKey(worktree.root, worktree.host),
    );
  }

  rememberCommonDir(root: string, host: any, commonDir: string) {
    this.commonDirByWorktreeKey.set(this.getKey(root, host), commonDir);
  }

  clearCommonDirs() {
    this.commonDirByWorktreeKey.clear();
  }

  invalidateUntracked(host?: any) {
    const hostKey = host == null ? null : this.options.getHostKey(host);
    for (const [key, worktree] of this.worktreesByKey) {
      if (hostKey == null || this.options.isKeyForHost(key, hostKey))
        this.options.invalidateUntracked(worktree);
    }
  }

  async invalidateUntrackedForCwd(
    cwd: string,
    host: any,
    resolveRoot: (cwd: string, host: any) => Promise<string | null>,
  ) {
    try {
      const root = await resolveRoot(cwd, host);
      if (root != null) {
        const normalizedRoot = host.isLocal
          ? this.options.normalizeLocalRoot(root)
          : root;
        const hostKey = this.options.getHostKey(host);
        for (const [key, worktree] of this.worktreesByKey) {
          if (
            this.options.isKeyForHost(key, hostKey) &&
            this.options.pathsOverlap(worktree.root, normalizedRoot, worktree.host)
          ) {
            this.options.invalidateUntracked(worktree);
          }
        }
        return;
      }
    } catch {}
    this.invalidateUntracked(host);
  }

  invalidateShortLived(host?: any) {
    if (host == null) {
      for (const worktree of this.worktreesByKey.values())
        worktree.clearShortLivedGitReadCaches();
      return;
    }
    const hostKey = this.options.getHostKey(host);
    for (const [key, worktree] of this.worktreesByKey) {
      if (this.options.isKeyForHost(key, hostKey))
        worktree.clearShortLivedGitReadCaches();
    }
  }

  selectForCwds(cwds: string[] | null | undefined, hostId: string) {
    const worktrees = Array.from(this.worktreesByKey.values()).filter(
      (worktree) => worktree.host.id === hostId,
    );
    const normalizedCwds = worktrees[0]?.host.isLocal
      ? (cwds ?? []).map((cwd) => this.options.normalizeLocalRoot(cwd))
      : (cwds ?? []);
    return this.options.selectWorktrees(
      worktrees,
      cwds,
      normalizedCwds,
      (worktree, cwd) =>
        this.options.pathsOverlap(worktree.root, cwd, worktree.host) ||
        this.options.pathsOverlap(cwd, worktree.root, worktree.host),
    );
  }

  async invalidateMutation(
    root: string,
    host: any,
    resolveWorktree: (root: string, host: any) => Promise<any>,
  ) {
    const hostKey = this.options.getHostKey(host);
    let worktree = this.worktreesByKey.get(
      this.options.createKey(hostKey, root),
    );
    if (worktree == null) {
      try {
        worktree = (await resolveWorktree(root, host)) ?? undefined;
      } catch {}
    }
    if (worktree != null) {
      worktree.invalidateGitReadCachesForMutation();
      return;
    }
    for (const [key, candidate] of this.worktreesByKey) {
      if (this.options.isKeyForHost(key, hostKey))
        candidate.invalidateGitReadCachesForMutation();
    }
  }

  invalidateRepoChange(change: any, host?: any) {
    const hostKey = host == null ? null : this.options.getHostKey(host);
    for (const [key, worktree] of this.worktreesByKey) {
      if (hostKey == null || this.options.isKeyForHost(key, hostKey))
        worktree.invalidateGitReadCachesForRepoChange(change);
    }
  }

  private getKey(root: string, host: any) {
    return this.options.createKey(this.options.getHostKey(host), root);
  }
}

export { GitRepositoryRegistry };
if (typeof module !== `undefined`)
  module.exports = { GitRepositoryRegistry };
