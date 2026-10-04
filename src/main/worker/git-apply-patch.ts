type ApplyPatchDependencies = {
  copyIndexToTemporaryDirectory: (directory: string, context: any, host: any) => Promise<string>;
  createLogger: (tag: string) => any;
  createTemporaryDirectory: (
    host: any,
    prefix: string,
    signal?: AbortSignal,
  ) => Promise<string>;
  formatExecOutput: (params: any) => any;
  getIndexContext: (repository: any, signal?: AbortSignal) => Promise<any>;
  normalizeCwd: (cwd: string) => string;
  normalizePatchPath: (pathApi: any, root: string, base: string, path: string) => string;
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
};

function parseApplyPatchResult(stdout: string, stderr: string) {
  const applied = new Set<string>();
  const skipped = new Set<string>();
  const conflicted = new Set<string>();
  let currentPath: string | null = null;
  const output = [stdout, stderr].filter(Boolean).join(`\n`);
  const addPath = (paths: Set<string>, value: string | undefined | null) => {
    let path = (value ?? ``).trim();
    if (!path) return;
    const first = path.charAt(0);
    const last = path.charAt(path.length - 1);
    if ((first === `'` || first === `"`) && last === first && path.length >= 2)
      path = path.slice(1, -1);
    if (path) paths.add(path);
  };
  const firstGroup = (groups: Record<string, string>, names: string[]) => {
    for (const name of names) if (groups[name]) return groups[name];
  };
  const appliedPattern = /^(?:Applied patch(?: to)?\s+(?:(["'])(?<qpath>.+?)\1|(?<path>.+?))\s+cleanly\.?)$/i;
  const conflictPattern = /^(?:Applied patch(?: to)?\s+(?:(["'])(?<qpath>.+?)\1|(?<path>.+?))\s+with conflicts\.?)$/i;
  const rejectsPattern = /^(?:Applying patch\s+(?:(["'])(?<qpath>.+?)\1|(?<path>.+?))\s+with\s+\d+\s+rejects?\.{0,3})$/i;
  const checkingPattern = /^(?:Checking patch\s+(?:(["'])(?<qpath>.+?)\1|(?<path>.+?))\.\.\.)$/i;
  const mergePattern = /^(?:Performing three-way merge|Falling back to three-way merge)\.\.\.$/i;
  const mergeFailurePattern = /^Failed to perform three-way merge\.\.\.$/i;
  const directFallbackPattern = /^Falling back to direct application\.\.\.$/i;
  const unmergedPattern = /^U\s+(?<path>.+)$/;
  const patchFailurePattern = /^error:\s+patch failed:\s+(?<path>.+?)(?::\d+)?(?:\s|$)/i;
  const doesNotApplyPattern = /^error:\s+(?<path>.+?):\s+patch does not apply$/i;
  const missingBlobPattern = /^(?:error: )?repository lacks the necessary blob to (?:perform|fall back on) 3-?way merge\.?$/i;
  const mismatchPattern = /^error:\s+(?<path>.+?):\s+does not match index\b/i;
  const missingIndexPattern = /^error:\s+(?<path>.+?):\s+does not exist in index\b/i;
  const alreadyExistsPattern = /^error:\s+(?<path>.+?)\s+already exists in (?:the )?working directory\b/i;
  const fileExistsPattern = /^error:\s+patch failed:\s+(?<path>.+?)\s+File exists/i;
  const renamedPattern = /^error:\s+path\s+(?<path>.+?)\s+has been renamed\/deleted/i;
  const incompleteBinaryPattern = /^error:\s+cannot apply binary patch to\s+['"]?(?<path>.+?)['"]?\s+without full index line$/i;
  const binaryMismatchPattern = /^error:\s+binary patch does not apply to\s+['"]?(?<path>.+?)['"]?$/i;
  const binaryResultPattern = /^error:\s+binary patch to\s+['"]?(?<path>.+?)['"]?\s+creates incorrect result\b/i;
  const readFailurePattern = /^error:\s+cannot read the current contents of\s+['"]?(?<path>.+?)['"]?$/i;
  const skippedPattern = /^Skipped patch\s+['"]?(?<path>.+?)['"]\.$/i;
  const binaryConflictPattern = /^warning:\s*Cannot merge binary files:\s+(?<path>.+?)\s+\(ours\s+vs\.\s+theirs\)/i;
  for (const line of output.split(/\r?\n/)) {
    const text = line.trim();
    if (!text) continue;
    let match;
    if ((match = text.match(appliedPattern))) {
      const path = firstGroup(match.groups ?? {}, [`qpath`, `path`]);
      addPath(applied, path);
      currentPath = path ?? currentPath;
      conflicted.delete(path ?? ``);
      skipped.delete(path ?? ``);
      continue;
    }
    if ((match = text.match(conflictPattern)) || (match = text.match(rejectsPattern))) {
      const path = firstGroup(match.groups ?? {}, [`qpath`, `path`]);
      addPath(conflicted, path);
      currentPath = path ?? currentPath;
      applied.delete(path ?? ``);
      skipped.delete(path ?? ``);
      continue;
    }
    if ((match = text.match(unmergedPattern))) {
      addPath(conflicted, match.groups?.path);
      currentPath = match.groups?.path ?? currentPath;
      applied.delete(match.groups?.path ?? ``);
      skipped.delete(match.groups?.path ?? ``);
      continue;
    }
    if ((match = text.match(checkingPattern))) {
      currentPath = firstGroup(match.groups ?? {}, [`qpath`, `path`]) ?? currentPath;
      continue;
    }
    if ((match = text.match(patchFailurePattern)) || (match = text.match(doesNotApplyPattern))) {
      addPath(skipped, match.groups?.path);
      currentPath = match.groups?.path ?? currentPath;
      continue;
    }
    if (!(mergePattern.test(text) || directFallbackPattern.test(text))) {
      if (mergeFailurePattern.test(text) || missingBlobPattern.test(text)) {
        if (currentPath) {
          addPath(skipped, currentPath);
          applied.delete(currentPath);
          conflicted.delete(currentPath);
        }
        continue;
      }
      if (
        (match = text.match(mismatchPattern)) ||
        (match = text.match(missingIndexPattern)) ||
        (match = text.match(alreadyExistsPattern)) ||
        (match = text.match(fileExistsPattern)) ||
        (match = text.match(renamedPattern)) ||
        (match = text.match(incompleteBinaryPattern)) ||
        (match = text.match(binaryMismatchPattern)) ||
        (match = text.match(binaryResultPattern)) ||
        (match = text.match(readFailurePattern)) ||
        (match = text.match(skippedPattern))
      ) {
        addPath(skipped, match.groups?.path);
        currentPath = match.groups?.path ?? currentPath;
        applied.delete(match.groups?.path ?? ``);
        conflicted.delete(match.groups?.path ?? ``);
        continue;
      }
      if ((match = text.match(binaryConflictPattern))) {
        addPath(conflicted, match.groups?.path);
        currentPath = match.groups?.path ?? currentPath;
        applied.delete(match.groups?.path ?? ``);
        skipped.delete(match.groups?.path ?? ``);
      }
    }
  }
  for (const path of conflicted) {
    applied.delete(path);
    skipped.delete(path);
  }
  for (const path of applied) skipped.delete(path);
  return {
    appliedPaths: Array.from(applied).sort(),
    skippedPaths: Array.from(skipped).sort(),
    conflictedPaths: Array.from(conflicted).sort(),
  };
}

function parsePatchPaths(diff: string) {
  const paths = new Set<string>();
  const pattern = /^diff --git a\/(.*?) b\/(.*)$/gm;
  let match;
  while ((match = pattern.exec(diff)) != null) {
    const [, oldPath, newPath] = match;
    if (oldPath && oldPath !== `/dev/null`) paths.add(oldPath);
    if (newPath && newPath !== `/dev/null`) paths.add(newPath);
  }
  return Array.from(paths);
}

async function pathExists(path: string, host: any, signal?: AbortSignal) {
  signal?.throwIfAborted();
  try {
    await host.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function stageExistingPatchPaths(
  root: string,
  diff: string,
  host: any,
  {
    env,
    gitConfigOverrides = [],
    signal,
  }: { env?: any; gitConfigOverrides?: string[]; signal?: AbortSignal },
  dependencies: ApplyPatchDependencies,
) {
  const paths = parsePatchPaths(diff);
  if (paths.length === 0) return;
  const existing: string[] = [];
  const pathApi = await host.platformPath();
  await Promise.all(
    paths.map(async (path) => {
      const normalized = dependencies.normalizePatchPath(pathApi, root, root, path);
      if (await pathExists(pathApi.join(root, normalized), host, signal)) existing.push(normalized);
    }),
  );
  if (existing.length === 0) return;
  if (signal?.aborted) throw Error(`Apply patch canceled`);
  await dependencies.runGit(root, [`add`, `--`, ...existing], host, {
    configOverrides: gitConfigOverrides,
    env,
    signal,
  });
}

async function applyPatch(
  params: any,
  gitManager: any,
  host: any,
  {
    gitConfigOverrides = [],
    signal,
  }: { gitConfigOverrides?: string[]; signal?: AbortSignal } = {},
  dependencies: ApplyPatchDependencies,
) {
  const {
    cwd,
    env: originalEnvironment,
    diff,
    atomic,
    revert,
    target = `unstaged`,
    allowBinary,
  } = params;
  const logger = dependencies.createLogger(`applyPatch`);
  const normalizedCwd = dependencies.normalizeCwd(cwd);
  let repository = await gitManager.getWorktreeRepository(normalizedCwd, host);
  if (!repository) {
    gitManager.invalidateStableMetadata();
    repository = await gitManager.getWorktreeRepository(normalizedCwd, host);
  }
  if (!repository)
    return {
      status: `error`,
      appliedPaths: [],
      skippedPaths: [],
      conflictedPaths: [],
      errorCode: `not-git-repo`,
    };
  const root = repository.root;
  if (signal?.aborted)
    return { status: `error`, appliedPaths: [], skippedPaths: [], conflictedPaths: [] };
  const temporaryDirectory = await dependencies.createTemporaryDirectory(
    host,
    `codex-apply-`,
    signal,
  );
  const patchPath = (await host.platformPath()).join(temporaryDirectory, `patch.diff`);
  await host.writeFile(patchPath, diff, { signal });
  try {
    let environment = originalEnvironment;
    if (target === `unstaged` && !atomic) {
      const indexContext = await dependencies.getIndexContext(repository, signal);
      if (!indexContext)
        logger.warning(`[applyPatch] Unable to resolve git index path; applying without temp index`);
      else {
        const temporaryIndex = await dependencies.copyIndexToTemporaryDirectory(
          temporaryDirectory,
          indexContext,
          host,
        );
        environment = { ...originalEnvironment, GIT_INDEX_FILE: temporaryIndex };
        await stageExistingPatchPaths(
          root,
          diff,
          host,
          { env: environment, gitConfigOverrides, signal },
          dependencies,
        );
      }
    }
    const args = [`apply`];
    if (revert) args.push(`-R`);
    if (allowBinary) args.push(`--binary`);
    if (!atomic) args.push(`--3way`);
    if (target === `staged`) args.push(`--cached`);
    else if (target === `staged-and-unstaged`) args.push(`--index`);
    args.push(patchPath);
    const result = await dependencies.runGit(root, args, host, {
      configOverrides: gitConfigOverrides,
      env: environment,
      signal,
      allowedNonZeroExitCodes: [1],
    });
    const parsed = parseApplyPatchResult(result.stdout, result.stderr);
    logger.debug(`ApplyPatch result metadata`, {
      safe: {
        revert,
        target,
        code: result.code,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length,
        appliedCount: parsed.appliedPaths.length,
        skippedCount: parsed.skippedPaths.length,
        conflictedCount: parsed.conflictedPaths.length,
      },
      sensitive: {},
    });
    return {
      status:
        signal?.aborted || result.code == null
          ? `error`
          : result.code === 0
            ? `success`
            : result.code === 1 && !atomic
              ? `partial-success`
              : `error`,
      ...parsed,
      execOutput: dependencies.formatExecOutput({
        command: args.join(` `),
        stdout: result.stdout,
        stderr: result.stderr,
      }),
    };
  } finally {
    await host.remove(temporaryDirectory, { recursive: true, force: true });
  }
}

export { applyPatch, parseApplyPatchResult, parsePatchPaths, pathExists, stageExistingPatchPaths };
if (typeof module !== `undefined`)
  module.exports = {
    applyPatch,
    parseApplyPatchResult,
    parsePatchPaths,
    pathExists,
    stageExistingPatchPaths,
  };
