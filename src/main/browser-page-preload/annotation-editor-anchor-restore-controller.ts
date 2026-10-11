type AnnotationEditorAnchorRestoreDependencies = {
  createTargetMap: (rootHost: any) => Map<any, any>;
  buildAnchorPayload: (editorState: any, targets: Map<any, any>) => any;
  setEditorState: (state: any) => void;
};

/** Restores an editor anchor against the current frame target map before updating editor state. */
function createAnnotationEditorAnchorRestoreController(dependencies: AnnotationEditorAnchorRestoreDependencies) {
  let disposed = false;
  const restore = (editorState: any, rootHost: any) => {
    if (disposed) return false;
    dependencies.setEditorState(
      dependencies.buildAnchorPayload(editorState, dependencies.createTargetMap(rootHost)),
    );
    return true;
  };
  const dispose = () => { disposed = true; };
  return { restore, dispose };
}

export { createAnnotationEditorAnchorRestoreController };
if (typeof module !== `undefined`) module.exports = { createAnnotationEditorAnchorRestoreController };
