export async function dispatchGitApplyRequest(method: string, params: any, deps: any): Promise<any> {
  switch (method) {
    case `apply-changes`: return deps.applyChanges(params);
    case `apply-patch`: return deps.applyPatch(params);
    case `apply-review-section-changes`: return deps.applyReviewSectionChanges(params);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchGitApplyRequest };
