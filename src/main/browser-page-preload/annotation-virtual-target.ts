type VirtualAnnotationHit = {
  registrationId: string;
  id: string;
  name?: string;
  role?: string;
  metadata?: Record<string, unknown>;
  rect?: { x: number; y: number; width: number; height: number };
};

function createVirtualAnnotationTarget({
  hit,
  point,
  pageUrl,
  title,
  viewportWidth,
}: {
  hit: VirtualAnnotationHit;
  point: { x: number; y: number };
  pageUrl: string;
  title: string;
  viewportWidth: number;
}) {
  return {
    kind: `virtual`,
    surfaceId: hit.registrationId,
    targetId: hit.id,
    elementName: hit.name,
    elementMetadata: hit.metadata,
    pageUrl,
    frameUrl: null,
    framePath: [],
    title: hit.name ?? title,
    elementPath: `virtual object`,
    selector: null,
    role: hit.role ?? null,
    name: null,
    nearbyText: null,
    isFixed: true,
    point: { xPercent: (point.x / viewportWidth) * 100, y: point.y },
    rect: hit.rect ?? { x: point.x, y: point.y, width: 1, height: 1 },
  };
}

export { createVirtualAnnotationTarget };
if (typeof module !== `undefined`) module.exports = { createVirtualAnnotationTarget };
