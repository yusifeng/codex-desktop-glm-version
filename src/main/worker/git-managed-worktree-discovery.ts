type ManagedWorktreeDiscoveryDependencies = {
  normalizeComparisonPath: (path: string) => string;
  normalizeWorktreePath: (path: string) => string;
  toLocalHostPath: (path: string) => string;
  getGitDir: (repository: any) => Promise<string | null> | string | null;
};

import { isLegacyWorktreeChildName, isLegacyWorktreeParentName, isNamedWorktreeParentName, worktreeNameMarker } from './git-managed-worktree-discovery-policy';

type ManagedWorktreeLocation = {
  path: string;
  boundary: string;
  legacy: boolean;
};


async function getManagedWorktreeLocations(
  host: any,
  worktreesRoot: string | null | undefined,
  dependencies: Pick<ManagedWorktreeDiscoveryDependencies, `normalizeComparisonPath` | `toLocalHostPath`>,
) {
  const customRoot = worktreesRoot?.trim();
  const [workspacesRoot, codexHome, path] = await Promise.all([
    host.workspacesRoot().catch(() => null),
    host.codexHome().catch(() => null),
    host.platformPath(),
  ]);
  const candidates = [
    { path: customRoot, boundary: customRoot, legacy: false },
    {
      path: workspacesRoot == null ? null : path.join(workspacesRoot, `worktrees`),
      boundary: workspacesRoot,
      legacy: false,
    },
    {
      path: codexHome == null ? null : path.join(codexHome, `worktrees`),
      boundary: codexHome,
      legacy: true,
    },
  ];
  const locations = new Map<string, ManagedWorktreeLocation>();
  for (const candidate of candidates) {
    if (!candidate.path || !candidate.boundary) continue;
    const locationPath = host.isLocal && path.sep === `/`
      ? dependencies.toLocalHostPath(candidate.path)
      : candidate.path;
    const comparisonPath = dependencies.normalizeComparisonPath(locationPath);
    const existing = locations.get(comparisonPath);
    locations.set(comparisonPath, {
      path: locationPath,
      boundary: host.isLocal && path.sep === `/`
        ? dependencies.toLocalHostPath(candidate.boundary)
        : candidate.boundary,
      legacy: candidate.legacy || existing?.legacy === true,
    });
  }
  return [...locations.values()];
}

async function readValidatedLocationEntries(host: any, location: ManagedWorktreeLocation) {
  try {
    const stats = await Promise.all(
      [...new Set([location.path, location.boundary])].map((candidate) =>
        host.stat(candidate, { bypassCache: true, followSymlinks: false }),
      ),
    );
    return stats.some((stat) => !stat.isDirectory() || stat.isSymbolicLink())
      ? []
      : await host.readDirectory(location.path);
  } catch {
    return [];
  }
}

async function listCodexWorktrees(
  gitManager: any,
  host: any,
  worktreesRoot: string | null | undefined,
  dependencies: ManagedWorktreeDiscoveryDependencies,
) {
  const [path, locations] = await Promise.all([
    host.platformPath(),
    getManagedWorktreeLocations(host, worktreesRoot, dependencies),
  ]);
  const parents = (
    await Promise.all(
      locations.map(async (location) => {
        const entries = await readValidatedLocationEntries(host, location);
        return Promise.all(
          entries
            .filter((entry: any) => entry.isDirectory() && !entry.isSymbolicLink())
            .map(async (entry: any) => {
              const parentPath = path.join(location.path, entry.name);
              try {
                const stat = await host.stat(parentPath, {
                  bypassCache: true,
                  followSymlinks: false,
                });
                return !stat.isDirectory() || stat.isSymbolicLink()
                  ? null
                  : {
                      parentName: entry.name,
                      parentPath,
                      worktreeEntries: await host.readDirectory(parentPath),
                    };
              } catch {
                return null;
              }
            }),
        );
      }),
    )
  ).flat();

  const candidates: Array<Promise<{ dir: string; gitDir: string | null } | null>> = [];
  for (const parent of parents) {
    if (!parent) continue;
    const legacyParent = isLegacyWorktreeParentName(parent.parentName);
    const namedMarkerParent =
      isNamedWorktreeParentName(parent.parentName) &&
      parent.worktreeEntries.some(
        (entry: any) => entry.name === worktreeNameMarker && entry.isFile(),
      );
    for (const entry of parent.worktreeEntries) {
      if (
        !entry.isDirectory() ||
        entry.isSymbolicLink() ||
        (!legacyParent && !namedMarkerParent && !isLegacyWorktreeChildName(entry.name))
      ) {
        continue;
      }
      const candidatePath = dependencies.normalizeWorktreePath(
        path.join(parent.parentPath, entry.name),
      );
      if (!candidatePath) continue;
      candidates.push(
        host
          .stat(candidatePath, { bypassCache: true, followSymlinks: false })
          .catch(() => null)
          .then(async (stat: any) => {
            if (stat == null || !stat.isDirectory() || stat.isSymbolicLink()) return null;
            const gitDir = await dependencies.getGitDir(
              gitManager.getWorktreeRepositoryForRoot(candidatePath, host),
            );
            if (!legacyParent && namedMarkerParent) {
              const dotGit = await host.stat(path.join(candidatePath, `.git`)).catch(() => null);
              if (gitDir == null || !dotGit?.isFile()) return null;
            }
            return { dir: candidatePath, gitDir };
          }),
      );
    }
  }
  return (await Promise.all(candidates)).filter((candidate) => candidate != null);
}

export {
  getManagedWorktreeLocations,
  isLegacyWorktreeChildName,
  isLegacyWorktreeParentName,
  isNamedWorktreeParentName,
  listCodexWorktrees,
  readValidatedLocationEntries,
};
if (typeof module !== `undefined`)
  module.exports = {
    getManagedWorktreeLocations,
    isLegacyWorktreeChildName,
    isLegacyWorktreeParentName,
    isNamedWorktreeParentName,
    listCodexWorktrees,
    readValidatedLocationEntries,
  };
