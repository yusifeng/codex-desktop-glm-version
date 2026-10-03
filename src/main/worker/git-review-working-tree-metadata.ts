const METADATA_WORKER_LIMIT = 8;
const UNTRACKED_PATH_BATCH_LIMIT = 256;
const UNTRACKED_PATH_BATCH_BYTES = 16_000;
const NO_INDEX_METADATA_WORKER_LIMIT = 8;

const repositoriesWithoutBatchedNoIndexDiff = new WeakSet<object>();

type GitReviewWorkingTreeMetadataDependencies = {
  byteLength: (value: string) => number;
  createDeferred: () => any;
  createTemporaryDirectory: (
    host: any,
    prefix: string,
    signal: AbortSignal,
  ) => Promise<string>;
  getQueryMeta: () => any;
  normalizePathFromRoot: (
    platformPath: any,
    sourceRoot: string,
    targetRoot: string,
    path: string,
  ) => string;
  queryKey: (root: string, host: any, type: string, ...parts: string[]) => any;
  quoteGitPath: (path: string) => string;
  readWorkingTreeSymlink: (reviewSnapshot: any, path: string) => Promise<any>;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options?: Record<string, unknown>,
  ) => Promise<any>;
  staleTime: number;
};

class ReviewWorkingTreeMetadataBatcher {
  reviewSnapshot: any;
  readPreparedFile: (path: string, prepared: any) => Promise<any>;
  prepareRegularFiles: ((paths: string[]) => Promise<void>) | undefined;
  dependencies: GitReviewWorkingTreeMetadataDependencies;
  pending = new Map<string, any>();
  started = false;
  flushScheduled = false;
  flushing = false;

  constructor(
    reviewSnapshot: any,
    readPreparedFile: (path: string, prepared: any) => Promise<any>,
    prepareRegularFiles: ((paths: string[]) => Promise<void>) | undefined,
    dependencies: GitReviewWorkingTreeMetadataDependencies,
  ) {
    this.reviewSnapshot = reviewSnapshot;
    this.readPreparedFile = readPreparedFile;
    this.prepareRegularFiles = prepareRegularFiles;
    this.dependencies = dependencies;
  }

  read(path: string) {
    let deferred = this.pending.get(path);
    if (deferred == null) {
      deferred = this.dependencies.createDeferred();
      this.pending.set(path, deferred);
    }
    if (this.started) this.scheduleFlush();
    return deferred.promise;
  }

  start() {
    this.started = true;
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (
      this.pending.size === 0 ||
      this.flushScheduled ||
      this.flushing ||
      !this.started
    )
      return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      this.flush();
    });
  }

  async flush() {
    if (this.flushing || this.pending.size === 0) return;
    this.flushing = true;
    const pending = new Map(this.pending);
    this.pending.clear();
    try {
      const metadata = await prepareWorkingTreeMetadataBatch(
        this.reviewSnapshot,
        [...pending.keys()],
        this.readPreparedFile,
        this.prepareRegularFiles,
        this.dependencies,
      );
      for (const [path, deferred] of pending) {
        const result = metadata.get(path);
        if (result == null)
          throw Error(`Missing batched working-tree metadata`);
        deferred.resolve(result);
      }
    } catch (error) {
      for (const deferred of pending.values()) deferred.reject(error);
    } finally {
      this.flushing = false;
      this.scheduleFlush();
    }
  }
}

