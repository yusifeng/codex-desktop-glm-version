// use-learning-block-drag — pointer-capture drag state with optional RAF throttling.

import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime } from "@rchunk/app-shared";
import { n as useStableCallback, t as initializeStableCallback } from "@rchunk/use-stable-callback";

interface DragReactRuntime {
  useCallback<Value extends (...arguments_: never[]) => unknown>(callback: Value, dependencies: readonly unknown[]): Value;
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value): [Value, (value: Value) => void];
}
interface DragBounds { height: number; left: number; top: number; width: number }
interface DragStart<Target> { bounds: DragBounds; pointerId: number; target: Target }
interface DragUpdate<Target> extends DragStart<Target> { clientX: number; clientY: number }
interface PointerLike { clientX: number; clientY: number; pointerId: number; preventDefault(): void; stopPropagation(): void }
interface LearningBlockDragOptions<Target> { disabled?: boolean; elementRef: { current: HTMLElement | null }; onDrag(update: DragUpdate<Target>): void; shouldThrottle?(target: Target): boolean }

let React: DragReactRuntime;
function initializeLearningBlockDrag(): void { initializeStableCallback(); React ??= getReactRuntime() as unknown as DragReactRuntime; }
function useLearningBlockDrag<Target>({ elementRef, onDrag, shouldThrottle = () => true, disabled = false }: LearningBlockDragOptions<Target>): { activeTarget: Target | null; handlePointerEnd(event: PointerLike): boolean; handlePointerMove(event: PointerLike): boolean; startDrag(target: Target, event: PointerLike): void } {
  initializeLearningBlockDrag();
  const dragStart = React.useRef<DragStart<Target> | null>(null);
  const pendingPoint = React.useRef<{ clientX: number; clientY: number } | null>(null);
  const frame = React.useRef<number | null>(null);
  const [activeTarget, setActiveTarget] = React.useState<Target | null>(null);
  const stableOnDrag = useStableCallback(onDrag);
  const flush = React.useCallback((): void => {
    frame.current = null;
    const start = dragStart.current;
    const point = pendingPoint.current;
    pendingPoint.current = null;
    if (start != null && point != null) stableOnDrag({ ...start, ...point });
  }, [stableOnDrag]);
  const startDrag = React.useCallback((target: Target, event: PointerLike): void => {
    const element = elementRef.current;
    if (disabled || element == null) return;
    const rectangle = element.getBoundingClientRect();
    if (rectangle.width <= 0 || rectangle.height <= 0) return;
    const start = { target, pointerId: event.pointerId, bounds: { left: rectangle.left, top: rectangle.top, width: rectangle.width, height: rectangle.height } };
    dragStart.current = start;
    setActiveTarget(target);
    try { element.setPointerCapture?.(event.pointerId); } catch {}
    stableOnDrag({ ...start, clientX: event.clientX, clientY: event.clientY });
    event.preventDefault();
    event.stopPropagation();
  }, [disabled, elementRef, stableOnDrag]);
  const handlePointerMove = React.useCallback((event: PointerLike): boolean => {
    const start = dragStart.current;
    if (start == null || start.pointerId !== event.pointerId) return false;
    if (shouldThrottle(start.target)) {
      pendingPoint.current = { clientX: event.clientX, clientY: event.clientY };
      frame.current ??= requestAnimationFrame(flush);
      event.preventDefault();
      return true;
    }
    stableOnDrag({ ...start, clientX: event.clientX, clientY: event.clientY });
    event.preventDefault();
    return true;
  }, [flush, shouldThrottle, stableOnDrag]);
  const handlePointerEnd = React.useCallback((event: PointerLike): boolean => {
    const start = dragStart.current;
    if (start == null || start.pointerId !== event.pointerId) return false;
    if (frame.current != null) { cancelAnimationFrame(frame.current); frame.current = null; flush(); }
    dragStart.current = null;
    pendingPoint.current = null;
    setActiveTarget(null);
    try { elementRef.current?.releasePointerCapture?.(event.pointerId); } catch {}
    return true;
  }, [elementRef, flush]);
  React.useEffect(() => () => { if (frame.current != null) cancelAnimationFrame(frame.current); }, []);
  return { activeTarget, startDrag, handlePointerMove, handlePointerEnd };
}

export { useLearningBlockDrag as n, initializeLearningBlockDrag as t };
