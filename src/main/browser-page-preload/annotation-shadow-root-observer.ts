type Observer = { disconnect(): void; observe(target: object, options: object): void };
type ObserverConstructor = new (callback: (records: Array<any>) => void) => Observer;
type ElementLike = {
  isConnected?: boolean;
  ownerDocument?: object;
  shadowRoot?: any;
  querySelectorAll(selector: string): { [Symbol.iterator](): Iterator<any> };
  matches?(selector: string): boolean;
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
};

type AnnotationShadowRootObserverDependencies = {
  mutationObserverConstructor: ObserverConstructor;
  observerOptions: object;
  selector: string;
  isElement(value: unknown): value is ElementLike;
  isIgnored(value: ElementLike): boolean;
  shadowEvent: string;
};

/** Observe annotation-bearing elements across the document and open shadow roots. */
function observeAnnotationShadowRoots(
  root: ElementLike,
  onChange: () => void,
  deps: AnnotationShadowRootObserverDependencies,
): () => void {
  const roots = new Set<any>([root]);
  const observer = new deps.mutationObserverConstructor((records) => {
    const before = roots.size;
    for (const record of records) {
      for (const node of record.addedNodes ?? []) {
        if (deps.isElement(node)) inspect(node);
      }
    }
    let changed = false;
    for (const shadowRoot of roots) {
      if (shadowRoot !== root && (!shadowRoot.host?.isConnected || shadowRoot.host?.ownerDocument !== root.ownerDocument)) {
        roots.delete(shadowRoot);
        changed = true;
      }
    }
    if (changed) {
      observer.disconnect();
      for (const observedRoot of roots) observer.observe(observedRoot, deps.observerOptions);
    }
    if (
      changed ||
      roots.size !== before ||
      records.some((record) =>
        record.type === `attributes` ||
        [...(record.addedNodes ?? []), ...(record.removedNodes ?? [])].some(
          (node) => deps.isElement(node) && (node.matches?.(deps.selector) || Array.from(node.querySelectorAll(deps.selector)).length > 0),
        ),
      )
    ) onChange();
  });

  function inspect(element: ElementLike) {
    const descendants = [...element.querySelectorAll(`*`)];
    for (const candidate of deps.isElement(element) ? [element, ...descendants] : descendants) {
      if (!deps.isElement(candidate) || deps.isIgnored(candidate) || candidate.shadowRoot == null || roots.has(candidate.shadowRoot)) continue;
      roots.add(candidate.shadowRoot);
      observer.observe(candidate.shadowRoot, deps.observerOptions);
      inspect(candidate.shadowRoot);
    }
  }

  const onShadowAttached = (event: any) => {
    const target = event.composedPath?.()[0];
    if (deps.isElement(target) && !deps.isIgnored(target)) {
      inspect(target);
      onChange();
    }
  };
  observer.observe(root, deps.observerOptions);
  inspect(root);
  root.addEventListener(deps.shadowEvent, onShadowAttached);
  return () => {
    observer.disconnect();
    root.removeEventListener(deps.shadowEvent, onShadowAttached);
  };
}

export { observeAnnotationShadowRoots };
if (typeof module !== `undefined`) module.exports = { observeAnnotationShadowRoots };
