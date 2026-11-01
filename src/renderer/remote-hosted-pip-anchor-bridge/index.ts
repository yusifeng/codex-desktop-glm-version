import "@rchunk/rolldown-runtime";

type Alignment = "top-left" | "top-right" | "bottom-left" | "bottom-right";
interface Rect { height: number; width: number; x: number; y: number }
interface EdgeRect { bottom: number; height: number; left: number; right: number; top: number; width: number }
interface Anchor { alignment: Alignment; point: { x: number; y: number } }
interface PipLayout {
  anchorRect: Rect | null;
  anchors: Anchor[] | null;
  animated: boolean;
  hostId: string;
  homeSurfaceWidth: number | null;
  isCodexHomeAvailable: boolean;
  interactionPassthroughRect: null;
  presentationScope: "thread";
}

let hostId: string;
let hostAttribute: string;
let homeSurfaceAttribute: string;
let obstacleAttribute: string;
let margin: number;
let obstaclePadding: number;
let pipSize: { height: number; width: number };
let collisionPasses: number;
let overlapPenalty: number;
let overlapAreaWeight: number;
let priorityWeight: number;
let alignments: Alignment[];
let hostSelector: string;
let homeSurfaceSelector: string;
let obstacleSelector: string;
let observedSelector: string;

function rectAt(left: number, top: number, size: { height: number; width: number }): EdgeRect {
  return { bottom: top + size.height, height: size.height, left, right: left + size.width, top, width: size.width };
}
function edgeRect({ bottom, left, right, top }: { bottom: number; left: number; right: number; top: number }): EdgeRect {
  return { bottom, height: bottom - top, left, right, top, width: right - left };
}
function overlapArea(first: EdgeRect, second: EdgeRect): number {
  const width = Math.min(first.right, second.right) - Math.max(first.left, second.left);
  const height = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return width <= 0 || height <= 0 ? 0 : width * height;
}
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
function clampToHost(rect: EdgeRect, host: Rect): EdgeRect {
  return rectAt(clamp(rect.left, margin, Math.max(margin, host.width - rect.width - margin)), clamp(rect.top, margin, Math.max(margin, host.height - rect.height - margin)), rect);
}
function initialRect(alignment: Alignment, host: Rect): EdgeRect {
  switch (alignment) {
    case "top-left": return rectAt(margin, margin, pipSize);
    case "top-right": return rectAt(host.width - pipSize.width - margin, margin, pipSize);
    case "bottom-left": return rectAt(margin, host.height - pipSize.height - margin, pipSize);
    case "bottom-right": return rectAt(host.width - pipSize.width - margin, host.height - pipSize.height - margin, pipSize);
  }
}
function candidateRects(alignment: Alignment, rect: EdgeRect, obstacle: EdgeRect): Array<{ priority: number; rect: EdgeRect }> {
  const below = rectAt(rect.left, obstacle.bottom, rect);
  const above = rectAt(rect.left, obstacle.top - rect.height, rect);
  const right = rectAt(obstacle.right, rect.top, rect);
  const left = rectAt(obstacle.left - rect.width, rect.top, rect);
  switch (alignment) {
    case "top-left": return [{ priority: 0, rect: below }, { priority: 1, rect: right }, { priority: 2, rect: left }, { priority: 3, rect: above }];
    case "top-right": return [{ priority: 0, rect: below }, { priority: 1, rect: left }, { priority: 2, rect: right }, { priority: 3, rect: above }];
    case "bottom-left": return [{ priority: 0, rect: above }, { priority: 1, rect: right }, { priority: 2, rect: left }, { priority: 3, rect: below }];
    case "bottom-right": return [{ priority: 0, rect: above }, { priority: 1, rect: left }, { priority: 2, rect: right }, { priority: 3, rect: below }];
  }
}
function candidateScore(candidate: { priority: number; rect: EdgeRect }, obstacles: EdgeRect[], source: EdgeRect): number {
  const overlap = obstacles.reduce((total, obstacle) => total + overlapArea(candidate.rect, obstacle), 0);
  return (overlap > 0 ? overlapPenalty : 0) + overlap * overlapAreaWeight + candidate.priority * priorityWeight
    + (candidate.rect.left - source.left) ** 2 + (candidate.rect.top - source.top) ** 2;
}
function firstCollision(rect: EdgeRect, obstacles: EdgeRect[]): EdgeRect | null {
  for (const obstacle of obstacles) if (overlapArea(rect, obstacle) > 0) return obstacle;
  return null;
}
function resolveCollision(alignment: Alignment, host: Rect, obstacle: EdgeRect, obstacles: EdgeRect[], rect: EdgeRect, source: EdgeRect): EdgeRect {
  const candidates = candidateRects(alignment, rect, obstacle).map((candidate) => ({ priority: candidate.priority, rect: clampToHost(candidate.rect, host) }));
  let best = candidates[0];
  let bestScore = best == null ? Number.POSITIVE_INFINITY : candidateScore(best, obstacles, source);
  for (const candidate of candidates.slice(1)) {
    const score = candidateScore(candidate, obstacles, source);
    if (score < bestScore) { best = candidate; bestScore = score; }
  }
  return best?.rect ?? rect;
}
function anchorPoint(alignment: Alignment, host: Rect, rect: EdgeRect): { x: number; y: number } {
  switch (alignment) {
    case "top-left": return { x: host.x + rect.left, y: host.y + rect.top };
    case "top-right": return { x: host.x + rect.right, y: host.y + rect.top };
    case "bottom-left": return { x: host.x + rect.left, y: host.y + rect.bottom };
    case "bottom-right": return { x: host.x + rect.right, y: host.y + rect.bottom };
  }
}
function preferredHomeRect(host: Rect, surface: Rect): EdgeRect {
  return rectAt(surface.x - host.x + surface.width - pipSize.width, surface.y - host.y, pipSize);
}
function inflatedObstacle(host: Rect, obstacle: Rect): EdgeRect {
  return edgeRect({ bottom: obstacle.y - host.y + obstacle.height + obstaclePadding, left: obstacle.x - host.x - obstaclePadding, right: obstacle.x - host.x + obstacle.width + obstaclePadding, top: obstacle.y - host.y - obstaclePadding });
}
function createAnchor(alignment: Alignment, host: Rect, obstacles: EdgeRect[], preferred: EdgeRect | null): Anchor {
  if (preferred != null) return { alignment, point: anchorPoint(alignment, host, preferred) };
  const source = clampToHost(initialRect(alignment, host), host);
  let current = source;
  for (let pass = 0; pass < collisionPasses; pass += 1) {
    const obstacle = firstCollision(current, obstacles);
    if (obstacle == null) break;
    current = resolveCollision(alignment, host, obstacle, obstacles, current, source);
  }
  return { alignment, point: anchorPoint(alignment, host, current) };
}
function computePipLayout({ homeSurfaceRect, hostId: requestedHostId, hostRect, isCodexHomeAvailable, obstacleRects }: { homeSurfaceRect: Rect | null; hostId: string; hostRect: Rect; isCodexHomeAvailable: boolean; obstacleRects: Rect[] }): PipLayout {
  const obstacles = obstacleRects.map((rect) => inflatedObstacle(hostRect, rect));
  const preferred = isCodexHomeAvailable && homeSurfaceRect != null ? preferredHomeRect(hostRect, homeSurfaceRect) : null;
  return { anchorRect: hostRect, anchors: alignments.map((alignment) => createAnchor(alignment, hostRect, obstacles, alignment === "top-right" ? preferred : null)), animated: false, hostId: requestedHostId, homeSurfaceWidth: homeSurfaceRect?.width ?? null, isCodexHomeAvailable, interactionPassthroughRect: null, presentationScope: "thread" };
}