async function prepareWorkingTreeMetadataBatch(
  reviewSnapshot: any,
  paths: string[],
  readPreparedFile: (path: string, prepared: any) => Promise<any>,
  prepareRegularFiles: ((paths: string[]) => Promise<void>) | undefined,
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  return reviewSnapshot.read(async () => {
    const platformPath = await worktreeRepo.host.platformPath();
    const prepared = new Map<string, any>();
    await runMetadataWorkers(paths, async (path) => {
      const absolutePath = platformPath.join(worktreeRepo.root, path);
      const stat = await worktreeRepo.host.stat(absolutePath, {
        bypassCache: true,
        followSymlinks: false,
      });
      prepared.set(path, { stat });
    });
    const regularFiles = paths.filter((path) => {
      const stat = prepared.get(path)?.stat;
      return stat != null && !stat.isDirectory() && !stat.isSymbolicLink();
    });
    await hashRegularWorkingTreeFiles(
      reviewSnapshot,
      regularFiles,
      prepared,
      dependencies,
    );
    await prepareRegularFiles?.(regularFiles);
    const results = new Map<string, any>();
    await runMetadataWorkers(paths, async (path) => {
      const value = prepared.get(path);
      if (value == null) throw Error(`Missing prepared working-tree file`);
      results.set(path, await readPreparedFile(path, value));
    });
    return results;
  });
}

async function hashRegularWorkingTreeFiles(
  reviewSnapshot: any,
  paths: string[],
  prepared: Map<string, any>,
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  if (paths.length === 0) return;
  const result = await reviewSnapshot.git([`hash-object`, `--stdin-paths`], {
    stdin: `${paths.map(dependencies.quoteGitPath).join(`\n`)}\n`,
  });
  if (!result.success) throw Error(`Failed to hash working-tree files`);
  const output = result.stdout.trim();
  const objectIds = output.length === 0 ? [] : output.split(/\r?\n/);
  if (
    objectIds.length !== paths.length ||
    objectIds.some((objectId: string) =>
      !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(objectId),
    )
  )
    throw Error(`Failed to parse batched working-tree hashes`);
  for (const [index, path] of paths.entries()) {
    const value = prepared.get(path);
    const objectId = objectIds[index];
    if (value == null || objectId == null)
      throw Error(`Missing batched working-tree hash`);
    value.oid = objectId;
  }
}

async function runMetadataWorkers(
  values: string[],
  callback: (value: string) => Promise<void>,
) {
  let index = 0;
  let failed = false;
  let failure: Error | null = null;
  const worker = async () => {
    while (!failed) {
      const value = values[index];
      index += 1;
      if (value == null) return;
      try {
        await callback(value);
      } catch (error) {
        if (!failed) {
          failed = true;
          failure =
            error instanceof Error
              ? error
              : Error(`Review metadata worker failed`, { cause: error });
        }
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(METADATA_WORKER_LIMIT, values.length) }, () =>
      worker(),
    ),
  );
  if (failure != null)
    throw Error(`Review metadata worker failed`, { cause: failure });
}

async function readUntrackedDiffMetadataBatch(
  reviewSnapshot: any,
  paths: string[],
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const metadata = new Map<string, any>();
  if (paths.length === 0) return metadata;
  const batches = chunkUntrackedMetadataPaths(paths, dependencies);
  const { worktreeRepo } = reviewSnapshot;
  const platformPath = await worktreeRepo.host.platformPath();
  let supportsBatching = !repositoriesWithoutBatchedNoIndexDiff.has(worktreeRepo);
  let emptyDirectory: string | null = null;
  try {
    for (const batch of batches) {
      if (!supportsBatching || batch.length === 1) {
        mergeMetadataMaps(
          metadata,
          await readUntrackedDiffMetadataIndividually(
            reviewSnapshot,
            batch,
            dependencies,
          ),
        );
        continue;
      }
      if (emptyDirectory == null)
        try {
          emptyDirectory = await dependencies.createTemporaryDirectory(
            worktreeRepo.host,
            `codex-review-empty-`,
            reviewSnapshot.signal,
          );
        } catch {
          supportsBatching = false;
          mergeMetadataMaps(
            metadata,
            await readUntrackedDiffMetadataIndividually(
              reviewSnapshot,
              batch,
              dependencies,
            ),
          );
          continue;
        }
      const result = await reviewSnapshot.gitDiff(
        [
          `--no-index`,
          `--raw`,
          `--numstat`,
          `-z`,
          `--`,
          emptyDirectory,
          worktreeRepo.root,
          ...batch.map((path) => `:(literal)${path}`),
        ],
        { allowedNonZeroExitCodes: [0, 1], trim: false },
      );
      if (!result.success) {
        if (isUnsupportedBatchedUntrackedDiff(result))
          repositoriesWithoutBatchedNoIndexDiff.add(worktreeRepo);
        supportsBatching = false;
        mergeMetadataMaps(
          metadata,
          await readUntrackedDiffMetadataIndividually(
            reviewSnapshot,
            batch,
            dependencies,
          ),
        );
        continue;
      }
      mergeMetadataMaps(
        metadata,
        parseBatchedUntrackedDiffMetadata(
          result.stdout,
          worktreeRepo.root,
          batch,
          platformPath,
          dependencies,
        ),
      );
    }
  } finally {
    if (emptyDirectory != null)
      await worktreeRepo.host.remove(emptyDirectory, {
        recursive: true,
        force: true,
      });
  }
  return metadata;
}

