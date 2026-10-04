type MutationObserverLike = { disconnect(): void; observe(target: object, options: object): void };
type MutationObserverConstructor = new (callback: (records: Array<{ target: unknown }>) => void) => MutationObserverLike;
type AnnotationOverlayObserverDependencies = {
  mutationObserverConstructor: MutationObserverConstructor;
  mutationObserverOptions: object;
  nodeConstructor: { new (...args: any[]): any };
};

/** Observe page mutations while excluding changes made inside the annotation overlay. */
function observeAnnotationMutationsOutsideOverlay(
  documentLike: { documentElement: object },
  overlayRoot: { contains(target: unknown): boolean },
  onChange: () => void,
  deps: AnnotationOverlayObserverDependencies,
): () => void {
  let disposed = false;
  const observer = new deps.mutationObserverConstructor((records) => {
    if (disposed) return;
    const onlyOverlayMutations = records.length > 0 && records.every(
      (record) => record.target instanceof deps.nodeConstructor && overlayRoot.contains(record.target),
    );
    if (!onlyOverlayMutations) onChange();
  });
  observer.observe(documentLike.documentElement, deps.mutationObserverOptions);
  return () => { if (!disposed) { disposed = true; observer.disconnect(); } };
}

export { observeAnnotationMutationsOutsideOverlay };
if (typeof module !== `undefined`) module.exports = { observeAnnotationMutationsOutsideOverlay };
