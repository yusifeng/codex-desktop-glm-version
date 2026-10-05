/** Pure review-patch response projection policy. */

export function unknownReviewPatchDiff() {
  return { type: `error`, error: { type: `unknown` } };
}

export function buildReviewPatchSuccess(
  source: string,
  unifiedDiff: string,
  unifiedDiffBytes: number,
) {
  return { source, diff: { type: `success`, unifiedDiff, unifiedDiffBytes } };
}

export function buildReviewPatchError(source: string, error: any) {
  return { source, diff: { type: `error`, error } };
}

if (typeof module !== `undefined`)
  module.exports = { buildReviewPatchError, buildReviewPatchSuccess, unknownReviewPatchDiff };
