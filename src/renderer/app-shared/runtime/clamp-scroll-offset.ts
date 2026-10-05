/** Clamp a scroll offset after applying a delta to the available viewport range. */
export function clampScrollOffset(contentHeight: number, deltaY: number, scrollOffset: number, viewportHeight: number): number {
  const maxOffset = Math.max(0, contentHeight - viewportHeight);
  return Math.max(0, Math.min(Math.min(scrollOffset, maxOffset) + deltaY, maxOffset));
}
