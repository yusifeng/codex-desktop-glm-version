type AnnotationCommentInteractionDisposalDependencies = {
  disposeInteraction: () => void;
  resetModifier: () => void;
  clearPointer: () => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
  clearTransientState: () => void;
  clearViewportSelection: () => void;
  nextInteractionGeneration: () => void;
  clearDragState: () => void;
};

/** Owns the host-requested comment interaction teardown order. */
function createAnnotationCommentInteractionDisposalController(
  dependencies: AnnotationCommentInteractionDisposalDependencies,
) {
  const dispose = () => {
    dependencies.disposeInteraction();
    dependencies.resetModifier();
    dependencies.clearPointer();
    dependencies.clearHover();
    dependencies.clearSelectionHover();
    dependencies.clearTransientState();
    dependencies.clearViewportSelection();
    dependencies.nextInteractionGeneration();
    dependencies.clearDragState();
  };
  return { dispose };
}

export { createAnnotationCommentInteractionDisposalController };
if (typeof module !== `undefined`) module.exports = { createAnnotationCommentInteractionDisposalController };
