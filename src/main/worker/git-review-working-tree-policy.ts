const UNTRACKED_PATH_BATCH_LIMIT = 256;
const UNTRACKED_PATH_BATCH_BYTES = 16_000;

type PathPolicyDependencies = {
  byteLength: (value: string) => number;
};

function chunkUntrackedMetadataPaths(
  paths: string[],
  dependencies: PathPolicyDependencies,
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

export {
  UNTRACKED_PATH_BATCH_BYTES,
  UNTRACKED_PATH_BATCH_LIMIT,
  chunkUntrackedMetadataPaths,
  isUnsupportedBatchedUntrackedDiff,
};

if (typeof module !== `undefined`)
  module.exports = {
    UNTRACKED_PATH_BATCH_BYTES,
    UNTRACKED_PATH_BATCH_LIMIT,
    chunkUntrackedMetadataPaths,
    isUnsupportedBatchedUntrackedDiff,
  };
