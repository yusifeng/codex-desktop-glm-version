type ContainmentElement = {
  ownerDocument?: { defaultView?: unknown };
};
type ContainmentDependencies = {
  getOwnerWindow: (element: ContainmentElement) => unknown;
  getComputedStyle: (windowLike: unknown, element: ContainmentElement) => { position?: string; contain?: string };
  getParent: (element: ContainmentElement) => ContainmentElement | null;
  getFrameElement: (windowLike: unknown) => ContainmentElement | null;
  isElement: (value: unknown) => value is ContainmentElement;
};

/** Checks whether `element` can be contained by an annotation target without crossing layout boundaries. */
function isAnnotationContainedBy(
  element: ContainmentElement | null,
  target: ContainmentElement | null,
  dependencies: ContainmentDependencies,
): boolean {
  const windowLike = element == null ? null : dependencies.getOwnerWindow(element);
  if (windowLike == null) return false;
  let current = element;
  while (current != null) {
    const style = dependencies.getComputedStyle(windowLike, current);
    if (style.position === `absolute` || style.position === `fixed`) return false;
    const parent = dependencies.getParent(current);
    if (parent == null) return false;
    let candidate = target;
    while (candidate != null) {
      if (parent === candidate) return true;
      const ancestor = dependencies.getParent(candidate);
      candidate = ancestor ?? resolveAnnotationContainmentFrameAncestor(candidate, dependencies);
    }
    const parentStyle = dependencies.getComputedStyle(windowLike, parent);
    if ((parentStyle.contain ?? ``).split(/\s+/).some((value) => value === `size` || value === `strict`))
      return false;
    current = parent;
  }
  return false;
}

export { isAnnotationContainedBy };
if (typeof module !== `undefined`) module.exports = { isAnnotationContainedBy };
import { resolveAnnotationContainmentFrameAncestor } from "./annotation-containment-frame-policy";
