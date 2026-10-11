type AnnotationEditorCloseControllerDependencies = {
  clearInteraction: () => void;
  clearTransientState: () => void;
  flushSync: (callback: () => void) => void;
  resetModifierState: () => void;
  clearPointerState: () => void;
  clearViewportSelection: () => void;
  clearDesignScrub: () => void;
  clearPreparedScreenshot: () => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
  clearDragState: () => void;
  clearEditorRef: () => void;
  nextInteractionGeneration: () => void;
  setEditorState: (update: (state: any) => any) => void;
  matchesTarget: (state: any, target: any) => boolean;
};

/** Applies the editor-close cleanup order while keeping React refs/state injected. */
function closeAnnotationEditor(target: any, dependencies: AnnotationEditorCloseControllerDependencies) {
  dependencies.clearInteraction();
  dependencies.clearTransientState();
  dependencies.flushSync(() => {
    dependencies.resetModifierState();
    dependencies.clearPointerState();
    dependencies.nextInteractionGeneration();
    dependencies.clearViewportSelection();
    dependencies.clearDesignScrub();
    dependencies.clearPreparedScreenshot();
    dependencies.clearHover();
    dependencies.clearSelectionHover();
    dependencies.clearDragState();
    dependencies.clearEditorRef();
    dependencies.setEditorState((state) =>
      state == null || target == null || dependencies.matchesTarget(state, target) ? null : state,
    );
  });
}

export { closeAnnotationEditor };
if (typeof module !== `undefined`) module.exports = { closeAnnotationEditor };
