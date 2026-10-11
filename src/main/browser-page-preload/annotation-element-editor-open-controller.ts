type AnnotationElementEditorOpenDependencies = {
  clearDomInteraction: () => void;
  normalizeAnchor: (element: any, anchor: any, canUseSiteAnnotationApi: boolean, extra: any) => any;
  closePreview: (commentId: string) => void;
  projectDesign: (element: any, anchorState: any, controls: any) => any;
  rememberTarget: (id: string, element: any) => void;
  createTargetMap: (rootHost: any) => Map<any, any>;
  openEditor: (payload: any) => void;
  resetModifier: () => void;
  clearPointer: () => void;
  refreshViewport: () => void;
  setEditorState: (state: any) => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
};

/** Opens a create editor from an element anchor while preserving DOM, preview, IPC, and state cleanup order. */
function createAnnotationElementEditorOpenController(dependencies: AnnotationElementEditorOpenDependencies) {
  let disposed = false;
  const open = (element: any, anchorState: any, extras: any, context: { canUseSiteAnnotationApi: boolean; previewCommentId: string | null; rootHost: any; getAnnotationControls?: (element: any) => any }) => {
    if (disposed) return false;
    dependencies.clearDomInteraction();
    const normalized = { ...anchorState, anchor: dependencies.normalizeAnchor(element, anchorState.anchor, context.canUseSiteAnnotationApi, extras) };
    if (context.previewCommentId != null) dependencies.closePreview(context.previewCommentId);
    const designState = dependencies.projectDesign(element, normalized, context.canUseSiteAnnotationApi ? context.getAnnotationControls?.(element) : undefined);
    if (context.canUseSiteAnnotationApi) dependencies.rememberTarget(designState.id, element);
    dependencies.createTargetMap(context.rootHost).set(designState.id, element);
    dependencies.openEditor({ type: `browser-sidebar-runtime-open-editor`, target: { mode: `create` }, anchorState: normalized, annotationEditorDefault: extras?.annotationEditorDefault, designEditorState: designState, ...extras });
    dependencies.resetModifier();
    dependencies.clearPointer();
    dependencies.refreshViewport();
    dependencies.setEditorState({ target: { mode: `create` }, anchor: { type: `element`, additionalSelections: [], element, themeVariant: normalized.themeVariant, value: normalized.anchor, viewportSize: normalized.viewportSize } });
    dependencies.clearHover();
    dependencies.clearSelectionHover();
    return true;
  };
  const dispose = () => { disposed = true; };
  return { open, dispose };
}

export { createAnnotationElementEditorOpenController };
if (typeof module !== `undefined`) module.exports = { createAnnotationElementEditorOpenController };
