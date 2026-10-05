/** Pure startup gates for the annotation preload page-bound lifecycle. */

function shouldSyncAnnotationPolicy(globalLike: any, windowLike: any): boolean {
  return globalLike?.isSecureContext === true && windowLike === windowLike?.top;
}

function shouldDeferAnnotationMount(documentLike: any): boolean {
  return documentLike?.readyState === `loading`;
}

export { shouldDeferAnnotationMount, shouldSyncAnnotationPolicy };
if (typeof module !== `undefined`) module.exports = { shouldDeferAnnotationMount, shouldSyncAnnotationPolicy };
