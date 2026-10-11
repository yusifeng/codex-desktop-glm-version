type AnnotationRemoveSelectionDependencies = {
  getAnchorSelections: (editorState: any) => { primary: any; additional: any[] };
  projectSelection: (selections: { primary: any; additional: any[] }, selection: any) => any;
  applyAnchorUpdate: (editorState: any, anchorState: any) => void;
};

/** Applies host remove-selection requests to the active element editor anchor. */
function createAnnotationRemoveSelectionController(
  dependencies: AnnotationRemoveSelectionDependencies,
) {
  let disposed = false;

  const remove = (
    selectionIndex: number,
    context: { multiSelectEnabled: boolean; editorState: any },
  ) => {
    if (disposed || !context.multiSelectEnabled) return false;
    const editorState = context.editorState;
    if (editorState?.target.mode !== `create` || editorState.anchor.type === `text`) return false;
    const selections = dependencies.getAnchorSelections(editorState);
    const selection = [selections.primary, ...selections.additional][selectionIndex];
    if (selection == null) return false;
    dependencies.applyAnchorUpdate(editorState, dependencies.projectSelection(selections, selection));
    return true;
  };

  const dispose = () => {
    disposed = true;
  };

  return { remove, dispose };
}

export { createAnnotationRemoveSelectionController };
if (typeof module !== `undefined`) module.exports = { createAnnotationRemoveSelectionController };
