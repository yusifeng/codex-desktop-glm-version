// right-panel-composer-overlay-alignment —— 右侧面板 composer overlay 的水平对齐测量。
// 原版：app/webview/assets/right-panel-composer-overlay-alignment-95f87dd3a2a9.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface OverlayAlignment {
  left: number;
  width: number;
}

export interface OverlayAlignmentStore {
  get(key: typeof rightPanelComposerOverlayAlignment): OverlayAlignment | null;
  set(key: typeof rightPanelComposerOverlayAlignment, value: OverlayAlignment | null): void;
}

export interface MeasurableElement {
  getBoundingClientRect(): Pick<DOMRect, "left" | "width">;
}

export type ElementObserver = (
  element: MeasurableElement,
  options: unknown,
  callback: () => void,
) => () => void;

/** 原 atom 的语义标识；初始值为 null。 */
const rightPanelComposerOverlayAlignment = Symbol("right-panel-composer-overlay-alignment");

/**
 * 订阅 composer 容器尺寸，只在 left/width 变化时写 store；清理时仅移除
 * 自己最后写入的值，避免覆盖另一个仍在工作的测量实例。
 */
function observeRightPanelComposerOverlayAlignment(
  store: OverlayAlignmentStore,
  element: MeasurableElement,
  observe: ElementObserver = defaultElementObserver,
): () => void {
  let active = true;
  let lastValue: OverlayAlignment | null = null;
  const stop = observe(element, null, () => {
    if (!active) return;
    const { left, width } = element.getBoundingClientRect();
    if (lastValue?.left === left && lastValue.width === width) return;
    lastValue = { left, width };
    store.set(rightPanelComposerOverlayAlignment, lastValue);
  });
  return () => {
    active = false;
    stop();
    if (store.get(rightPanelComposerOverlayAlignment) === lastValue) {
      store.set(rightPanelComposerOverlayAlignment, null);
    }
  };
}

function defaultElementObserver(
  element: MeasurableElement,
  _options: unknown,
  callback: () => void,
): () => void {
  callback();
  if (typeof ResizeObserver === "undefined" || !(element instanceof Element)) return () => {};
  const observer = new ResizeObserver(callback);
  observer.observe(element);
  return () => observer.disconnect();
}

function initializeRightPanelComposerOverlayAlignment(): void {}

export {
  observeRightPanelComposerOverlayAlignment as n,
  rightPanelComposerOverlayAlignment as r,
  initializeRightPanelComposerOverlayAlignment as t,
};
