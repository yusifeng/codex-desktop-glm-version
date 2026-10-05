/** Pure parsing and formatting policy for Git repository size checks. */

export const MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES = 200 * 1024 * 1024;

export function formatByteSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = [`KB`, `MB`, `GB`, `TB`];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export function parseCountObjects(output: string) {
  const values = new Map<string, number>();
  for (const line of output.split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry) continue;
    const [key, rawValue] = entry.split(`:`);
    if (!key || rawValue == null) continue;
    const value = Number.parseInt(rawValue.trim(), 10);
    if (Number.isFinite(value)) values.set(key, value);
  }
  return values;
}

export function repositorySizeBytes(output: string) {
  const values = parseCountObjects(output);
  return ((values.get(`size`) ?? 0) + (values.get(`size-pack`) ?? 0)) * 1024;
}

export function repositorySizeError(bytes: number, maximumBytes: number) {
  return Error(
    `Repository is too large (${formatByteSize(bytes)}). Maximum allowed size is ${formatByteSize(maximumBytes)}.`,
  );
}

if (typeof module !== `undefined`)
  module.exports = {
    MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES,
    formatByteSize,
    parseCountObjects,
    repositorySizeBytes,
    repositorySizeError,
  };
