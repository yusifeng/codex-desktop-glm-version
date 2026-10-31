export type ThreadCleanupMetadata = {
  updatedAtMs: number | null;
  isInProgress: boolean;
  cwd: unknown | null;
  readFailed: boolean;
};

export type WorktreeCleanupRecord = {
  worktree: { dir: unknown };
  ownerThreadId: string | null;
  createdAtMs: number | null;
};

export type WorktreeCleanupRuntimeDependencies = {
  stat(path: unknown, executionHost: unknown): Promise<{ mtimeMs: number }>;
  normalizePath(path: unknown): string;
  parseDesktopConfiguration(value: unknown): Record<string, any>;
  getLocalProjectRoots(globalState: any): { roots: unknown[] };
  getRemoteProjectRoots(globalState: any, hostId: string): { roots: unknown[] };
  pinnedThreadIdsKey: unknown;
  autoCleanupOverrideKey: unknown;
  preMigrationProtectionStartedAtKey: unknown;
  logger: {
    error(message: string, context: Record<string, any>): void;
  };
  now(): number;
};

const PRE_MIGRATION_OWNERLESS_CUTOFF_MS = Date.parse(`2026-02-21T00:00:00.000Z`);
const NEW_OWNERLESS_PROTECTION_MS = 60 * 60 * 1_000;
const PRE_MIGRATION_PROTECTION_WINDOW_MS = 5 * 24 * 60 * 60 * 1_000;

function normalizeRoot(path: unknown, normalizePath: (path: unknown) => string) {
  return normalizePath(path).replace(/\/+$/, ``);
}

function isPreMigrationOwnerless(record: WorktreeCleanupRecord) {
  return (
    record.ownerThreadId == null &&
    record.createdAtMs != null &&
    record.createdAtMs < PRE_MIGRATION_OWNERLESS_CUTOFF_MS
  );
}

function isNewOwnerless(record: WorktreeCleanupRecord, nowMs: number) {
  return (
    record.ownerThreadId == null &&
    record.createdAtMs != null &&
    nowMs - record.createdAtMs < NEW_OWNERLESS_PROTECTION_MS
  );
}

