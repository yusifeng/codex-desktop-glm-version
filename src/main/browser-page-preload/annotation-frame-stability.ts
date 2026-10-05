type FrameElement = { ownerDocument?: { defaultView?: unknown } };
type FrameStabilityDependencies = {
  rootWindow: unknown;
  resolveAnnotationElement: (element: unknown) => unknown;
  isFrameElement: (value: unknown) => boolean;
  getFrameElement: (windowLike: unknown) => FrameElement | null;
  getOwnerWindow: (element: FrameElement) => unknown;
};

function isStableAnnotationFrame(element: unknown, dependencies: FrameStabilityDependencies): boolean {
  if (dependencies.resolveAnnotationElement(element) !== element) return false;
  return isStableAnnotationFrameChain(element, dependencies);
}

export { isStableAnnotationFrame };
if (typeof module !== `undefined`) module.exports = { isStableAnnotationFrame };
import { isStableAnnotationFrameChain } from "./annotation-frame-chain-policy";
