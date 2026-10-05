/** Pure branch-search normalization, ref parsing, and Git ref-pattern policy. */
export function normalizeGitBranchSearchText(value: string) { return value.toLowerCase().replace(/[-_/\.\s]+/g, ` `).trim(); }
export function buildGitBranchSearchRefPatterns(refPattern: string, terms: string[]) {
  if (refPattern === `refs/heads`) return [refPattern];
  const anchor = [...terms].filter((term) => term.length >= 2 && /^[a-z0-9]+$/.test(term)).sort((left, right) => right.length - left.length)[0];
  if (anchor == null) return [refPattern];
  const insensitiveAnchor = Array.from(anchor, (character) => character === `k` ? `[kKK]` : character >= `a` && character <= `z` ? `[${character}${character.toUpperCase()}]` : character).join(``);
  return [`${refPattern}/**/*${insensitiveAnchor}*`, `${refPattern}/**/*${insensitiveAnchor}*/**`];
}
export function parseGitBranchSearchRef(ref: string, preserveRemoteRefs: boolean) {
  if (ref.startsWith(`refs/heads/`)) return ref.slice(11);
  if (!ref.startsWith(`refs/remotes/`)) return null;
  const remoteRef = ref.slice(13); const separator = remoteRef.indexOf(`/`);
  if (separator < 0 || separator === remoteRef.length - 1) return null;
  const branch = remoteRef.slice(separator + 1); if (branch === `HEAD`) return null;
  return preserveRemoteRefs ? ref : branch;
}
export function stripGitRemoteRefPrefix(ref: string) { return ref.startsWith(`refs/remotes/`) ? ref.slice(13) : ref; }
export function gitBranchNameFromRef(ref: string) { const stripped = stripGitRemoteRefPrefix(ref); return ref.startsWith(`refs/remotes/`) ? stripped.slice(stripped.indexOf(`/`) + 1) : stripped; }
if (typeof module !== `undefined`) module.exports = { buildGitBranchSearchRefPatterns, gitBranchNameFromRef, normalizeGitBranchSearchText, parseGitBranchSearchRef, stripGitRemoteRefPrefix };
