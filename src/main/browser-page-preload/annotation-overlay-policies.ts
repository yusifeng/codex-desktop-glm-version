/** Pure overlay visibility policies shared by the annotation runtime. */

type AnnotationOverlayPolicyDependencies = {
  getEditorSelections: (anchor: any) => any;
  anchorsEqual: (left: any, right: any) => boolean;
};

/**
 * A region annotation is hidden while the editor is creating the same region,
 * or while the annotation is the active editor target.  Keeping this decision
 * separate makes viewport/overlay rendering testable without DOM side effects.
 */
function shouldSuppressAnnotationRegionOverlay(
  annotation: any,
  editor: any,
  activeAnnotation: any,
  deps: AnnotationOverlayPolicyDependencies,
): boolean {
  if (annotation?.id != null && activeAnnotation?.id != null && annotation.id === activeAnnotation.id) return true;
  if (editor == null || editor.anchor?.type === `text` || editor.target?.mode !== `create`) return false;
  const selections = deps.getEditorSelections(editor.anchor);
  const editorAnchors = [selections.primary, ...(selections.additional ?? [])].map(({ anchor }: any) => anchor);
  return [annotation.anchor, ...(annotation.additionalAnchors ?? [])].some(
    (anchor) => anchor?.kind === `region` && editorAnchors.some((candidate: any) => deps.anchorsEqual(anchor, candidate)),
  );
}

export { shouldSuppressAnnotationRegionOverlay };
if (typeof module !== `undefined`) module.exports = { shouldSuppressAnnotationRegionOverlay };
