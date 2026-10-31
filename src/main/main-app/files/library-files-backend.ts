type LibraryFilesBackendDependencies = {
  path: any;
  fsPromises: any;
  homedir(): string;
  createLogger(tag: string): () => {
    warning(message: string, fields: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
  };
  pathContains(path: string, parent: string): boolean;
  convertPathForDesktopHost(path: string, shouldUseWslPaths: boolean): string;
  convertPathForAgentEnvironment(path: string, shouldUseWslPaths: boolean): string;
  getShouldUseWslPaths(): boolean;
  getCodexHome(options: { preferWsl: boolean }): string;
  getDefaultProjectlessWorkspaceRoot(options: { homeDirectory: string; path: any }): string;
  normalizeProjectAssignments(value: unknown): Record<string, unknown>;
  stateKeys: {
    THREAD_PROJECTLESS_OUTPUT_DIRECTORIES: string;
    THREAD_PROJECT_ASSIGNMENTS: string;
    PROJECTLESS_THREAD_IDS: string;
    THREAD_WORKSPACE_ROOT_HINTS: string;
  };
  projectlessWorkspaceRootSettingKey: string;
};

type OutputFile = {
  modifiedAt: string;
  name: string;
  path: string;
  relativePath: string;
  sizeBytes: number;
  threadId: string | null;
};

const THREAD_LOOKUP_CONCURRENCY = 8;
const MISSING_THREAD_CACHE_TTL_MS = 30_000;

export function createLibraryFilesBackendRuntime(dependencies: LibraryFilesBackendDependencies) {
  const {
    path: pathModule,
    fsPromises,
    homedir,
    createLogger,
    pathContains,
    convertPathForDesktopHost,
    convertPathForAgentEnvironment,
    getShouldUseWslPaths,
    getCodexHome,
    getDefaultProjectlessWorkspaceRoot,
    normalizeProjectAssignments,
    stateKeys,
    projectlessWorkspaceRootSettingKey,
  } = dependencies;
  const path = pathModule.default ?? pathModule;
  const logger = createLogger("library-files");
  const threadLookupCache = new WeakMap<object, Map<string, { expiresAt: number; promise: Promise<boolean> }>>();

  function generatedImagesDirectory(codexHome: string, toDesktopPath: (value: string) => string) {
    return path.join(toDesktopPath(codexHome), "generated_images");
  }

  function normalizePath(value: string) {
    const normalized = path.normalize(value);
    return process.platform === "win32" ? normalized.toLowerCase() : normalized;
  }

  function resolveOutputDirectories({
    configuredOutputDirectories,
    shouldUseWslPaths,
    threads,
    workspaceRoots,
  }: {
    configuredOutputDirectories?: Record<string, string>;
    shouldUseWslPaths: boolean;
    threads: Array<{ id: string; cwd: string }>;
    workspaceRoots: string[];
  }) {
    const outputDirectories: Record<string, string> = {};
    for (const [threadId, directory] of Object.entries(configuredOutputDirectories ?? {})) {
      outputDirectories[threadId] = convertPathForDesktopHost(directory, shouldUseWslPaths);
    }
    for (const thread of threads) {
      outputDirectories[thread.id] = configuredOutputDirectories?.[thread.id] == null
        ? path.join(convertPathForDesktopHost(thread.cwd, shouldUseWslPaths), "outputs")
        : convertPathForDesktopHost(configuredOutputDirectories[thread.id], shouldUseWslPaths);
    }
    const allowedOutputDirectories = Object.values(outputDirectories).filter((directory) =>
      workspaceRoots.some((root) => pathContains(path.resolve(directory), root)),
    );
    return { allowedOutputDirectories: [...new Set(allowedOutputDirectories)], outputDirectories };
  }

  async function scanDirectory({
    directory,
    outputDirectory,
    outputDirectoryRealPath,
    threadId,
  }: {
    directory: string;
    outputDirectory: string;
    outputDirectoryRealPath: string;
    threadId: string | null;
  }): Promise<OutputFile[]> {
    const entries = await fsPromises.readdir(directory, { withFileTypes: true });
    return (await Promise.all(entries.map(async (entry: { name: string }) => {
      const entryPath = path.join(directory, entry.name);
      try {
        const stat = await fsPromises.lstat(entryPath);
        if (stat.isSymbolicLink() || !pathContains(await fsPromises.realpath(entryPath), outputDirectoryRealPath))
          return [];
        if (stat.isDirectory()) {
          return scanDirectory({ directory: entryPath, outputDirectory, outputDirectoryRealPath, threadId });
        }
        return stat.isFile()
          ? [{
              modifiedAt: stat.mtime.toISOString(),
              name: entry.name,
              path: entryPath,
              relativePath: path.relative(outputDirectory, entryPath),
              sizeBytes: stat.size,
              threadId,
            }]
          : [];
      } catch (error) {
        logger().warning("Failed to inspect projectless output entry", {
          safe: {},
          sensitive: { entryPath, error },
        });
        return [];
      }
    }))).flat();
  }

  async function scanOutputDirectory(
    outputDirectory: string,
    workspaceRootRealPaths: string[],
    threadId: string | null,
  ): Promise<OutputFile[]> {
    try {
      const stat = await fsPromises.lstat(outputDirectory);
      if (!stat.isDirectory() || stat.isSymbolicLink()) return [];
      const resolvedDirectory = path.resolve(outputDirectory);
      const realPath = await fsPromises.realpath(resolvedDirectory);
      return workspaceRootRealPaths.some((root) => pathContains(realPath, root))
        ? scanDirectory({
            directory: resolvedDirectory,
            outputDirectory: resolvedDirectory,
            outputDirectoryRealPath: realPath,
            threadId,
          })
        : [];
    } catch (error) {
      logger().warning("Failed to inspect projectless output directory", {
        safe: {},
        sensitive: { error, outputDirectory },
      });
      return [];
    }
  }

  async function listOutputFiles({
    allowedOutputDirectories,
    outputDirectories,
    workspaceRoots,
  }: {
    allowedOutputDirectories: string[];
    outputDirectories: Record<string, string>;
    workspaceRoots: string[];
  }): Promise<OutputFile[]> {
    const filesByPath = new Map<string, OutputFile>();
    const allowedPaths = new Set(allowedOutputDirectories.map(normalizePath));
    const workspaceRootRealPaths = (await Promise.all(workspaceRoots.map(async (workspaceRoot) => {
      const resolvedRoot = path.resolve(workspaceRoot);
      try {
        const stat = await fsPromises.lstat(resolvedRoot);
        return !stat.isDirectory() || stat.isSymbolicLink() ? null : fsPromises.realpath(resolvedRoot);
      } catch (error) {
        logger().warning("Failed to inspect projectless workspace root", {
          safe: {},
          sensitive: { error, workspaceRootPath: resolvedRoot },
        });
        return null;
      }
    }))).filter((value): value is string => value != null);
    if (workspaceRootRealPaths.length === 0) return [];

    const scansByDirectory = new Map<string, { outputDirectory: string; threadId: string | null }>();
    for (const [threadId, outputDirectory] of Object.entries(outputDirectories)) {
      const key = normalizePath(outputDirectory);
      const current = scansByDirectory.get(key);
      scansByDirectory.set(key, {
        outputDirectory,
        threadId: current == null || current.threadId === threadId ? threadId : null,
      });
    }
    for (const outputDirectory of allowedOutputDirectories) {
      const key = normalizePath(outputDirectory);
      if (!scansByDirectory.has(key))
        scansByDirectory.set(key, { outputDirectory, threadId: null });
    }
    const scans = [...scansByDirectory.values()].filter(({ outputDirectory }) =>
      allowedPaths.has(normalizePath(outputDirectory)),
    );
    for (const files of await Promise.all(scans.map(({ outputDirectory, threadId }) =>
      scanOutputDirectory(outputDirectory, workspaceRootRealPaths, threadId)))) {
      for (const file of files) {
        const key = normalizePath(file.path);
        if (!filesByPath.has(key)) filesByPath.set(key, file);
      }
    }
    return [...filesByPath.values()].sort((left, right) => left.path.localeCompare(right.path));
  }

  function threadExists(appServerConnection: any, threadId: string): Promise<boolean> {
    let cache = threadLookupCache.get(appServerConnection);
    if (cache == null) {
      cache = new Map();
      threadLookupCache.set(appServerConnection, cache);
    }
    const cached = cache.get(threadId);
    if (cached != null && cached.expiresAt > Date.now()) return cached.promise;
    const promise = appServerConnection
      .readThread(threadId, { includeTurns: false })
      .then((thread: unknown) => {
        const exists = thread != null;
        if (!exists) {
          const entry = cache?.get(threadId);
          if (entry != null) entry.expiresAt = Date.now() + MISSING_THREAD_CACHE_TTL_MS;
        }
        return exists;
      })
      .catch((error: unknown) => {
        const entry = cache?.get(threadId);
        if (entry != null && error instanceof Error && error.message === `thread not loaded: ${threadId}`)
          entry.expiresAt = Date.now() + MISSING_THREAD_CACHE_TTL_MS;
        else cache?.delete(threadId);
        return false;
      });
    cache.set(threadId, { expiresAt: Infinity, promise });
    return promise;
  }

  async function loadProjectlessWorkspaceScope({
    appServerConnection,
    globalState,
    localThreadIds,
    settingsStore,
  }: {
    appServerConnection: any;
    globalState: any;
    localThreadIds: Set<string>;
    settingsStore: any;
  }) {
    const configuredRoot = settingsStore.getEffective(projectlessWorkspaceRootSettingKey);
    const assignments = normalizeProjectAssignments(globalState.get(stateKeys.THREAD_PROJECT_ASSIGNMENTS));
    const projectlessThreadIds = new Set<string>(
      (globalState.get(stateKeys.PROJECTLESS_THREAD_IDS) ?? []).filter(
        (threadId: string) => assignments[threadId] == null,
      ),
    );
    const workspaceRootHints = new Map<string, string>(
      Object.entries(globalState.get(stateKeys.THREAD_WORKSPACE_ROOT_HINTS) ?? {}),
    );
    const candidateIds = [...new Set([
      ...workspaceRootHints.keys(),
      ...Object.keys(globalState.get(stateKeys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES) ?? {}),
    ])].filter((threadId) => projectlessThreadIds.has(threadId));
    const validLocalThreadIds = new Set([...localThreadIds].filter((threadId) =>
      projectlessThreadIds.has(threadId),
    ));
    const hintedRoots: string[] = [];
    for (let offset = 0; offset < candidateIds.length; offset += THREAD_LOOKUP_CONCURRENCY) {
      const roots = await Promise.all(candidateIds.slice(offset, offset + THREAD_LOOKUP_CONCURRENCY).map(
        async (threadId) => {
          if (!localThreadIds.has(threadId) && !(await threadExists(appServerConnection, threadId)))
            return null;
          validLocalThreadIds.add(threadId);
          const hint = workspaceRootHints.get(threadId);
          return hint == null ? null : convertPathForDesktopHost(hint, getShouldUseWslPaths());
        },
      ));
      hintedRoots.push(...roots.filter((value): value is string => value != null));
    }
    return {
      localThreadIds: validLocalThreadIds,
      workspaceRoots: [...new Set([
        getDefaultProjectlessWorkspaceRoot({ homeDirectory: homedir(), path }),
        ...(configuredRoot != null && path.isAbsolute(configuredRoot) ? [configuredRoot] : []),
        ...hintedRoots,
      ])],
    };
  }

  class LibraryFilesBackend {
    readonly shouldUseWslPaths: boolean;
    readonly generatedImagesDirectory: string;

    constructor(
      readonly appServerConnection: any,
      readonly globalState: any,
      readonly settingsStore: any,
    ) {
      this.shouldUseWslPaths = getShouldUseWslPaths();
      this.generatedImagesDirectory = generatedImagesDirectory(
        getCodexHome({ preferWsl: this.shouldUseWslPaths }),
        (value) => this.convertPathForDesktopHost(value),
      );
    }

    convertPathForDesktopHost(value: string) {
      return convertPathForDesktopHost(value, this.shouldUseWslPaths);
    }

    convertPathForAgentEnvironment(value: string) {
      return convertPathForAgentEnvironment(value, this.shouldUseWslPaths);
    }

    async getAllowedLibraryDirectories() {
      const { allowedOutputDirectories } = await this.loadProjectlessOutputDirectories();
      return [...allowedOutputDirectories, this.generatedImagesDirectory];
    }

    async listOutputFiles() {
      return (await listOutputFiles(await this.loadProjectlessOutputDirectories())).map((file) => ({
        ...file,
        path: this.convertPathForAgentEnvironment(file.path),
      }));
    }

    async listLocalThreads() {
      const threads: any[] = [];
      let cursor: string | null = null;
      do {
        const page = await this.appServerConnection.listThreads({
          archived: false,
          cursor,
          limit: 200,
          modelProviders: null,
          sortKey: "updated_at",
          useStateDbOnly: true,
        });
        threads.push(...page.data);
        cursor = page.nextCursor;
      } while (cursor != null);
      return threads;
    }

    async loadProjectlessOutputDirectories() {
      const threads = await this.listLocalThreads();
      const { localThreadIds, workspaceRoots } = await loadProjectlessWorkspaceScope({
        appServerConnection: this.appServerConnection,
        globalState: this.globalState,
        localThreadIds: new Set(threads.map(({ id }) => id)),
        settingsStore: this.settingsStore,
      });
      return {
        ...resolveOutputDirectories({
          configuredOutputDirectories: Object.fromEntries(
            Object.entries(
              (this.globalState.get(stateKeys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES) ?? {}) as Record<
                string,
                string
              >,
            ).filter(([threadId]) => localThreadIds.has(threadId)),
          ),
          shouldUseWslPaths: this.shouldUseWslPaths,
          threads: threads.filter(({ id }) => localThreadIds.has(id)),
          workspaceRoots,
        }),
        workspaceRoots,
      };
    }
  }

  return {
    LibraryFilesBackend,
    listOutputFiles,
    loadProjectlessWorkspaceScope,
    resolveOutputDirectories,
  };
}
