export async function dispatchReviewReadRequest(method: string, params: any, deps: any): Promise<any> {
  switch (method) {
    case `status-summary`: return deps.statusSummary(params);
    case `branch-diff-stats`: return deps.branchDiffStats(params);
    case `review-summary`: return deps.reviewSummary(params);
    case `review-source-line-counts`: return deps.reviewSourceLineCounts(params);
    case `review-diff`: return deps.reviewDiff(params);
    case `review-search`: return deps.reviewSearch(params);
    case `review-patch`: return deps.reviewPatch(params);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchReviewReadRequest };
