type AnnotationCreateAnchorUpdateDependencies = {
  cancelEditor: (target: any) => void;
  resetModifier: () => void;
  clearPointer: () => void;
  clearTransient: () => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
  mergeAnchor: (anchor: any, selection: any, index: any) => any;
  serializeAnchorState: (editorState: any, zoom: number, viewportScale: number) => any;
  updateAnchor: (target: any, anchorState: any) => void;
  refreshViewport: () => void;
  setSelectionHover: (value: any) => void;
  setEditorState: (state: any) => void;
};

/** Applies create-editor anchor updates or cancellation while preserving IPC and state cleanup order. */
function createAnnotationCreateAnchorUpdateController(dependencies: AnnotationCreateAnchorUpdateDependencies) {
  let disposed = false;
  const update = (
    editorState: any,
    selection: any,
    selectionIndex: any,
    context: { multiSelectEnabled: boolean; zoom: number; viewportScale: number },
  ) => {
    if (disposed || editorState?.target?.mode !== `create` || editorState.anchor?.type === `text`) return false;
    if (selection == null) {
      dependencies.cancelEditor(editorState.target);
      dependencies.resetModifier();
      dependencies.clearPointer();
      dependencies.clearTransient();
      dependencies.clearHover();
      dependencies.clearSelectionHover();
      return true;
    }
    if (!context.multiSelectEnabled && selection.additional.length > 0) return false;
    const nextState = { ...editorState, anchor: dependencies.mergeAnchor(editorState.anchor, selection, selectionIndex) };
    dependencies.updateAnchor(nextState.target, dependencies.serializeAnchorState(nextState, context.zoom, context.viewportScale));
    dependencies.refreshViewport();
    dependencies.setSelectionHover(null);
    dependencies.setEditorState(nextState);
    return true;
  };
  const dispose = () => { disposed = true; };
  return { update, dispose };
}

export { createAnnotationCreateAnchorUpdateController };
if (typeof module !== `undefined`) module.exports = { createAnnotationCreateAnchorUpdateController };
