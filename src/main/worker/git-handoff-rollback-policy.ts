/** Pure rollback error aggregation policy. */

export function collectRestoreBranchStashErrors(
  branch: string | null | undefined,
  restoreBranchError: string,
  stashRef: string | null | undefined,
  restoreStashError: string,
  checkoutStatus: string | null | undefined,
  stashStatus: string | null | undefined,
) {
  const errors: string[] = [];
  if (branch == null) {
    errors.push(restoreBranchError);
    return errors;
  }
  if (checkoutStatus === `error`) errors.push(restoreBranchError);
  if (stashRef != null && stashStatus === `error`) errors.push(restoreStashError);
  return errors;
}

if (typeof module !== `undefined`) module.exports = { collectRestoreBranchStashErrors };
