type ObserverRecord = { disconnect(): void; observe(target: object, options: object): void };
type ObserverConstructor = new (callback: (records: Array<any>) => void) => ObserverRecord;
type EventTargetLike = {
  addEventListener(type: string, listener: (event: any) => void, options?: any): void;
  removeEventListener(type: string, listener: (event: any) => void, options?: any): void;
};

type AnnotationSurfaceObserverDependencies = {
  documentRef: EventTargetLike & { body?: object; documentElement?: object; querySelectorAll(selector: string): { forEach(callback: (element: any) => void): void } };
  windowRef: EventTargetLike;
  elementConstructor: { new (...args: any[]): any; prototype: any };
  htmlElementConstructor: { new (...args: any[]): any };
  mutationObserverConstructor: ObserverConstructor;
  shadowEvent: string;
  containersAttribute: string;
  containerTextAttribute: string;
  metadataAttribute: string;
  annotatableAttribute: string;
  observerOptions: object;
  parseMetadata: (value: string | null) => Record<string, unknown> | undefined;
  executeInMainWorld: (args: { func: (eventName: string) => (() => void) | null; args: [string] }) => (() => void) | null;
  onFeaturesChanged: (features: string[]) => void;
};

function installAnnotationSurfaceObserver(deps: AnnotationSurfaceObserverDependencies): { recordUse(feature: string): void; dispose(): void } {
  const features = new Set<string>();
  const containers = new Set<any>();
  const metadataTargets = new Set<any>();
  const shadowObservers = new Map<any, ObserverRecord>();
  let disposed = false;
  let metadataRequested = false;
  const emitFeatures = () => deps.onFeaturesChanged([...features]);
  const refresh = () => {
    for (const element of containers) {
      if (!element.isConnected || element.ownerDocument !== deps.documentRef ||
        (!element.hasAttribute(deps.containersAttribute) && !element.hasAttribute(deps.containerTextAttribute))) containers.delete(element);
    }
    for (const element of metadataTargets) {
      if (!element.isConnected || element.ownerDocument !== deps.documentRef) metadataTargets.delete(element);
    }
    for (const [root, observer] of shadowObservers) {
      if (!root.host.isConnected || root.host.ownerDocument !== deps.documentRef) { observer.disconnect(); shadowObservers.delete(root); }
    }
    const result = reconcileAnnotationSurfaceFeatures({
      features,
      containerCount: containers.size,
      metadataTargetCount: metadataTargets.size,
      metadataRequested,
    });
    features.clear();
    for (const feature of result.features) features.add(feature);
    if (result.changed) emitFeatures();
  };
  const inspect = (element: any) => {
    if (!element.isConnected || element.ownerDocument !== deps.documentRef) return;
    if (element.hasAttribute(deps.containersAttribute) || element.hasAttribute(deps.containerTextAttribute)) containers.add(element);
    const metadata = element instanceof deps.htmlElementConstructor && element !== deps.documentRef.body &&
      element !== deps.documentRef.documentElement && element.hasAttribute(deps.annotatableAttribute)
      ? deps.parseMetadata(element.getAttribute(deps.metadataAttribute)) : undefined;
    metadata != null && Object.keys(metadata).length > 0 ? metadataTargets.add(element) : metadataTargets.delete(element);
    const shadowRoot = element.shadowRoot;
    if (shadowRoot != null && !shadowObservers.has(shadowRoot)) {
      const observer = new deps.mutationObserverConstructor(handleMutations);
      observer.observe(shadowRoot, deps.observerOptions);
      shadowObservers.set(shadowRoot, observer);
      shadowRoot.querySelectorAll(`*`).forEach(inspect);
    }
  };
  const inspectTree = (element: any) => {
    if (element.isConnected && element.ownerDocument === deps.documentRef) { inspect(element); element.querySelectorAll(`*`).forEach(inspect); }
  };
  function handleMutations(records: Array<any>) {
    for (const record of records) {
      if (record.type === `attributes` && record.target instanceof deps.elementConstructor) inspect(record.target);
      else for (const node of record.addedNodes) if (node instanceof deps.elementConstructor) inspectTree(node);
    }
    refresh();
  }
  const onShadowAttached = (event: any) => {
    const target = event.composedPath()[0];
    if (target instanceof deps.elementConstructor) { inspectTree(target); refresh(); }
  };
  const documentObserver = new deps.mutationObserverConstructor(handleMutations);
  documentObserver.observe(deps.documentRef, deps.observerOptions);
  deps.documentRef.addEventListener(deps.shadowEvent, onShadowAttached);
  const restoreAttachShadow = deps.executeInMainWorld({ func: installAttachShadowObserver, args: [deps.shadowEvent] });
  deps.documentRef.querySelectorAll(`*`).forEach(inspect);
  refresh();
  const onPageShow = () => emitFeatures();
  deps.windowRef.addEventListener(`pageshow`, onPageShow);
  return {
    recordUse(feature) {
      if (disposed || (feature === `requests` && features.has(`requests-with-prompts`))) return;
      if (feature === `metadata`) { metadataRequested = true; refresh(); return; }
      if (feature === `requests-with-prompts`) features.delete(`requests`);
      if (!features.has(feature)) { features.add(feature); emitFeatures(); }
    },
    dispose() {
      disposed = true;
      documentObserver.disconnect();
      for (const observer of shadowObservers.values()) observer.disconnect();
      shadowObservers.clear(); containers.clear(); metadataTargets.clear();
      restoreAttachShadow?.();
      deps.documentRef.removeEventListener(deps.shadowEvent, onShadowAttached);
      deps.windowRef.removeEventListener(`pageshow`, onPageShow);
      features.clear();
      emitFeatures();
    },
  };
}

function installAttachShadowObserver(eventName: string): (() => void) | null {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, `attachShadow`);
  const original = Element.prototype.attachShadow;
  if (descriptor?.configurable !== true || typeof original !== `function`) return null;
  let active = true;
  function attachShadow(this: Element, init: ShadowRootInit) {
    const root = Reflect.apply(original, this, [init]);
    if (active && root.mode === `open`) this.dispatchEvent(new Event(eventName, { bubbles: true, composed: true }));
    return root;
  }
  return Reflect.defineProperty(Element.prototype, `attachShadow`, { ...descriptor, value: attachShadow })
    ? () => {
      active = false;
      if (Reflect.getOwnPropertyDescriptor(Element.prototype, `attachShadow`)?.value === attachShadow) Reflect.defineProperty(Element.prototype, `attachShadow`, descriptor);
    }
    : null;
}

export { installAnnotationSurfaceObserver };
if (typeof module !== `undefined`) module.exports = { installAnnotationSurfaceObserver };
import { reconcileAnnotationSurfaceFeatures } from "./annotation-surface-feature-state";