/** Owns worktree cleanup planning, protection policy, and metadata/settings adapters. */
export function createWorktreeCleanupRuntime(
  dependencies: WorktreeCleanupRuntimeDependencies,
) {
  const planWorktreeCleanup = ({
    records,
    keepCount,
    threadMetadataById,
    pinnedThreadIds,
    protectPreMigrationOwnerlessWorktrees = false,
    protectedWorktreeDirs = [],
    nowMs = dependencies.now(),
  }: {
    records: WorktreeCleanupRecord[];
    keepCount: number;
    threadMetadataById: Record<string, ThreadCleanupMetadata | null | undefined>;
    pinnedThreadIds: string[];
    protectPreMigrationOwnerlessWorktrees?: boolean;
    protectedWorktreeDirs?: unknown[];
    nowMs?: number;
  }) => {
    if (records.length <= keepCount) return { candidates: [] as WorktreeCleanupRecord[] };
    const pinned = new Set(pinnedThreadIds);
    const owned = records.filter((record) => record.ownerThreadId != null);
    const preMigrationOwnerless = records.filter(isPreMigrationOwnerless);
    const ownerless = records.filter((record) => record.ownerThreadId == null);
    const protectedDirectories = new Set(protectedWorktreeDirs.map(String));

    if (protectPreMigrationOwnerlessWorktrees)
      for (const record of preMigrationOwnerless)
        protectedDirectories.add(String(record.worktree.dir));
    for (const record of ownerless)
      if (isNewOwnerless(record, nowMs))
        protectedDirectories.add(String(record.worktree.dir));
    for (const record of owned) {
      const ownerThreadId = record.ownerThreadId as string;
      if (pinned.has(ownerThreadId) || threadMetadataById[ownerThreadId]?.isInProgress === true)
        protectedDirectories.add(String(record.worktree.dir));
    }

    const compareDirectories = (left: WorktreeCleanupRecord, right: WorktreeCleanupRecord) =>
      String(left.worktree.dir).localeCompare(String(right.worktree.dir));
    const compareOwned = (left: WorktreeCleanupRecord, right: WorktreeCleanupRecord) => {
      const leftUpdatedAt = threadMetadataById[left.ownerThreadId as string]?.updatedAtMs ?? 0;
      const rightUpdatedAt = threadMetadataById[right.ownerThreadId as string]?.updatedAtMs ?? 0;
      return leftUpdatedAt === rightUpdatedAt
        ? compareDirectories(left, right)
        : leftUpdatedAt - rightUpdatedAt;
    };
    const compareOwnerless = (left: WorktreeCleanupRecord, right: WorktreeCleanupRecord) =>
      left.createdAtMs === right.createdAtMs
        ? compareDirectories(left, right)
        : (left.createdAtMs ?? Number.MAX_SAFE_INTEGER) -
          (right.createdAtMs ?? Number.MAX_SAFE_INTEGER);

    const unprotectedOwnerless = ownerless.filter(
      (record) => !protectedDirectories.has(String(record.worktree.dir)),
    );
    const unprotectedOwned = owned.filter(
      (record) => !protectedDirectories.has(String(record.worktree.dir)),
    );
    unprotectedOwnerless.sort(compareOwnerless);
    unprotectedOwned.sort(compareOwned);
    const orderedCandidates = [...unprotectedOwnerless, ...unprotectedOwned];
    const deleteCount = Math.max(0, orderedCandidates.length - keepCount);
    return { candidates: orderedCandidates.slice(0, deleteCount) };
  };

  const readThreadMetadata = async (
    appServerConnection: any,
    executionHost: unknown,
    threadIds: string[],
  ) => {
    const uniqueThreadIds = Array.from(new Set(threadIds));
    const entries = await Promise.all(
      uniqueThreadIds.map(async (threadId) => {
        try {
          const thread = await appServerConnection.readThread(threadId, { includeTurns: false });
          if (thread == null) return [threadId, null] as const;
          const threadUpdatedAtMs = thread.updatedAt * 1_000;
          let fileUpdatedAtMs: number | null = null;
          if (thread.path != null) {
            try {
              const stat = await dependencies.stat(thread.path, executionHost);
              fileUpdatedAtMs = Number.isFinite(stat.mtimeMs) ? stat.mtimeMs : null;
            } catch {}
          }
          const timestamps = [
            Number.isFinite(threadUpdatedAtMs) ? threadUpdatedAtMs : null,
            fileUpdatedAtMs,
          ].filter((value): value is number => value != null);
          return [
            threadId,
            {
              updatedAtMs: timestamps.length === 0 ? null : Math.max(...timestamps),
              isInProgress: thread.status.type === `active`,
              cwd: thread.cwd ?? null,
              readFailed: false,
            },
          ] as const;
        } catch (error) {
          dependencies.logger.error(`Failed to get thread metadata`, {
            safe: { threadId },
            sensitive: { error },
          });
          return [
            threadId,
            {
              updatedAtMs: dependencies.now(),
              isInProgress: true,
              cwd: null,
              readFailed: true,
            },
          ] as const;
        }
      }),
    );
    return Object.fromEntries(entries) as Record<string, ThreadCleanupMetadata | null>;
  };

  const getPinnedThreadIds = (globalState: any) => {
    const value = globalState.get(dependencies.pinnedThreadIdsKey);
    return Array.isArray(value) ? value.filter((entry) => typeof entry === `string`) : [];
  };

  const getPinnedProtectedRoots = ({
    pinnedThreadIds,
    threadMetadataById,
    worktrees,
  }: {
    pinnedThreadIds: string[];
    threadMetadataById: Record<string, ThreadCleanupMetadata | null | undefined>;
    worktrees: Array<{ dir: unknown }>;
  }) => {
    const pinnedRoots = pinnedThreadIds
      .map((threadId) => threadMetadataById[threadId]?.cwd)
      .filter((root) => root != null)
      .map((root) => normalizeRoot(root, dependencies.normalizePath));
    return worktrees
      .map((worktree) => worktree.dir)
      .filter((worktreeDirectory) => {
        const normalizedWorktreeDirectory = normalizeRoot(
          worktreeDirectory,
          dependencies.normalizePath,
        );
        return pinnedRoots.some(
          (root) => root === normalizedWorktreeDirectory || root.startsWith(`${normalizedWorktreeDirectory}/`),
        );
      });
  };

  const hasUnavailablePinnedMetadata = ({
    pinnedThreadIds,
    threadMetadataById,
  }: {
    pinnedThreadIds: string[];
    threadMetadataById: Record<string, ThreadCleanupMetadata | null | undefined>;
  }) =>
    pinnedThreadIds.some((threadId) => {
      const metadata = threadMetadataById[threadId];
      return metadata == null || metadata.readFailed;
    });

  const allowAutoCleanup = (globalState: any, isPackaged: boolean) =>
    isPackaged || globalState.get(dependencies.autoCleanupOverrideKey) === true;

  const readHostWorktreeSettings = async ({
    appServerConnection,
    globalState,
    isPackaged = true,
  }: {
    appServerConnection: any;
    globalState: any;
    isPackaged?: boolean;
  }) => {
    const settings = dependencies.parseDesktopConfiguration(
      (await appServerConnection.getUserSavedConfiguration()).desktop,
    );
    return {
      ...settings,
      autoCleanupEnabled:
        settings.autoCleanupEnabled && allowAutoCleanup(globalState, isPackaged),
    };
  };

  const isPreMigrationProtectionActive = (
    globalState: any,
    nowMs = dependencies.now(),
  ) => {
    const storedValue = globalState.get(dependencies.preMigrationProtectionStartedAtKey);
    let startedAtMs: number;
    if (typeof storedValue === `number` && Number.isFinite(storedValue) && storedValue > 0)
      startedAtMs = storedValue;
    else {
      startedAtMs = nowMs;
      globalState.set(dependencies.preMigrationProtectionStartedAtKey, startedAtMs);
    }
    return nowMs < startedAtMs + PRE_MIGRATION_PROTECTION_WINDOW_MS;
  };

  const isProtectedWorkspaceRoot = ({
    globalState,
    hostId,
    worktreeDir,
  }: {
    globalState: any;
    hostId: string;
    worktreeDir: unknown;
  }) => {
    const normalizedWorktreeDirectory = normalizeRoot(
      worktreeDir,
      dependencies.normalizePath,
    );
    const roots =
      hostId === `local`
        ? dependencies.getLocalProjectRoots(globalState).roots
        : dependencies.getRemoteProjectRoots(globalState, hostId).roots;
    return roots.some((root) => {
      const normalizedRoot = normalizeRoot(root, dependencies.normalizePath);
      return (
        normalizedRoot === normalizedWorktreeDirectory ||
        normalizedRoot.startsWith(`${normalizedWorktreeDirectory}/`)
      );
    });
  };

  const getProtectedWorkspaceRoots = ({
    globalState,
    hostId,
    worktrees,
  }: {
    globalState: any;
    hostId: string;
    worktrees: Array<{ dir: unknown }>;
  }) =>
    worktrees
      .map((worktree) => worktree.dir)
      .filter((worktreeDir) => isProtectedWorkspaceRoot({ globalState, hostId, worktreeDir }));

  return {
    getPinnedProtectedRoots,
    getPinnedThreadIds,
    getProtectedWorkspaceRoots,
    hasUnavailablePinnedMetadata,
    isPreMigrationProtectionActive,
    isProtectedWorkspaceRoot,
    planWorktreeCleanup,
    readHostWorktreeSettings,
    readThreadMetadata,
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createWorktreeCleanupRuntime };
}
