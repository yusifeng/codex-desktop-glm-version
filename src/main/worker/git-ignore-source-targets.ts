const MAX_SYMLINK_DEPTH = 40;

type PathApi = { isAbsolute(path: string): boolean; parse(path: string): { root: string }; dirname(path: string): string; join(...paths: string[]): string; sep: string };
type Dependencies = { pathApi: PathApi; lstat(path: string): Promise<{ isSymbolicLink(): boolean; isDirectory(): boolean }>; readlink(path: string): Promise<string>; isMissingPathError(error: unknown): boolean };

async function getIgnoreSourceWatchTargets(paths: Iterable<string>, dependencies: Dependencies): Promise<Map<string, Set<string>>> {
  const { pathApi } = dependencies;
  const targets = new Map<string, Set<string>>();
  await Promise.all([...new Set(paths)].map(async (path) => {
    if (!pathApi.isAbsolute(path)) throw TypeError(`Ignore-source watch paths must be absolute`);
    let directory = pathApi.parse(path).root;
    const segments = path.slice(directory.length).split(pathApi.sep);
    const followed = new Set<string>();
    let symlinkDepth = 0;
    while (segments.length > 0) {
      const segment = segments.shift();
      if (segment == null || segment === `` || segment === `.`) continue;
      if (segment === `..`) { directory = pathApi.dirname(directory); continue; }
      const candidate = pathApi.join(directory, segment);
      let target = targets.get(directory);
      if (target == null) { target = new Set<string>(); targets.set(directory, target); }
      target.add(candidate);
      try {
        const stat = await dependencies.lstat(candidate);
        if (stat.isSymbolicLink()) {
          const marker = `${candidate}\0${segments.join(pathApi.sep)}`;
          symlinkDepth += 1;
          if (followed.has(marker) || symlinkDepth > MAX_SYMLINK_DEPTH)
            throw Object.assign(Error(`Cannot follow cyclic or excessive ignore-source symlinks`), { code: `ELOOP` });
          followed.add(marker);
          const link = await dependencies.readlink(candidate);
          const root = pathApi.parse(link).root;
          if (root !== ``) directory = root;
          segments.unshift(...link.slice(root.length).split(pathApi.sep));
        } else if (stat.isDirectory()) directory = candidate;
        else return;
      } catch (error) {
        if (dependencies.isMissingPathError(error)) return;
        throw error;
      }
    }
  }));
  return targets;
}

export { getIgnoreSourceWatchTargets, MAX_SYMLINK_DEPTH };
if (typeof module !== `undefined`) module.exports = { getIgnoreSourceWatchTargets, MAX_SYMLINK_DEPTH };
