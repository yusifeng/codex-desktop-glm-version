type OriginDiscoveryDependencies = {
  gitManager: any;
  host: any;
  platform: string;
  environment: Record<string, string | undefined>;
  normalizeDiscoveryPath: (path: string) => string;
  normalizeRoot: (path: string) => string;
  isMissingError: (error: unknown) => boolean;
  warnOriginFailure: (error: unknown) => void;
};

function uniqueDiscoveryDirectories(directories: string[], normalizePath: (path: string) => string) {
  const unique = new Map<string, string>();
  for (const directory of directories) {
    const normalized = normalizePath(directory);
    if (!unique.has(normalized)) unique.set(normalized, directory);
  }
  return Array.from(unique.values());
}

async function resolveDiscoveryPathApi(deps: OriginDiscoveryDependencies) {
  if (!deps.host.isLocal || (deps.platform !== `darwin` && deps.platform !== `linux`) || deps.environment.GIT_DIR !== undefined || deps.environment.GIT_WORK_TREE !== undefined) return null;
  try {
    const expectedOs = deps.platform === `darwin` ? `macos` : deps.platform;
    const [hostOs, pathApi] = await Promise.all([deps.host.platformOs(), deps.host.platformPath()]);
    return hostOs === expectedOs ? pathApi : null;
  } catch {
    return null;
  }
}

async function pathRequiresGitDiscovery(directory: string, deps: OriginDiscoveryDependencies, pathApi: any) {
  if (!pathApi.isAbsolute(directory) || pathApi.normalize(directory) !== directory || (directory.endsWith(pathApi.sep) && directory !== pathApi.parse(directory).root)) return true;
  let current = directory;
  for (;;) {
    try {
      const stat = await deps.host.stat(current, { bypassCache: true, followSymlinks: false });
      if (stat.isSymbolicLink() || !stat.isDirectory()) return true;
    } catch {
      return true;
    }
    for (const marker of [`.git`, `HEAD`]) {
      try {
        await deps.host.stat(pathApi.join(current, marker), { bypassCache: true, followSymlinks: false });
        return true;
      } catch (error) {
        if (!deps.isMissingError(error)) return true;
      }
    }
    const parent = pathApi.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

async function selectDiscoveryDirectories(directories: string[], deps: OriginDiscoveryDependencies) {
  const pathApi = await resolveDiscoveryPathApi(deps);
  if (pathApi == null) return directories;
  const decisions = await Promise.all(directories.map(async (directory) => ({ directory, required: await pathRequiresGitDiscovery(directory, deps, pathApi) })));
  return decisions.filter(({ required }) => required).map(({ directory }) => directory);
}

async function resolveOriginAndRoot(directory: string, deps: OriginDiscoveryDependencies) {
  const metadata = await deps.gitManager.getStableMetadata(directory, deps.host);
  if (metadata == null) return null;
  const worktree = deps.gitManager.getWorktreeRepositoryForRoot(metadata.root, deps.host);
  const repository = await deps.gitManager.getRepoRepository(directory, deps.host);
  return repository == null
    ? null
    : { dir: directory, root: worktree.root, originUrl: await repository.getOriginUrl(), commonDir: repository.getCommonDir() };
}

async function resolveOriginAndRoots(directories: string[], deps: OriginDiscoveryDependencies) {
  const values = await Promise.all(directories.map(async (directory) => {
    try {
      return await resolveOriginAndRoot(deps.normalizeRoot(directory), deps);
    } catch (error) {
      deps.warnOriginFailure(error);
      return null;
    }
  }));
  return values.filter((value) => value != null);
}

async function discoverGitOrigins(directories: string[], deps: OriginDiscoveryDependencies) {
  const unique = uniqueDiscoveryDirectories(directories, deps.normalizeDiscoveryPath);
  const selected = await selectDiscoveryDirectories(unique, deps);
  return { origins: await resolveOriginAndRoots(selected, deps) };
}

export { discoverGitOrigins, pathRequiresGitDiscovery, resolveDiscoveryPathApi, resolveOriginAndRoot, resolveOriginAndRoots, selectDiscoveryDirectories, uniqueDiscoveryDirectories };
if (typeof module !== `undefined`) module.exports = { discoverGitOrigins, pathRequiresGitDiscovery, resolveDiscoveryPathApi, resolveOriginAndRoot, resolveOriginAndRoots, selectDiscoveryDirectories, uniqueDiscoveryDirectories };
