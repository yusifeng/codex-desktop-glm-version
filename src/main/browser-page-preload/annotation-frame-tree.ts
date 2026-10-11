type AnnotationFrameTreeDependencies = { getDocument: (windowLike: any) => any; getFrameElements: (documentLike: any) => any[]; getFrameWindow: (frame: any) => any };
function collectAnnotationFrameElements(root: any, deps: { queryAll: (root: any) => any[]; isFrameElement: (value: any) => boolean; getShadowRoot: (value: any) => any }): any[] {
  const frames: any[] = [];
  for (const element of deps.queryAll(root)) { if (deps.isFrameElement(element)) frames.push(element); const shadowRoot = deps.getShadowRoot(element); if (shadowRoot != null) frames.push(...collectAnnotationFrameElements(shadowRoot, deps)); }
  return frames;
}
function collectAnnotationFrameWindows(rootWindow: any, deps: AnnotationFrameTreeDependencies): any[] {
  const windows: any[] = [], pending = [rootWindow], seen = new Set<any>();
  while (pending.length > 0) { const windowLike = pending.pop(); if (windowLike == null || seen.has(windowLike)) continue; seen.add(windowLike); windows.push(windowLike); const documentLike = deps.getDocument(windowLike); if (documentLike == null) continue; for (const frame of deps.getFrameElements(documentLike)) { const childWindow = deps.getFrameWindow(frame); if (childWindow != null) pending.push(childWindow); } }
  return windows;
}
export { collectAnnotationFrameElements, collectAnnotationFrameWindows };
if (typeof module !== `undefined`) module.exports = { collectAnnotationFrameElements, collectAnnotationFrameWindows };