function visibleRect(element: HTMLElement, allowZeroHeight = false): Rect | null {
  if (element.hidden || window.getComputedStyle(element).visibility === "hidden") return null;
  const rect = element.getBoundingClientRect();
  return rect.width <= 0 || (!allowZeroHeight && rect.height <= 0) ? null : { height: rect.height, width: rect.width, x: rect.left, y: rect.top };
}
function layoutKey(layout: PipLayout): string {
  return JSON.stringify({ anchors: layout.anchors, anchorRect: layout.anchorRect, hostId: layout.hostId, homeSurfaceWidth: layout.homeSurfaceWidth, isCodexHomeAvailable: layout.isCodexHomeAvailable, presentationScope: layout.presentationScope });
}
function isObservedElement(node: Node): boolean {
  return node instanceof HTMLElement && (node.matches(observedSelector) || node.querySelector(observedSelector) != null);
}
function containsObservedElement(record: MutationRecord): boolean {
  if (record.type === "attributes") return true;
  for (const node of record.addedNodes) if (isObservedElement(node)) return true;
  for (const node of record.removedNodes) if (isObservedElement(node)) return true;
  return false;
}
function startRemoteHostedPipAnchorBridge(scale = 1): { setCodexHomeAvailable(available: boolean): void; stop(): void } {
  const send = (window as Window & { electronBridge?: { sendMessageFromView?(message: unknown): unknown } }).electronBridge?.sendMessageFromView;
  if (send == null || document.body == null) return { setCodexHomeAvailable() {}, stop() {} };
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  let frame: number | null = null;
  let available = false;
  let previous: PipLayout | null = null;
  let previousKey: string | null = null;
  const resizeObserver = new ResizeObserver(schedule);
  const treeObserver = new MutationObserver((records) => { if (records.some(containsObservedElement)) { observeElements(); schedule(); } });
  const attributeObserver = new MutationObserver(schedule);
  function publish(layout: PipLayout): void {
    const key = layoutKey(layout);
    if (key === previousKey) return;
    const next = { ...layout, animated: previous?.anchorRect != null && layout.anchorRect != null };
    previous = next;
    previousKey = key;
    send({ layout: next, type: "remote-hosted-pip-host-layout-changed" });
  }
  function publishEmpty(): void {
    publish({ anchors: null, anchorRect: null, animated: false, hostId, homeSurfaceWidth: null, isCodexHomeAvailable: false, interactionPassthroughRect: null, presentationScope: "thread" });
  }
  function schedule(): void { frame ??= window.requestAnimationFrame(() => { frame = null; measure(); }); }
  function measure(): void {
    const hostElement = document.querySelector<HTMLElement>(hostSelector);
    if (hostElement == null) { publishEmpty(); return; }
    const measuredHost = visibleRect(hostElement);
    if (measuredHost == null) { publishEmpty(); return; }
    const obstacles: Rect[] = [];
    for (const element of document.querySelectorAll<HTMLElement>(obstacleSelector)) { const rect = visibleRect(element); if (rect != null) obstacles.push(rect); }
    let surface: Rect | null = null;
    for (const element of document.querySelectorAll<HTMLElement>(homeSurfaceSelector)) {
      surface = visibleRect(element, true);
      if (surface != null) { surface.width = element.offsetWidth * safeScale; break; }
    }
    publish(computePipLayout({ homeSurfaceRect: surface, hostId, hostRect: measuredHost, isCodexHomeAvailable: available, obstacleRects: obstacles }));
  }
  function observeElements(): void {
    resizeObserver.disconnect();
    attributeObserver.disconnect();
    for (const element of document.querySelectorAll<HTMLElement>(observedSelector)) {
      resizeObserver.observe(element);
      attributeObserver.observe(element, { attributeFilter: ["class", "hidden", "style"], attributes: true });
    }
  }
  treeObserver.observe(document.body, { attributeFilter: [hostAttribute, homeSurfaceAttribute, obstacleAttribute], attributes: true, childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("scroll", schedule, true);
  observeElements();
  schedule();
  return {
    setCodexHomeAvailable(next) { if (available !== next) { available = next; schedule(); } },
    stop() {
      if (frame != null) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect(); treeObserver.disconnect(); attributeObserver.disconnect();
      window.removeEventListener("resize", schedule); document.removeEventListener("scroll", schedule, true); publishEmpty();
    },
  };
}

function initializePipGeometry(): void {
  hostId = "codex-main-thread"; hostAttribute = "data-pip-anchor-host"; homeSurfaceAttribute = "data-pip-home-surface"; obstacleAttribute = "data-pip-obstacle";
  margin = 24; obstaclePadding = 12; pipSize = { height: 250, width: 250 }; collisionPasses = 6; overlapPenalty = 1e9; overlapAreaWeight = 1e4; priorityWeight = 1e6;
  alignments = ["top-left", "top-right", "bottom-left", "bottom-right"];
}
function initializeRemoteHostedPipBridge(): void {
  initializePipGeometry();
  hostSelector = `[${hostAttribute}="${hostId}"]`; homeSurfaceSelector = `[${homeSurfaceAttribute}]`; obstacleSelector = `[${obstacleAttribute}]`; observedSelector = `${hostSelector},${homeSurfaceSelector},${obstacleSelector}`;
}

export { initializePipGeometry as i, startRemoteHostedPipAnchorBridge as n, hostId as r, initializeRemoteHostedPipBridge as t };
