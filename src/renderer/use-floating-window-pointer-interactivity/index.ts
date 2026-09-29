// use-floating-window-pointer-interactivity — publish whether a floating surface is pointer-interactive.

import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime } from "@rchunk/app-shared";

interface PointerPosition { x: number; y: number }
interface FloatingReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useEffectEvent<Arguments extends unknown[], Result>(callback: (...arguments_: Arguments) => Result): (...arguments_: Arguments) => Result;
  useState<Value>(value: Value): [Value, (value: Value) => void];
}
interface FloatingWindowPointerOptions {
  activationNonce?: unknown;
  floatingElementSelectors?: readonly string[];
  includeInteractiveRegion?: boolean;
  interactiveRegionRef: { current: HTMLElement | null };
  isPaused?(): boolean;
  onInteractiveChange(interactive: boolean): void;
  publishInitialNonInteractive?: boolean;
  regionElementSelectors?: readonly string[];
}

let React: FloatingReactRuntime;
function initializeFloatingWindowPointerInteractivity(): void { React ??= getReactRuntime() as unknown as FloatingReactRuntime; }
function containsPoint(position: PointerPosition, rectangle: DOMRect): boolean { return position.x >= rectangle.left && position.x <= rectangle.right && position.y >= rectangle.top && position.y <= rectangle.bottom; }
function isVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return false;
  const rectangle = element.getBoundingClientRect();
  return rectangle.width > 0 && rectangle.height > 0;
}
function isPointInside(position: PointerPosition, element: Element): boolean {
  if (!containsPoint(position, element.getBoundingClientRect())) return false;
  return document.elementsFromPoint(position.x, position.y).some((candidate) => candidate === element || element.contains(candidate));
}
function hoveredInteractiveState({ floatingElementSelectors, includeInteractiveRegion, interactiveRegion, regionElementSelectors }: { floatingElementSelectors: readonly string[]; includeInteractiveRegion: boolean; interactiveRegion: HTMLElement | null; regionElementSelectors: readonly string[] }): boolean | null {
  if (interactiveRegion != null) {
    if (includeInteractiveRegion && interactiveRegion.matches(":hover")) return true;
    for (const selector of regionElementSelectors) for (const element of interactiveRegion.querySelectorAll(selector)) if (isVisible(element) && element.matches(":hover")) return true;
  }
  for (const selector of floatingElementSelectors) for (const element of document.querySelectorAll(selector)) if (isVisible(element) && element.matches(":hover")) return true;
  return document.documentElement.matches(":hover") ? false : null;
}
function useFloatingWindowPointerInteractivity({ activationNonce, floatingElementSelectors = [], includeInteractiveRegion = false, interactiveRegionRef, isPaused, onInteractiveChange, publishInitialNonInteractive = true, regionElementSelectors = [] }: FloatingWindowPointerOptions): boolean {
  initializeFloatingWindowPointerInteractivity();
  const [isNonInteractive, setNonInteractive] = React.useState(false);
  const paused = React.useEffectEvent(() => isPaused?.() ?? false);
  const publish = React.useEffectEvent((interactive: boolean): void => { setNonInteractive(!interactive); onInteractiveChange(interactive); });
  const restoreInteractive = React.useEffectEvent((): void => onInteractiveChange(true));
  React.useEffect(() => {
    let currentInteractive: boolean | null = null;
    let latestPosition: PointerPosition | null = null;
    let processedPosition: PointerPosition | null = null;
    let pendingFrame: number | null = null;
    const publishIfChanged = (interactive: boolean): void => { if (currentInteractive !== interactive) { currentInteractive = interactive; publish(interactive); } };
    const calculateAtPoint = (position: PointerPosition): boolean => {
      const region = interactiveRegionRef.current;
      if (region == null || (includeInteractiveRegion && isPointInside(position, region))) return true;
      for (const selector of regionElementSelectors) for (const element of region.querySelectorAll(selector)) if (isPointInside(position, element) && isVisible(element)) return true;
      for (const selector of floatingElementSelectors) for (const element of document.querySelectorAll(selector)) if (isPointInside(position, element) && isVisible(element)) return true;
      return false;
    };
    const process = (): void => { pendingFrame = null; if (latestPosition == null || paused()) return; processedPosition = latestPosition; publishIfChanged(calculateAtPoint(latestPosition)); };
    const schedule = (): void => { pendingFrame ??= requestAnimationFrame(process); };
    const handleMouseMove = (event: MouseEvent): void => { latestPosition = { x: event.clientX, y: event.clientY }; processedPosition = latestPosition; schedule(); };
    const handleLayoutChange = (): void => { if (processedPosition != null) { latestPosition = processedPosition; schedule(); } };
    const handleMouseLeave = (): void => { if (!paused()) publishIfChanged(false); };
    const publishInitial = (): void => {
      if (paused()) return;
      const interactive = hoveredInteractiveState({ floatingElementSelectors, includeInteractiveRegion, interactiveRegion: interactiveRegionRef.current, regionElementSelectors });
      if (interactive != null && (interactive || publishInitialNonInteractive)) publishIfChanged(interactive);
    };
    const observer = new MutationObserver(handleLayoutChange);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);
    window.addEventListener("mouseleave", handleMouseLeave);
    observer.observe(document.body, { attributeFilter: ["aria-hidden", "class", "hidden", "style"], attributes: true, childList: true, subtree: true });
    publishInitial();
    const initialFrame = requestAnimationFrame(publishInitial);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
      window.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
      cancelAnimationFrame(initialFrame);
      if (pendingFrame != null) cancelAnimationFrame(pendingFrame);
      currentInteractive = null;
      restoreInteractive();
    };
  }, [activationNonce, floatingElementSelectors, includeInteractiveRegion, interactiveRegionRef, publishInitialNonInteractive, regionElementSelectors]);
  return isNonInteractive;
}

export { useFloatingWindowPointerInteractivity as n, initializeFloatingWindowPointerInteractivity as t };
