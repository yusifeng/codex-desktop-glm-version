type AnnotationTextAnchorEditorDependencies = {
  clearInteraction: () => void;
  closePreview: (commentId: string) => void;
  openEditor: (anchorState: any, extras: any) => void;
  refreshViewport: () => void;
  setEditorState: (state: any) => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
};

/** Opens a create editor from a text anchor while preserving preview and interaction cleanup order. */
function createAnnotationTextAnchorEditorController(
  dependencies: AnnotationTextAnchorEditorDependencies,
) {
  let disposed = false;

  const open = (anchorState: any, extras: any, previewCommentId: string | null) => {
    if (disposed || anchorState?.anchor?.kind !== `text`) return false;
    dependencies.clearInteraction();
    if (previewCommentId != null) dependencies.closePreview(previewCommentId);
    dependencies.openEditor(anchorState, extras);
    dependencies.refreshViewport();
    dependencies.setEditorState({
      target: { mode: `create` },
      anchor: {
        type: `text`,
        ...(anchorState.themeVariant == null ? {} : { themeVariant: anchorState.themeVariant }),
        value: anchorState.anchor,
      },
    });
    dependencies.clearHover();
    dependencies.clearSelectionHover();
    return true;
  };

  const dispose = () => {
    disposed = true;
  };

  return { open, dispose };
}

export { createAnnotationTextAnchorEditorController };
if (typeof module !== `undefined`) module.exports = { createAnnotationTextAnchorEditorController };
