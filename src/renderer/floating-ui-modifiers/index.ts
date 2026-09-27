import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
export interface DragTransform { x: number; y: number; [key: string]: unknown }
export interface DragModifierInput { draggingNodeRect?: { bottom: number; left: number; right: number; top: number } | null; scrollableAncestorRects?: readonly { height: number; left: number; top: number; width: number }[]; transform: DragTransform }
function restrictToBounds(transform: DragTransform, node: NonNullable<DragModifierInput["draggingNodeRect"]>, bounds: NonNullable<DragModifierInput["scrollableAncestorRects"]>[number]): DragTransform { const next = { ...transform }; if (node.top + transform.y <= bounds.top) next.y = bounds.top - node.top; else if (node.bottom + transform.y >= bounds.top + bounds.height) next.y = bounds.top + bounds.height - node.bottom; if (node.left + transform.x <= bounds.left) next.x = bounds.left - node.left; else if (node.right + transform.x >= bounds.left + bounds.width) next.x = bounds.left + bounds.width - node.right; return next; }
const restrictToHorizontalAxis = ({ transform }: DragModifierInput): DragTransform => ({ ...transform, y: 0 });
const restrictToFirstScrollableAncestor = ({ draggingNodeRect, scrollableAncestorRects, transform }: DragModifierInput): DragTransform => draggingNodeRect && scrollableAncestorRects?.[0] ? restrictToBounds(transform, draggingNodeRect, scrollableAncestorRects[0]) : transform;
const restrictToVerticalAxis = ({ transform }: DragModifierInput): DragTransform => ({ ...transform, x: 0 });
function initializeFloatingUiModifiers(): void {}
export { restrictToVerticalAxis as i, restrictToFirstScrollableAncestor as n, restrictToHorizontalAxis as r, initializeFloatingUiModifiers as t };
