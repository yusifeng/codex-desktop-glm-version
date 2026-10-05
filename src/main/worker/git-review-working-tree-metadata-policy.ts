/** Pure parsing and path-validation policy for working-tree diff metadata. */

type PlatformPath = {
  normalize: (value: string) => string;
  isAbsolute: (value: string) => boolean;
  resolve: (root: string, value: string) => string;
  join: (root: string, value: string) => string;
  sep: string;
};

type PathPolicyDependencies = {
  normalizePathFromRoot: (
    platformPath: PlatformPath,
    sourceRoot: string,
    targetRoot: string,
    path: string,
  ) => string;
};

function parseBatchedUntrackedDiffMetadata(
  output: string,
  root: string,
  paths: string[],
  platformPath: PlatformPath,
  dependencies: PathPolicyDependencies,
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

export { parseBatchedUntrackedDiffMetadata, parseUntrackedDiffMetadata };

if (typeof module !== `undefined`)
  module.exports = { parseBatchedUntrackedDiffMetadata, parseUntrackedDiffMetadata };
