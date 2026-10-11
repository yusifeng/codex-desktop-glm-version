type AnnotationEditorRestoreControllerDependencies = {
  clearInteraction: () => void;
  resetModifierState: () => void;
  clearAnchorPoint: () => void;
  clearPointerState: () => void;
  clearTransientState: () => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
  restoreEditor: (message: any) => void;
};

/** Applies the host restore-editor cleanup order while keeping owner state injected. */
function restoreAnnotationEditor(message: any, dependencies: AnnotationEditorRestoreControllerDependencies) {
  dependencies.clearInteraction();
  dependencies.resetModifierState();
  dependencies.clearAnchorPoint();
  dependencies.clearPointerState();
  dependencies.clearTransientState();
  dependencies.clearHover();
  dependencies.clearSelectionHover();
  dependencies.restoreEditor(message);
}

export { restoreAnnotationEditor };
if (typeof module !== `undefined`) module.exports = { restoreAnnotationEditor };
