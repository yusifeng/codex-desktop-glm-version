type PreviewLayerTarget = {
  element: any;
  rect: { x: number; y: number; width: number; height: number };
  clipRect: { x: number; y: number; width: number; height: number };
  style: any;
};

type AnnotationPreviewLayerDependencies = {
  cssText: string;
  buildRoundedRectPath: (target: any) => string;
  resolveCornerRadii: (target: any) => Array<{ x: number; y: number }>;
};

function createAnnotationPreviewLayer({ layer, color }: { layer: any; color: string }, deps: AnnotationPreviewLayerDependencies) {
  const documentLike = layer.ownerDocument;
  const createSvgElement = (name: string, attributes: Record<string, unknown>) => {
    const element = documentLike.createElementNS(`http://www.w3.org/2000/svg`, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
  };
  const maskId = `codex-site-annotation-preview-mask`;
  const style = documentLike.createElement(`style`);
  style.textContent = deps.cssText;
  layer.style.color = color;
  const svg = createSvgElement(`svg`, { width: 0, height: 0, "aria-hidden": true });
  const mask = createSvgElement(`mask`, {
    id: maskId, maskUnits: `userSpaceOnUse`, maskContentUnits: `userSpaceOnUse`,
    "mask-type": `luminance`, x: 0, y: 0,
  });
  const whiteRect = createSvgElement(`rect`, { fill: `white` });
  mask.append(whiteRect);
  svg.append(mask);
  const backdrop = documentLike.createElement(`div`);
  backdrop.className = `annotation-feature-backdrop`;
  backdrop.style.maskImage = `url("#${maskId}")`;
  layer.append(style, svg, backdrop);
  const nodes = new Map<any, { clip: any; glow: any }>();
  let previous = ``;
  let disposed = false;
  return {
    update(targets: PreviewLayerTarget[]) {
      if (disposed) return;
      const viewport = {
        width: documentLike.defaultView?.innerWidth ?? documentLike.documentElement.clientWidth,
        height: documentLike.defaultView?.innerHeight ?? documentLike.documentElement.clientHeight,
      };
      const active = new Set(targets.map(({ element }) => element));
      for (const target of targets) {
        const { element, rect, clipRect } = target;
        const [topLeft, topRight, bottomRight, bottomLeft] = deps.resolveCornerRadii(target);
        let node = nodes.get(element);
        if (node == null) {
          const clip = documentLike.createElement(`div`);
          clip.className = `annotation-feature-clip`;
          const glow = documentLike.createElement(`div`);
          glow.className = `annotation-feature-glow`;
          clip.append(glow); layer.append(clip);
          node = { clip, glow }; nodes.set(element, node);
        }
        Object.assign(node.clip.style, { left: `${clipRect.x}px`, top: `${clipRect.y}px`, width: `${clipRect.width}px`, height: `${clipRect.height}px` });
        Object.assign(node.glow.style, {
          left: `${rect.x - clipRect.x}px`, top: `${rect.y - clipRect.y}px`, width: `${rect.width}px`, height: `${rect.height}px`,
          borderTopLeftRadius: `${topLeft.x}px ${topLeft.y}px`, borderTopRightRadius: `${topRight.x}px ${topRight.y}px`,
          borderBottomLeftRadius: `${bottomLeft.x}px ${bottomLeft.y}px`, borderBottomRightRadius: `${bottomRight.x}px ${bottomRight.y}px`,
        });
      }
      for (const [element, node] of nodes) if (!active.has(element)) { node.clip.remove(); nodes.delete(element); }
      const shapes = targets.map((target) => ({ path: deps.buildRoundedRectPath(target), clip: target.clipRect }));
      const serialized = JSON.stringify({ viewport, shapes });
      if (serialized !== previous) {
        previous = serialized;
        for (const node of [mask, whiteRect]) { node.setAttribute(`width`, String(viewport.width)); node.setAttribute(`height`, String(viewport.height)); }
        mask.replaceChildren(whiteRect); svg.replaceChildren(mask);
        shapes.forEach(({ path, clip }, index) => {
          const clipPath = createSvgElement(`clipPath`, { id: `${maskId}-clip-${index}`, clipPathUnits: `userSpaceOnUse` });
          clipPath.append(createSvgElement(`rect`, clip)); svg.append(clipPath);
          mask.append(createSvgElement(`path`, { d: path, fill: `black`, "clip-path": `url(#${maskId}-clip-${index})` }));
        });
      }
      backdrop.hidden = targets.length === 0;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      layer.replaceChildren();
      nodes.clear();
      previous = ``;
    },
  };
}

export { createAnnotationPreviewLayer };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewLayer };
