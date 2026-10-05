/** Pure managed worktree naming and marker policy. */

export const worktreeNameMarker = `.codex-worktree-name`;
const legacyParentPattern = /^[0-9a-f]{4}$/i;
const legacyChildPattern = /^\d{6}-\d{4}-[0-9a-f]{8}$/i;
const namedParentPattern = /^(?![0-9a-f]{4,}$)(?!(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isLegacyWorktreeParentName(name: string) { return legacyParentPattern.test(name); }
export function isLegacyWorktreeChildName(name: string) { return legacyChildPattern.test(name); }
export function isNamedWorktreeParentName(name: string) { return name.length >= 1 && name.length <= 64 && namedParentPattern.test(name); }

if (typeof module !== `undefined`) module.exports = { isLegacyWorktreeChildName, isLegacyWorktreeParentName, isNamedWorktreeParentName, worktreeNameMarker };