function mergeMetadataMaps(target: Map<string, any>, source: Map<string, any>) {
  for (const [path, metadata] of source) target.set(path, metadata);
}

async function readUntrackedDiffMetadataIndividually(
  reviewSnapshot: any,
  paths: string[],
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const metadata = new Map<string, any>();
  await runNoIndexMetadataWorkers(paths, async (path) => {
    metadata.set(
      path,
      await readUntrackedDiffMetadata(reviewSnapshot, path),
    );
  });
  return metadata;
}

function chunkUntrackedMetadataPaths(
  paths: string[],
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const batches: string[][] = [];
  let batch: string[] = [];
  let bytes = 0;
  for (const path of paths) {
    const pathBytes = 10 + Math.max(path.length, dependencies.byteLength(path)) + 1;
    if (
      batch.length > 0 &&
      (batch.length >= UNTRACKED_PATH_BATCH_LIMIT ||
        bytes + pathBytes > UNTRACKED_PATH_BATCH_BYTES)
    ) {
      batches.push(batch);
      batch = [];
      bytes = 0;
    }
    batch.push(path);
    bytes += pathBytes;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

function isUnsupportedBatchedUntrackedDiff(result: any) {
  return (
    result.code === 129 &&
    (result.stderr.includes(`Limiting comparison with pathspecs`) ||
      result.stderr.includes(`usage: git diff --no-index`))
  );
}

function parseBatchedUntrackedDiffMetadata(
  output: string,
  root: string,
  paths: string[],
  platformPath: any,
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const expectedPaths = new Set(paths);
  const absolutePaths = new Map(
    paths.map((path) => [
      platformPath.normalize(platformPath.join(root, path)),
      path,
    ]),
  );
  const parsed = new Map<string, any>();
  const resolvePath = (value: string | undefined) => {
    if (value == null) throw Error(`Missing batched untracked Git path`);
    const absolutePath = platformPath.normalize(
      platformPath.isAbsolute(value)
        ? value
        : platformPath.resolve(root, value),
    );
    const path =
      absolutePaths.get(absolutePath) ??
      (platformPath.sep === `\\`
        ? dependencies.normalizePathFromRoot(platformPath, root, root, value)
        : null);
    if (path == null || !expectedPaths.has(path))
      throw Error(`Unexpected batched untracked Git path`);
    let metadata = parsed.get(path);
    if (metadata == null) {
      metadata = {};
      parsed.set(path, metadata);
    }
    return metadata;
  };
  const fields = output.split(`\0`);
  let index = 0;
  while (index < fields.length) {
    if (fields[index] === ``) {
      if (index === fields.length - 1) break;
      throw Error(`Failed to parse batched untracked Git metadata`);
    }
    const mode = /^:\d{6} (\d{6}) [0-9a-f]+ [0-9a-f]+ A$/.exec(
      fields[index],
    )?.[1];
    if (mode != null) {
      const metadata = resolvePath(fields[index + 1]);
      if (metadata.mode != null)
        throw Error(`Duplicate batched untracked Git mode`);
      metadata.mode = mode;
      index += 2;
      continue;
    }
    const stats = /^(-|\d+)\t(-|\d+)\t$/.exec(fields[index]);
    if (
      stats?.[1] == null ||
      stats[2] == null ||
      fields[index + 1] == null
    )
      throw Error(`Failed to parse batched untracked Git stats`);
    const metadata = resolvePath(fields[index + 2]);
    if (metadata.stats != null)
      throw Error(`Duplicate batched untracked Git stats`);
    metadata.stats = {
      additions: stats[1] === `-` ? null : Number.parseInt(stats[1], 10),
      deletions: stats[2] === `-` ? null : Number.parseInt(stats[2], 10),
    };
    index += 3;
  }
  if (index !== fields.length - 1)
    throw Error(`Failed to parse batched untracked Git metadata`);
  const metadata = new Map<string, any>();
  for (const path of paths) {
    const value = parsed.get(path);
    if (value?.mode == null || value.stats == null)
      throw Error(`Missing batched untracked Git metadata`);
    metadata.set(path, { ...value.stats, mode: value.mode });
  }
  return metadata;
}

async function readUntrackedDiffMetadata(reviewSnapshot: any, path: string) {
  const result = await reviewSnapshot.gitDiff(
    [`--no-index`, `--raw`, `--numstat`, `-z`, `--`, `/dev/null`, path],
    { allowedNonZeroExitCodes: [0, 1], trim: false },
  );
  if (!result.success) throw Error(`Failed to read untracked Git metadata`);
  return parseUntrackedDiffMetadata(result.stdout);
}

function parseUntrackedDiffMetadata(output: string) {
  const fields = output.split(`\0`);
  const mode = fields
    .map((field) =>
      /^:\d{6} (\d{6}) [0-9a-f]+ [0-9a-f]+ A$/.exec(field)?.[1],
    )
    .find((value) => value != null);
  const stats = fields
    .map((field) => /^(-|\d+)\t(-|\d+)\t/s.exec(field))
    .find((value) => value != null);
  if (mode == null || stats?.[1] == null || stats[2] == null)
    throw Error(`Failed to parse untracked Git metadata`);
  return {
    additions: stats[1] === `-` ? null : Number.parseInt(stats[1], 10),
    deletions: stats[2] === `-` ? null : Number.parseInt(stats[2], 10),
    mode,
  };
}

async function runNoIndexMetadataWorkers(
  values: string[],
  callback: (value: string) => Promise<void>,
) {
  let index = 0;
  let failed = false;
  let failure: Error | null = null;
  const worker = async () => {
    while (!failed) {
      const value = values[index];
      index += 1;
      if (value == null) return;
      try {
        await callback(value);
      } catch (error) {
        if (!failed) {
          failed = true;
          failure =
            error instanceof Error
              ? error
              : Error(`Review no-index metadata worker failed`, {
                  cause: error,
                });
        }
      }
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(NO_INDEX_METADATA_WORKER_LIMIT, values.length) },
      () => worker(),
    ),
  );
  if (failure != null)
    throw Error(`Review no-index metadata worker failed`, { cause: failure });
}

async function getReviewWorkingTreeMetadata(
  reviewSnapshot: any,
  paths: string[],
  { includeDiffMetadata = false }: any = {},
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const diffMetadata = new Map<string, any>();
  const batcher = new ReviewWorkingTreeMetadataBatcher(
    reviewSnapshot,
    (path, prepared) =>
      readPreparedWorkingTreeFile(
        reviewSnapshot,
        path,
        prepared,
        includeDiffMetadata,
        diffMetadata.get(path) ?? null,
        dependencies,
      ),
    includeDiffMetadata
      ? async (regularFiles) => {
          const metadata = await readUntrackedDiffMetadataBatch(
            reviewSnapshot,
            regularFiles,
            dependencies,
          );
          for (const [path, value] of metadata) diffMetadata.set(path, value);
        }
      : undefined,
    dependencies,
  );
  const pending = paths.map((path) =>
    fetchReviewWorkingTreeFileMetadata(
      reviewSnapshot,
      path,
      includeDiffMetadata,
      batcher,
      dependencies,
    ).then((metadata) => [path, metadata] as const),
  );
  batcher.start();
  try {
    return new Map(await Promise.all(pending));
  } catch {
    return null;
  }
}

function fetchReviewWorkingTreeFileMetadata(
  reviewSnapshot: any,
  path: string,
  includeDiffMetadata: boolean,
  batcher: ReviewWorkingTreeMetadataBatcher,
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  return worktreeRepo.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      worktreeRepo.root,
      worktreeRepo.host,
      `review-working-tree-file-metadata`,
      includeDiffMetadata ? `with-diff` : `identity-only`,
      path,
      `${worktreeRepo.getReviewWorkingTreeFileGeneration(path)}`,
    ),
    meta: {
      ...dependencies.getQueryMeta(),
      gitReadPaths: worktreeRepo.getReviewWorkingTreeFileReadPaths(path),
    },
    queryFn: () => batcher.read(path),
    staleTime: dependencies.staleTime,
  });
}

