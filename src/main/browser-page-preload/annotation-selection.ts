/**
 * Selection hit-testing policy used by the annotation pointer controller.
 *
 * Form controls own their pointer interaction unless the control is a text
 * input that the annotation editor can safely inspect.  Keeping this walk
 * separate makes the DOM policy testable without constructing the React
 * runtime or browser globals.
 */
export type AnnotationSelectionPolicyDependencies = {
  getParent: (element: any) => any;
  isTextInput: (element: any) => boolean;
};

export function isAnnotationSelectionBlocked(
  element: any,
  dependencies: AnnotationSelectionPolicyDependencies,
): boolean {
  let current = element;
  while (current != null) {
    if (current.matches(`input, button, select, audio, video`))
      return !dependencies.isTextInput(current);
    current = dependencies.getParent(current);
  }
  return false;
}

if (typeof module !== `undefined`) module.exports = { isAnnotationSelectionBlocked };
