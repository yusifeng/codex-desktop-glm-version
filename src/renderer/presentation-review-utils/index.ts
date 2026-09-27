import "@rchunk/rolldown-runtime";

export interface Point { x: number; y: number }
export interface Frame { height: number; left: number; rotation?: number | null; top: number; width: number }
export interface ContainedElement { elementId: string; frame: Frame }
export interface SlideElementTarget extends Record<string, unknown> { frame: Frame; id: string }
export interface InspectorSlideElement extends Record<string, unknown> { id: string; kind?: string | null; name?: string | null }
export interface PresentationSnapshot {
  inspector: { slideElements: InspectorSlideElement[] };
  primarySelectedElementId?: string | null;
  selectedElementIds: string[];
  selectedSlideElementTargets: SlideElementTarget[];
  selectedSlideIdx: number;
  slideIds: string[];
  slideLabels: string[];
}
export interface PresentationRegionTarget {
  anchorPoint: Point;
  containedElements: ContainedElement[];
  frame: Frame;
  slideId: string;
  slideIndex: number;
  slideLabel: string;
  type: "presentation-region";
}
export interface PresentationElementSelectionTarget {
  anchorPoint?: Point;
  elementIds: string[];
  frame: Frame;
  primaryElementId: string | null;
  primaryElementKind?: string | null;
  primaryElementName?: string | null;
  primaryElementOffset?: Point | null;
  primaryElementOrdinal?: number | null;
  slideId: string;
  slideIndex: number;
  slideLabel: string;
  type: "presentation-element-selection";
}
export interface PresentationDrawingRegionTarget {
  containedElements: ContainedElement[];
  frame: Frame;
  slideId: string;
  slideIndex: number;
  slideLabel: string;
  type: "presentation-drawing-region";
  viewportBounds: Omit<Frame, "rotation">;
}
export type PresentationReviewTarget = PresentationRegionTarget | PresentationElementSelectionTarget;

const copyFrame = (frame: Frame): Frame => ({ left: frame.left, top: frame.top, width: frame.width, height: frame.height, rotation: frame.rotation });
const copyPoint = (point: Point): Point => ({ x: point.x, y: point.y });
const copyContainedElement = (element: ContainedElement): ContainedElement => ({ elementId: element.elementId, frame: copyFrame(element.frame) });

function selectedElementsFrame(input: Pick<PresentationSnapshot, "selectedElementIds" | "selectedSlideElementTargets">): Omit<Frame, "rotation"> | null {
  const selected = input.selectedElementIds.map(id => input.selectedSlideElementTargets.find(element => element.id === id)).filter((element): element is SlideElementTarget => element != null);
  const first = selected[0];
  if (!first) return null;
  let left = first.frame.left, top = first.frame.top, right = first.frame.left + first.frame.width, bottom = first.frame.top + first.frame.height;
  for (const element of selected.slice(1)) {
    left = Math.min(left, element.frame.left); top = Math.min(top, element.frame.top);
    right = Math.max(right, element.frame.left + element.frame.width); bottom = Math.max(bottom, element.frame.top + element.frame.height);
  }
  return { left, top, width: right - left, height: bottom - top };
}

interface SlideHit { kind: "slide"; slideId: string; slideIndex: number; slideLabel: string }
interface ElementHit { elementId: string; elementName?: string | null; frame?: Frame | null; kind: string; slideId: string; slideIndex: number; slideLabel: string }
function targetFromHit(hit: SlideHit | ElementHit, point: Point): PresentationReviewTarget {
  const pointFrame = { left: point.x, top: point.y, width: 0, height: 0 };
  if (!("elementId" in hit)) return { type: "presentation-region", slideId: hit.slideId, slideIndex: hit.slideIndex, slideLabel: hit.slideLabel, frame: pointFrame, anchorPoint: point, containedElements: [] };
  return { type: "presentation-element-selection", slideId: hit.slideId, slideIndex: hit.slideIndex, slideLabel: hit.slideLabel, elementIds: [hit.elementId], primaryElementId: hit.elementId, primaryElementName: hit.elementName, frame: hit.frame ?? pointFrame, anchorPoint: point };
}

