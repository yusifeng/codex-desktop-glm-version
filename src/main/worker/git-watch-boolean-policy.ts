/** Pure tri-state boolean aggregation for watcher readiness/recovery. */
export function combineGitWatchOptionalBooleans(values: Array<boolean | null | undefined>): boolean | null {
  return values.some((value) => value === true) ? true : values.some((value) => value == null) ? null : false;
}
if (typeof module !== "undefined") module.exports = { combineGitWatchOptionalBooleans };
