type SyncedBranchConfigDependencies = {
  getGitDir: (repository: any, signal?: AbortSignal) => Promise<string | null>;
  logger: { warning: (message: string, detail: any) => void };
  parseSchema: (value: unknown) => {
    success: boolean;
    data?: any;
    error?: { message?: string };
  };
  resolveGitPath: (
    repository: any,
    fileName: string,
    signal?: AbortSignal,
  ) => Promise<string | null>;
};

const SYNCED_BRANCH_CONFIG_FILE = `codex-synced-branch.json`;

async function getSyncedBranchConfigPath(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: SyncedBranchConfigDependencies,
) {
  const gitDir = await dependencies.getGitDir(repository, signal);
  if (!gitDir) return null;
  const platformPath = await repository.host.platformPath();
  return platformPath.join(gitDir, SYNCED_BRANCH_CONFIG_FILE);
}

function parseSyncedBranchConfig(
  value: string,
  dependencies: SyncedBranchConfigDependencies,
) {
  try {
    const result = dependencies.parseSchema(JSON.parse(value));
    if (result.success) return result.data;
    dependencies.logger.warning(`Invalid synced branch config`, {
      safe: { parseErrorMessage: result.error?.message ?? `unknown error` },
      sensitive: {},
    });
    return null;
  } catch (error) {
    dependencies.logger.warning(`Failed to parse synced branch config`, {
      safe: {},
      sensitive: { error },
    });
    return null;
  }
}

async function readSyncedBranchConfig(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: SyncedBranchConfigDependencies,
) {
  const path = await getSyncedBranchConfigPath(repository, signal, dependencies);
  if (!path) return null;
  try {
    const body = await repository.host.readFile(path);
    return parseSyncedBranchConfig(await new Response(body).text(), dependencies);
  } catch {
    return null;
  }
}

async function writeSyncedBranchConfig(
  repository: any,
  value: any,
  signal: AbortSignal | undefined,
  dependencies: SyncedBranchConfigDependencies,
) {
  const path = await getSyncedBranchConfigPath(repository, signal, dependencies);
  if (!path) throw Error(`No git repository found for synced branch config`);
  await repository.host.writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function setSyncedBranchConfig(
  repository: any,
  branch: string,
  lastSyncedTreeRef: string,
  signal: AbortSignal | undefined,
  dependencies: SyncedBranchConfigDependencies,
) {
  await writeSyncedBranchConfig(
    repository,
    { branch, lastSyncedTreeRef },
    signal,
    dependencies,
  );
}

async function resolveSyncedBranchConfigPath(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: SyncedBranchConfigDependencies,
) {
  return dependencies.resolveGitPath(repository, SYNCED_BRANCH_CONFIG_FILE, signal);
}

export {
  SYNCED_BRANCH_CONFIG_FILE,
  getSyncedBranchConfigPath,
  parseSyncedBranchConfig,
  readSyncedBranchConfig,
  resolveSyncedBranchConfigPath,
  setSyncedBranchConfig,
  writeSyncedBranchConfig,
};
if (typeof module !== `undefined`)
  module.exports = {
    SYNCED_BRANCH_CONFIG_FILE,
    getSyncedBranchConfigPath,
    parseSyncedBranchConfig,
    readSyncedBranchConfig,
    resolveSyncedBranchConfigPath,
    setSyncedBranchConfig,
    writeSyncedBranchConfig,
  };
