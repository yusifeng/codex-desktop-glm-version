// @ts-nocheck

/** Builds the project-root lookup used while recovering unassigned thread memberships. */
export function createThreadMembershipInference(
  dependencies: Record<string, any>,
) {
  const {
    runtime: n,
    getLocalProjects,
    getWorkspaceRootOptions,
    canonicalizeRoots,
    normalizeRoots,
    basename,
    chunk,
    hintReadBatchSize = 8,
    threadListPageSize = 100,
  } = dependencies;

  function buildProjectRootIndex(
    projects: Record<string, any>,
    canonicalPathByRoot: Record<string, string>,
    host: any,
    useWslPaths: boolean,
  ) {
    const projectsByRoot = new Map();
    const canonicalAliases = new Map();
    for (const project of Object.values(projects)) {
      const normalizedRoots = normalizeRoots(
        project.rootPaths,
        host,
        useWslPaths,
      );
      for (const rootPath of normalizedRoots) {
        const normalizedRoot = n._l(rootPath);
        const canonicalPath = canonicalPathByRoot[rootPath];
        if (canonicalPath != null) {
          const normalizedCanonicalPath = n._l(canonicalPath);
          const existingAlias = canonicalAliases.get(normalizedCanonicalPath);
          if (existingAlias === undefined)
            canonicalAliases.set(normalizedCanonicalPath, normalizedRoot);
          else if (existingAlias !== normalizedRoot)
            canonicalAliases.set(normalizedCanonicalPath, null);
        }
        const candidate = {
          createdAt: project.createdAt,
          projectId: project.id,
          rootPath,
          rootPaths: normalizedRoots,
        };
        const current = projectsByRoot.get(normalizedRoot);
        if (current == null || n.Ko(candidate, current))
          projectsByRoot.set(normalizedRoot, candidate);
      }
    }
    for (const [canonicalPath, normalizedRoot] of canonicalAliases) {
      if (normalizedRoot == null || projectsByRoot.has(canonicalPath)) continue;
      const project = projectsByRoot.get(normalizedRoot);
      if (project != null) projectsByRoot.set(canonicalPath, project);
    }
    return projectsByRoot;
  }

  async function assignUnassignedThreadsBeforeRootsChange({
    affectedRootPaths,
    excludedThreadIds,
    getGitOriginUrl,
    globalState,
    host,
    listThreads,
    matchRootsByCanonicalHostIdentity,
    readThread,
    threadProjectAssignments,
  }: Record<string, any>) {
    const affectedRoots = new Set(affectedRootPaths);
    if (affectedRoots.size === 0) return;

    const projects = getLocalProjects(globalState);
    const rootsToCanonicalize = Array.from(
      new Set([...getWorkspaceRootOptions(globalState).roots, ...affectedRoots]),
    );
    const useWslPaths = n.zi(host);
    const canonicalPathByRoot = await canonicalizeRoots(
      rootsToCanonicalize,
      host,
      useWslPaths,
    );
    const canonicalPaths = matchRootsByCanonicalHostIdentity
      ? new Set(Object.values(canonicalPathByRoot))
      : null;
    const canonicalIdentity =
      canonicalPaths == null
        ? null
        : (root: string) =>
            canonicalPathByRoot[root] ??
            (canonicalPaths.has(root) ? root : n._l(root));
    const identity = canonicalIdentity ?? n._l;

    const normalizedAffectedRoots = normalizeRoots(
      [...affectedRoots],
      host,
      useWslPaths,
    );
    const searchRoots = new Set([
      ...normalizedAffectedRoots,
      ...normalizedAffectedRoots.flatMap((root) => {
        const canonicalPath = canonicalPathByRoot[root];
        return canonicalPath == null ? [] : [canonicalPath];
      }),
    ]);
    const projectsByRoot = buildProjectRootIndex(
      projects,
      canonicalPathByRoot,
      host,
      useWslPaths,
    );
    const assignments = n.ca(
      globalState.get(n.iu.THREAD_PROJECT_ASSIGNMENTS),
    );
    const projectlessThreadIds = new Set(
      globalState.get(n.iu.PROJECTLESS_THREAD_IDS) ?? [],
    );
    const affectedIdentities = new Set([...searchRoots].map(identity));

    const uniqueProjectByBasename = new Map();
    for (const project of projectsByRoot.values()) {
      const name = basename(n._l(project.rootPath));
      const current = uniqueProjectByBasename.get(name);
      if (current === undefined) uniqueProjectByBasename.set(name, project);
      else if (current?.projectId !== project.projectId)
        uniqueProjectByBasename.set(name, null);
    }

    const workspaceHints = new Map(
      Object.entries(
        globalState.get(n.iu.THREAD_WORKSPACE_ROOT_HINTS) ?? {},
      ).filter(
        ([threadId, root]) =>
          affectedIdentities.has(identity(root)) &&
          assignments[threadId] == null &&
          !excludedThreadIds.has(threadId) &&
          !projectlessThreadIds.has(threadId),
      ),
    );

    for (const threadIds of chunk([...workspaceHints.keys()], hintReadBatchSize)) {
      const currentRoots = await Promise.all(
        threadIds.map(async (threadId: string) => {
          let thread;
          try {
            thread = await readThread(threadId);
          } catch (error) {
            if (
              !(error instanceof Error) ||
              error.message !== `thread not loaded: ${threadId}`
            )
              throw error;
            thread = null;
          }
          if (thread == null) {
            workspaceHints.delete(threadId);
            return;
          }
          const basenameMatch = uniqueProjectByBasename.get(
            basename(n._l(thread.cwd)),
          );
          const hintedRoot = workspaceHints.get(threadId);
          const hintedProject =
            hintedRoot == null
              ? undefined
              : projectsByRoot.get(n._l(hintedRoot));
          if (
            basenameMatch != null &&
            hintedProject?.projectId !== basenameMatch.projectId
          ) {
            const [threadOrigin, projectOrigin] = await Promise.all([
              thread.gitInfo?.originUrl == null
                ? getGitOriginUrl(thread.cwd)
                : Promise.resolve(thread.gitInfo.originUrl),
              getGitOriginUrl(basenameMatch.rootPath),
            ]);
            if (threadOrigin != null && threadOrigin === projectOrigin) {
              workspaceHints.delete(threadId);
              return;
            }
          }
          return thread.cwd;
        }),
      );
      for (const root of currentRoots) if (root != null) searchRoots.add(root);
    }

    const recoveredAssignments: Record<string, any> = {};
    const recoveredProjectlessIds = [];
    let cursor = null;
    do {
      const page = await listThreads({
        archived: false,
        cursor,
        cwd: [...searchRoots],
        limit: threadListPageSize,
        sourceKinds: n.pa,
        useStateDbOnly: true,
      });
      for (const thread of page.data) {
        if (
          assignments[thread.id] != null ||
          excludedThreadIds.has(thread.id) ||
          projectlessThreadIds.has(thread.id) ||
          (!affectedIdentities.has(identity(thread.cwd)) &&
            !workspaceHints.has(thread.id))
        )
          continue;
        const root = workspaceHints.get(thread.id) ?? thread.cwd;
        const project = projectsByRoot.get(n._l(root));
        if (
          project == null ||
          (canonicalIdentity != null &&
            canonicalIdentity(project.rootPath) !== canonicalIdentity(root))
        ) {
          projectlessThreadIds.add(thread.id);
          recoveredProjectlessIds.push(thread.id);
          continue;
        }
        const assignment = {
          projectKind: "local",
          projectId: project.projectId,
        };
        assignments[thread.id] = assignment;
        recoveredAssignments[n.$u(thread.id)] = assignment;
      }
      cursor = page.nextCursor;
    } while (cursor != null);

    await threadProjectAssignments.assignIfUnassigned([
      ...Object.entries(recoveredAssignments).flatMap(
        ([threadId, assignment]) =>
          assignment == null
            ? []
            : [
                {
                  threadId: n.$u(threadId),
                  assignment,
                  projectless: false,
                },
              ],
      ),
      ...recoveredProjectlessIds.map((threadId) => ({
        threadId: n.$u(threadId),
        assignment: null,
        projectless: true,
      })),
    ]);
  }

  return { assignUnassignedThreadsBeforeRootsChange, buildProjectRootIndex };
}

if (typeof module !== "undefined")
  module.exports = { createThreadMembershipInference };
