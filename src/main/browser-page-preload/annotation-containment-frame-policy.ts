function resolveAnnotationContainmentFrameAncestor(
  candidate: any,
  dependencies: { getOwnerWindow: (value: any) => unknown; getFrameElement: (windowLike: unknown) => any; isElement: (value: unknown) => boolean },
) {
  const frame = dependencies.getFrameElement(dependencies.getOwnerWindow(candidate));
  return dependencies.isElement(frame) ? frame : null;
}
export { resolveAnnotationContainmentFrameAncestor };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationContainmentFrameAncestor };
