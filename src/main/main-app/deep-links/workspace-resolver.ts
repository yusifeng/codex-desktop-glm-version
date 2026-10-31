// @ts-nocheck

export function originsMatch({
  targetOriginUrl,
  candidateOriginUrl,
  targetRepo,
  parseRepoOrigin,
}: Record<string, any>) {
  if (candidateOriginUrl === targetOriginUrl) return true;
  if (targetRepo == null) return false;
  const candidateRepo = parseRepoOrigin(candidateOriginUrl);
  return (
    candidateRepo != null &&
    candidateRepo.host === targetRepo.host &&
    candidateRepo.owner === targetRepo.owner &&
    candidateRepo.repo === targetRepo.repo
  );
}

export function matchWorkspaceForOrigin({
  targetOriginUrl,
  workspaceRoots,
  origins,
  parseRepoOrigin,
}: Record<string, any>) {
  const targetRepo = parseRepoOrigin(targetOriginUrl);
  const originByPath = new Map();
  for (const origin of origins) {
    if (origin.originUrl == null) continue;
    if (!originByPath.has(origin.dir)) originByPath.set(origin.dir, origin.originUrl);
    if (!originByPath.has(origin.root)) originByPath.set(origin.root, origin.originUrl);
  }
  for (const workspaceRoot of workspaceRoots) {
    const candidateOriginUrl = originByPath.get(workspaceRoot);
    if (
      candidateOriginUrl != null &&
      originsMatch({
        targetOriginUrl,
        candidateOriginUrl,
        targetRepo,
        parseRepoOrigin,
      })
    ) {
      return workspaceRoot;
    }
  }
  return null;
}

/** Resolves a new-thread deep link to an existing local directory or matching Git workspace. */
export async function resolveDeepLinkWorkspace(options: Record<string, any>) {
  const {
    route,
    globalState,
    requestGitWorker,
    appServerClient,
    projectsManager,
    resolvePath,
    stat,
    getFallbackRoots,
    parseRepoOrigin,
  } = options;

  if (route.path != null) {
    const resolvedPath = resolvePath(route.path);
    try {
      if ((await stat(resolvedPath)).isDirectory()) return resolvedPath;
    } catch {
      // An invalid local path may still resolve through its origin URL.
    }
  }

  if (route.originUrl == null) return null;
  const workspaceRoots =
    projectsManager?.getProjectRootPathsForHost(`local`) ?? getFallbackRoots(globalState);
  if (workspaceRoots.length === 0) return null;

  const { origins } = await requestGitWorker({
    method: `origin-and-roots`,
    params: {
      discoveryDirs: workspaceRoots,
      operationSource: `git_direct_call`,
      hostConfig: appServerClient.hostConfig,
    },
  });
  return matchWorkspaceForOrigin({
    targetOriginUrl: route.originUrl,
    workspaceRoots,
    origins,
    parseRepoOrigin,
  });
}

if (typeof module !== "undefined") {
  module.exports = { matchWorkspaceForOrigin, originsMatch, resolveDeepLinkWorkspace };
}
