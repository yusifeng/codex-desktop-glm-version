type AnnotationVirtualSelectionEditorDependencies = {
  clearDomInteraction: () => void;
  closePreview: (commentId: string) => void;
  projectAnchor: (text: string, zoom: number) => any;
  projectDesign: (element: any, anchorState: any, controls: any) => any;
  rememberTarget: (id: string, element: any) => void;
  resetModifier: () => void;
  clearPointer: () => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
  setEditorState: (state: any) => void;
  openEditor: (payload: any) => void;
};

/** Opens a create editor from a selected virtual/text anchor while preserving interaction cleanup order. */
function createAnnotationVirtualSelectionEditorController(dependencies: AnnotationVirtualSelectionEditorDependencies) {
  let disposed = false;
  const open = (
    text: string,
    element: any,
    context: { editorOpen: boolean; previewCommentId: string | null; zoom: number; canUseTweaks: boolean; getAnnotationControls?: (element: any) => any },
  ) => {
    if (disposed) return false;
    if (context.editorOpen) {
      dependencies.clearDomInteraction();
      return false;
    }
    if (context.previewCommentId != null) dependencies.closePreview(context.previewCommentId);
    const anchorState = dependencies.projectAnchor(text, context.zoom);
    const designState = context.canUseTweaks && context.getAnnotationControls != null
      ? (() => {
          const controls = context.getAnnotationControls!(element);
          return controls?.controls.length ? dependencies.projectDesign(element, anchorState, controls) : undefined;
        })()
      : undefined;
    if (designState != null) dependencies.rememberTarget(designState.id, element);
    dependencies.resetModifier();
    dependencies.clearPointer();
    dependencies.clearHover();
    dependencies.clearSelectionHover();
    dependencies.setEditorState({ target: { mode: `create` }, anchor: { type: `virtual`, additionalSelections: [], value: text, themeVariant: anchorState.themeVariant, viewportSize: anchorState.viewportSize } });
    dependencies.openEditor({ type: `browser-sidebar-runtime-open-editor`, target: { mode: `create` }, anchorState, designEditorState: designState, wantsScreenshot: !0 });
    return true;
  };
  const dispose = () => { disposed = true; };
  return { open, dispose };
}

export { createAnnotationVirtualSelectionEditorController };
if (typeof module !== `undefined`) module.exports = { createAnnotationVirtualSelectionEditorController };
