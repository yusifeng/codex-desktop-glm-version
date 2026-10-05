/** Owns mutable node cache and serialized render snapshot for a preview layer. */
function createAnnotationPreviewLayerState() {
  const nodes = new Map<any, { clip: any; glow: any }>();
  let previous = ``;
  let disposed = false;
  return {
    nodes,
    get previous() { return previous; },
    get disposed() { return disposed; },
    setPrevious(value: string) { previous = value; },
    dispose() {
      if (disposed) return false;
      disposed = true;
      nodes.clear();
      previous = ``;
      return true;
    },
  };
}

export { createAnnotationPreviewLayerState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewLayerState };
