type RepositoryModelDependencies = {
  clearShortLivedQueries: (queryClient: any, host?: any) => void;
  createQueryClient: () => any;
  getConfigValue: (repository: any, keys: string[], signal?: AbortSignal) => Promise<any>;
  getConfigValueForScope: (
    repository: any,
    key: string,
    scope: string,
    signal?: AbortSignal,
  ) => Promise<any>;
  invalidateQueriesForRepoChange: (
    queryClient: any,
    root: string,
    kind: string,
    paths?: string[],
  ) => void;
  invalidateWatchScopedQueries: (queryClient: any) => void;
  memoize: (fn: (...args: any[]) => any, options: any) => any;
  pathPosix: { dirname: (path: string) => string; join: (...parts: string[]) => string };
  pathsOverlap: (root: string, readPaths: string[], changedPaths?: string[]) => boolean;
  queryKey: (...parts: any[]) => any;
  readConfigValue: (
    root: string,
    keys: string[],
    host: any,
    signal?: AbortSignal,
  ) => Promise<any>;
  runDiff: (root: string, args: string[], host: any, options?: any) => Promise<any>;
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
  setConfigValueForScope: (
    root: string,
    key: string,
    value: string,
    scope: string,
    host: any,
    signal?: AbortSignal,
  ) => Promise<boolean>;
};

const ORIGIN_URL_CACHE_MS = 86_400_000;

class GitReviewSnapshotStaleError extends Error {
  constructor() {
    super(`Git snapshot became stale`);
    this.name = `GitReviewSnapshotStaleError`;
  }
}

function createGitRepositoryModels(dependencies: RepositoryModelDependencies) {
  class GitRepository {
    commonDir: string;
    host: any;

    constructor(commonDir: string, host: any) {
      this.commonDir = commonDir;
      this.host = host;
    }

    getCommonDir() {
      return this.commonDir;
    }

    getOriginUrl = dependencies.memoize(
      async (signal?: AbortSignal) =>
        dependencies.readConfigValue(
          this.commonDir,
          [`remote.origin.url`],
          this.host,
          signal,
        ),
      { length: 0, promise: true, maxAge: ORIGIN_URL_CACHE_MS },
    );
  }

  class GitReviewSnapshot {
    worktreeRepo: any;
    generation: number;
    abortController = new AbortController();
    signal = this.abortController.signal;

    constructor(worktreeRepo: any, generation: number) {
      this.worktreeRepo = worktreeRepo;
      this.generation = generation;
    }

    git(args: string[], options: any = {}) {
      return this.read(() =>
        dependencies.runGit(
          this.worktreeRepo.root,
          args,
          this.worktreeRepo.host,
          this.commandOptions(options),
        ),
      );
    }

    gitDiff(args: string[], options: any = {}) {
      return this.read(() =>
        dependencies.runDiff(
          this.worktreeRepo.root,
          args,
          this.worktreeRepo.host,
          this.commandOptions(options),
        ),
      );
    }

    queryKey(name: string, ...parts: any[]) {
      return dependencies.queryKey(
        this.worktreeRepo.root,
        this.worktreeRepo.host,
        name,
        `review`,
        `${this.generation}`,
        ...parts,
      );
    }

    async read<T>(operation: () => Promise<T>) {
      this.assertCurrent();
      try {
        const result = await operation();
        this.assertCurrent();
        return result;
      } catch (error) {
        throw this.worktreeRepo.reviewSnapshot === this
          ? error
          : new GitReviewSnapshotStaleError();
      }
    }

    retire() {
      this.abortController.abort();
    }

    assertCurrent() {
      if (this.signal.aborted || this.worktreeRepo.reviewSnapshot !== this)
        throw new GitReviewSnapshotStaleError();
    }

    commandOptions(options: any) {
      return {
        ...options,
        signal:
          options.signal == null
            ? this.signal
            : AbortSignal.any([this.signal, options.signal]),
      };
    }
  }

  class GitWorktreeRepository {
    root: string;
    host: any;
    queryClient = dependencies.createQueryClient();
    gitConfigReadGenerationValue = 0;
    gitHeadReadGenerationValue = 0;
    gitReadGenerationValue = 0;
    nextReviewWorkingTreeFileGeneration = 0;
    reviewWorkingTreeFileGenerations = new Map<string, number>();
    reviewSnapshotValue: InstanceType<typeof GitReviewSnapshot>;
    watchScopedGitReadGenerationValue = 0;

    constructor(root: string, host: any) {
      this.root = root;
      this.host = host;
      this.reviewSnapshotValue = new GitReviewSnapshot(this, 0);
    }

    get gitReadGeneration() {
      return this.gitReadGenerationValue;
    }

    get gitConfigReadGeneration() {
      return this.gitConfigReadGenerationValue;
    }

    get gitHeadReadGeneration() {
      return this.gitHeadReadGenerationValue;
    }

    get watchScopedGitReadGeneration() {
      return this.watchScopedGitReadGenerationValue;
    }

    get reviewSnapshot() {
      return this.reviewSnapshotValue;
    }

    getReviewWorkingTreeFileGeneration(path: string) {
      let generation = this.reviewWorkingTreeFileGenerations.get(path);
      if (generation == null) {
        generation = this.nextReviewWorkingTreeFileGeneration++;
        this.reviewWorkingTreeFileGenerations.set(path, generation);
      }
      return generation;
    }

    getReviewWorkingTreeFileReadPaths(path: string) {
      const paths = [path, `.gitattributes`];
      let directory = dependencies.pathPosix.dirname(path);
      while (directory !== `.`) {
        paths.push(dependencies.pathPosix.join(directory, `.gitattributes`));
        directory = dependencies.pathPosix.dirname(directory);
      }
      return paths;
    }

    requireReviewSnapshot(generation: number) {
      if (
        this.reviewSnapshotValue.generation !== generation ||
        this.reviewSnapshotValue.signal.aborted
      )
        throw new GitReviewSnapshotStaleError();
      return this.reviewSnapshotValue;
    }

    async getConfigValue(key: string, signal?: AbortSignal) {
      return dependencies.getConfigValue(this, [key], signal);
    }

    async getConfigValueForScope(key: string, scope: string, signal?: AbortSignal) {
      return dependencies.getConfigValueForScope(this, key, scope, signal);
    }

    async setConfigValueForScope(
      key: string,
      value: string,
      scope: string,
      signal?: AbortSignal,
    ) {
      const updated = await dependencies.setConfigValueForScope(
        this.root,
        key,
        value,
        scope,
        this.host,
        signal,
      );
      if (updated) this.invalidateGitReadCachesForRepoChange(`config`);
      return updated;
    }

    clearGitReadCaches() {
      this.gitConfigReadGenerationValue += 1;
      this.gitHeadReadGenerationValue += 1;
      this.gitReadGenerationValue += 1;
      this.reviewWorkingTreeFileGenerations.clear();
      this.advanceWatchScopedGitReadGeneration();
      this.queryClient.invalidateQueries({ refetchType: `none` });
    }

    invalidateGitReadCachesForRepoRecovery() {
      this.clearGitReadCaches();
      this.advanceReviewSnapshot();
    }

    clearShortLivedGitReadCaches() {
      this.gitReadGenerationValue += 1;
      this.reviewWorkingTreeFileGenerations.clear();
      dependencies.clearShortLivedQueries(this.queryClient);
    }

    invalidateWatchScopedGitReadCaches() {
      this.advanceWatchScopedGitReadGeneration();
    }

    invalidateGitReadCachesForMutation() {
      this.gitReadGenerationValue += 1;
      this.reviewWorkingTreeFileGenerations.clear();
      this.advanceReviewSnapshot();
      dependencies.clearShortLivedQueries(this.queryClient);
      this.invalidateWatchScopedGitReadCaches();
    }

    invalidateGitReadCachesForRepoChange(kind: string, paths?: string[]) {
      if (kind === `worktree-topology`) {
        this.queryClient.invalidateQueries({
          queryKey: dependencies.queryKey(this.root, this.host, `worktrees`),
          exact: true,
          refetchType: `none`,
        });
        return;
      }
      if (kind === `local-refs`) {
        this.advanceWatchScopedGitReadGeneration();
        dependencies.invalidateQueriesForRepoChange(
          this.queryClient,
          this.root,
          kind,
          paths,
        );
        return;
      }
      if (kind === `config`) this.gitConfigReadGenerationValue += 1;
      if (kind === `head`) this.gitHeadReadGenerationValue += 1;
      if (kind === `config` || kind === `head` || kind === `remote-refs`)
        this.advanceWatchScopedGitReadGeneration();
      this.gitReadGenerationValue += 1;
      if (kind === `working-tree` && paths != null) {
        this.reviewWorkingTreeFileGenerations.forEach((_generation, path) => {
          if (
            dependencies.pathsOverlap(
              this.root,
              this.getReviewWorkingTreeFileReadPaths(path),
              paths,
            )
          )
            this.reviewWorkingTreeFileGenerations.set(
              path,
              this.nextReviewWorkingTreeFileGeneration++,
            );
        });
      } else {
        this.reviewWorkingTreeFileGenerations.clear();
      }
      this.advanceReviewSnapshot();
      dependencies.invalidateQueriesForRepoChange(
        this.queryClient,
        this.root,
        kind,
        paths,
      );
    }

    advanceReviewSnapshot() {
      const previous = this.reviewSnapshotValue;
      this.reviewSnapshotValue = new GitReviewSnapshot(this, previous.generation + 1);
      previous.retire();
      this.queryClient.removeQueries({
        type: `inactive`,
        predicate: (query: any) =>
          (query.queryKey[4] === `review` &&
            query.queryKey[5] !== `${this.reviewSnapshotValue.generation}` &&
            query.state.fetchStatus !== `fetching`) ||
          (query.queryKey[3] === `review-working-tree-file-metadata` &&
            query.state.fetchStatus === `fetching`),
      });
    }

    advanceWatchScopedGitReadGeneration() {
      this.watchScopedGitReadGenerationValue += 1;
      dependencies.invalidateWatchScopedQueries(this.queryClient);
    }
  }

  return {
    GitRepository,
    GitReviewSnapshot,
    GitReviewSnapshotStaleError,
    GitWorktreeRepository,
  };
}

export { GitReviewSnapshotStaleError, ORIGIN_URL_CACHE_MS, createGitRepositoryModels };
if (typeof module !== `undefined`)
  module.exports = {
    GitReviewSnapshotStaleError,
    ORIGIN_URL_CACHE_MS,
    createGitRepositoryModels,
  };