async function readPreparedWorkingTreeFile(
  reviewSnapshot: any,
  path: string,
  prepared: any,
  includeDiffMetadata: boolean,
  diffMetadata: any,
  dependencies: GitReviewWorkingTreeMetadataDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  if (prepared.stat.isDirectory()) {
    const result = await dependencies.runGit(
      (await worktreeRepo.host.platformPath()).join(worktreeRepo.root, path),
      [`rev-parse`, `--verify`, `HEAD^{commit}`],
      worktreeRepo.host,
      { signal: reviewSnapshot.signal },
    );
    if (!result.success) throw Error(`Failed to read embedded repository HEAD`);
    return {
      additions: 1,
      deletions: 0,
      mode: `160000`,
      oid: result.stdout.trim(),
    };
  }
  if (prepared.stat.isSymbolicLink()) {
    const result = await dependencies.readWorkingTreeSymlink(
      reviewSnapshot,
      path,
    );
    return {
      additions:
        result.target.split(`\n`).length -
        1 +
        Number(result.target.length > 0 && !result.target.endsWith(`\n`)),
      deletions: 0,
      mode: `120000`,
      oid: result.oid,
    };
  }
  if (prepared.oid == null) throw Error(`Missing working-tree file hash`);
  if (includeDiffMetadata && diffMetadata == null)
    throw Error(`Missing working-tree diff metadata`);
  return {
    additions: diffMetadata?.additions ?? null,
    deletions: diffMetadata?.deletions ?? null,
    mode: diffMetadata?.mode ?? null,
    oid: prepared.oid,
  };
}

