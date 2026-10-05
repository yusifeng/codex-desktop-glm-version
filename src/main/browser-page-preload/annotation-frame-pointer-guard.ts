type GuardDependencies = {
  installAcrossFrames: (install: (root: any, frameWindow: any, refresh: () => void) => () => void) => () => void;
  mutationObserverConstructor: new (callback: (records: any[]) => void) => { observe(target: any, options: any): void; disconnect(): void };
  isElement: (value: any) => boolean;
  isFrame: (value: any) => boolean;
  getFrameWindow: (frame: any) => any | null;
  isOverlayElement: (element: any) => boolean;
};

function installAnnotationFramePointerGuard(deps: GuardDependencies) {
  return deps.installAcrossFrames((root, _frameWindow, refresh) => {
    const state = createAnnotationFramePointerGuardState();

    const restoreFrame = (frame: any) => {
      const saved = state.savedStyles.get(frame);
      if (saved == null) return;
      state.forget(frame);
      if (frame.style.getPropertyValue(`pointer-events`) === `none` && frame.style.getPropertyPriority(`pointer-events`) === `important`) {
        frame.style.setProperty(`pointer-events`, saved.value, saved.priority);
      }
    };

    const updateFrame = (frame: any) => {
      if (deps.getFrameWindow(frame) != null) {
        restoreFrame(frame);
        return;
      }
      if (state.has(frame)) return;
      state.remember(frame, {
        value: frame.style.getPropertyValue(`pointer-events`),
        priority: frame.style.getPropertyPriority(`pointer-events`),
      });
      frame.style.setProperty(`pointer-events`, `none`, `important`);
    };

    let observer: InstanceType<GuardDependencies[`mutationObserverConstructor`]>;
    const onLoad = (event: any) => {
      if (deps.isFrame(event.target)) {
        updateFrame(event.target);
        refresh();
      }
    };
    const scan = (candidate: any): boolean => {
      if (deps.isElement(candidate) && deps.isOverlayElement(candidate)) return false;
      let changed = false;
      if (!deps.isElement(candidate) && state.observe(candidate)) {
        observer.observe(candidate, { childList: true, subtree: true });
        candidate.addEventListener(`load`, onLoad, true);
      }
      const elements = deps.isElement(candidate)
        ? [candidate, ...candidate.querySelectorAll(`*`)]
        : candidate.querySelectorAll(`*`);
      for (const element of elements) {
        if (!deps.isElement(element) || deps.isOverlayElement(element)) continue;
        if (deps.isFrame(element)) {
          updateFrame(element);
          changed = true;
        }
        if (element.shadowRoot != null && !state.observedRoots.has(element.shadowRoot)) {
          changed = scan(element.shadowRoot) || changed;
        }
      }
      return changed;
    };

    observer = new deps.mutationObserverConstructor((records) => {
      let changed = false;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (deps.isElement(node)) changed = scan(node) || changed;
        }
      }
      if (changed) refresh();
    });
    scan(root);

    return () => {
      observer.disconnect();
      for (const observedRoot of state.observedRoots) observedRoot.removeEventListener(`load`, onLoad, true);
      for (const frame of state.savedStyles.keys()) restoreFrame(frame);
    };
  });
}

export { installAnnotationFramePointerGuard };
if (typeof module !== `undefined`) module.exports = { installAnnotationFramePointerGuard };
import { createAnnotationFramePointerGuardState } from "./annotation-frame-pointer-guard-state";
