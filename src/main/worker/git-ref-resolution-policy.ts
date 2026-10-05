/** Pure Git object-id validation and output normalization policy. */

export function isGitObjectId(value: string) {
  return /^[0-9a-f]{7,40}$/i.test(value);
}

export function normalizeGitObjectIdOutput(stdout: string) {
  const sha = stdout.trim();
  return sha.length === 0 ? null : isGitObjectId(sha) ? sha : undefined;
}

if (typeof module !== `undefined`)
  module.exports = { isGitObjectId, normalizeGitObjectIdOutput };
