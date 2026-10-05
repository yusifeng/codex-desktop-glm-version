/** Pure checkpoint/ref naming and selection policy for turn diff capture. */

const captureRefPrefix = `refs/codex/turn-diffs/captures`;
const checkpointRefPrefix = `refs/codex/turn-diffs/checkpoints`;

const buildCaptureRefPrefix = (nowMs: number, id: string) =>
  `${captureRefPrefix}/${nowMs}/${id}`;

const buildCheckpointScopeRefPrefix = (scopeHash: string) =>
  `${checkpointRefPrefix}/${scopeHash}`;

const buildCheckpointRefPrefix = (scopeHash: string, turnHash: string) =>
  `${buildCheckpointScopeRefPrefix(scopeHash)}/${turnHash}`;

const checkpointRefTimestamp = (ref: string, refPrefix: string) => {
  const remainder = ref.startsWith(`${refPrefix}/`)
    ? ref.slice(refPrefix.length + 1)
    : ref;
  const numericSegments = remainder
    .split(`/`)
    .map((segment) => Number(segment))
    .filter((segment) => Number.isSafeInteger(segment));
  return numericSegments.at(-1) ?? null;
};

const selectLatestCheckpoint = (params: {
  output: string;
  refPrefix: string;
  nowMs: number;
  ttlMs: number;
  normalizeTreeSha: (sha: string) => string;
}) => {
  let found: string | null = null;
  let latest = -Infinity;
  for (const line of params.output.split(`\n`)) {
    const separator = line.indexOf(` `);
    if (separator < 0) continue;
    const ref = line.slice(0, separator);
    const sha = line.slice(separator + 1).trim();
    const createdAt = checkpointRefTimestamp(ref, params.refPrefix);
    if (
      sha !== `` &&
      createdAt != null &&
      createdAt > latest &&
      params.nowMs - createdAt <= params.ttlMs
    ) {
      found = params.normalizeTreeSha(sha);
      latest = createdAt;
    }
  }
  return found;
};

const isRefStale = (params: {
  ref: string;
  refPrefix: string;
  nowMs: number;
  ttlMs: number;
}) => {
  const createdAt = checkpointRefTimestamp(params.ref, params.refPrefix);
  return createdAt != null && params.nowMs - createdAt > params.ttlMs;
};

export {
  buildCaptureRefPrefix,
  buildCheckpointRefPrefix,
  buildCheckpointScopeRefPrefix,
  captureRefPrefix,
  checkpointRefPrefix,
  checkpointRefTimestamp,
  isRefStale,
  selectLatestCheckpoint,
};
if (typeof module !== `undefined`)
  module.exports = {
    buildCaptureRefPrefix,
    buildCheckpointRefPrefix,
    buildCheckpointScopeRefPrefix,
    captureRefPrefix,
    checkpointRefPrefix,
    checkpointRefTimestamp,
    isRefStale,
    selectLatestCheckpoint,
  };