export {
  ReviewWorkingTreeMetadataBatcher,
  chunkUntrackedMetadataPaths,
  fetchReviewWorkingTreeFileMetadata,
  getReviewWorkingTreeMetadata,
  hashRegularWorkingTreeFiles,
  isUnsupportedBatchedUntrackedDiff,
  mergeMetadataMaps,
  parseBatchedUntrackedDiffMetadata,
  parseUntrackedDiffMetadata,
  prepareWorkingTreeMetadataBatch,
  readPreparedWorkingTreeFile,
  readUntrackedDiffMetadata,
  readUntrackedDiffMetadataBatch,
  readUntrackedDiffMetadataIndividually,
  runMetadataWorkers,
  runNoIndexMetadataWorkers,
};

if (typeof module !== `undefined`)
  module.exports = {
    ReviewWorkingTreeMetadataBatcher,
    chunkUntrackedMetadataPaths,
    fetchReviewWorkingTreeFileMetadata,
    getReviewWorkingTreeMetadata,
    hashRegularWorkingTreeFiles,
    isUnsupportedBatchedUntrackedDiff,
    mergeMetadataMaps,
    parseBatchedUntrackedDiffMetadata,
    parseUntrackedDiffMetadata,
    prepareWorkingTreeMetadataBatch,
    readPreparedWorkingTreeFile,
    readUntrackedDiffMetadata,
    readUntrackedDiffMetadataBatch,
    readUntrackedDiffMetadataIndividually,
    runMetadataWorkers,
    runNoIndexMetadataWorkers,
  };