function selectedElementTarget(input: { anchorPoint?: Point | null; elementIds?: string[]; frame?: Frame | null; primaryElementId?: string | null; snapshot: PresentationSnapshot }): PresentationElementSelectionTarget | null {
  const slideId = input.snapshot.slideIds[input.snapshot.selectedSlideIdx];
  if (!slideId) return null;
  const elementIds = [...(input.elementIds ?? input.snapshot.selectedElementIds)];
  const primaryElementId = input.primaryElementId ?? input.snapshot.primarySelectedElementId ?? null;
  const frame = input.frame ?? selectedElementsFrame({ selectedElementIds: elementIds, selectedSlideElementTargets: input.snapshot.selectedSlideElementTargets });
  if (!frame || elementIds.length === 0) return null;
  const primary = primaryElementId == null ? null : input.snapshot.inspector.slideElements.find(element => element.id === primaryElementId) ?? null;
  const ordinal = primary == null ? null : input.snapshot.inspector.slideElements.filter(element => element.kind === primary.kind).findIndex(element => element.id === primary.id) + 1;
  return {
    type: "presentation-element-selection", slideId, slideIndex: input.snapshot.selectedSlideIdx,
    slideLabel: input.snapshot.slideLabels[input.snapshot.selectedSlideIdx] ?? `Slide ${input.snapshot.selectedSlideIdx + 1}`,
    elementIds, primaryElementId, primaryElementKind: primary?.kind ?? null, primaryElementName: primary?.name ?? null,
    primaryElementOrdinal: ordinal != null && ordinal > 0 ? ordinal : null, frame: copyFrame(frame),
    ...(input.anchorPoint == null ? {} : { anchorPoint: copyPoint(input.anchorPoint), primaryElementOffset: { x: input.anchorPoint.x - frame.left, y: input.anchorPoint.y - frame.top } }),
  };
}

function presentationRegionTarget(input: { anchorPoint: Point; containedElements?: ContainedElement[]; frame: Frame; snapshot: PresentationSnapshot }): PresentationRegionTarget | null {
  const slideId = input.snapshot.slideIds[input.snapshot.selectedSlideIdx];
  return slideId ? { type: "presentation-region", slideId, slideIndex: input.snapshot.selectedSlideIdx, slideLabel: input.snapshot.slideLabels[input.snapshot.selectedSlideIdx] ?? `Slide ${input.snapshot.selectedSlideIdx + 1}`, frame: copyFrame(input.frame), anchorPoint: copyPoint(input.anchorPoint), containedElements: (input.containedElements ?? []).map(copyContainedElement) } : null;
}

function presentationDrawingRegionTarget(input: { containedElements?: ContainedElement[]; frame: Frame; snapshot: PresentationSnapshot; viewportBounds: Omit<Frame, "rotation"> }): PresentationDrawingRegionTarget | null {
  const slideId = input.snapshot.slideIds[input.snapshot.selectedSlideIdx];
  return slideId ? { type: "presentation-drawing-region", slideId, slideIndex: input.snapshot.selectedSlideIdx, slideLabel: input.snapshot.slideLabels[input.snapshot.selectedSlideIdx] ?? `Slide ${input.snapshot.selectedSlideIdx + 1}`, frame: copyFrame(input.frame), viewportBounds: { left: input.viewportBounds.left, top: input.viewportBounds.top, width: input.viewportBounds.width, height: input.viewportBounds.height }, containedElements: (input.containedElements ?? []).map(copyContainedElement) } : null;
}

const targetLabel = (target: PresentationReviewTarget): string => target.type === "presentation-region" ? target.frame.width === 0 && target.frame.height === 0 ? `${target.slideLabel} · Point` : `${target.slideLabel} · Region` : target.elementIds.length === 1 ? `${target.slideLabel} · ${target.primaryElementId ?? target.elementIds[0]}` : `${target.slideLabel} · ${target.elementIds.length} elements`;
const drawingTargetLabel = (target: PresentationDrawingRegionTarget): string => `${target.slideLabel} · Drawing`;
function frameToViewport(target: { frame: Frame }, viewport?: { left: number; scale: number; top: number } | null): Frame { return viewport ? { left: viewport.left + target.frame.left * viewport.scale, top: viewport.top + target.frame.top * viewport.scale, width: target.frame.width * viewport.scale, height: target.frame.height * viewport.scale } : copyFrame(target.frame); }
function annotationAnchorRect(target: PresentationReviewTarget, viewport?: { left: number; scale: number; top: number } | null): Frame { const point = target.type === "presentation-region" ? target.anchorPoint : target.anchorPoint ?? null; return point ? viewport ? { left: viewport.left + point.x * viewport.scale, top: viewport.top + point.y * viewport.scale, width: 0, height: 0 } : { left: point.x, top: point.y, width: 0, height: 0 } : frameToViewport(target, viewport); }
function initializePresentationReviewUtils(): void {}
export { drawingTargetLabel as a, targetLabel as c, presentationRegionTarget as i, selectedElementsFrame as l, presentationDrawingRegionTarget as n, annotationAnchorRect as o, selectedElementTarget as r, frameToViewport as s, targetFromHit as t, initializePresentationReviewUtils as u };
