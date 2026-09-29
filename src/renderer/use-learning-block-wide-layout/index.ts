// use-learning-block-wide-layout — ResizeObserver-backed wide-layout state.

import "@rchunk/rolldown-runtime";
import { e6 as getReactRuntime } from "@rchunk/app-shared";

interface WideLayoutReactRuntime {
  useCallback<Value extends (...arguments_: never[]) => unknown>(callback: Value, dependencies: readonly unknown[]): Value;
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useState<Value>(value: Value): [Value, (value: Value) => void];
}
interface WideLayoutOptions { disabled?: boolean; minWidth?: number }

let React: WideLayoutReactRuntime;
function initializeLearningBlockWideLayout(): void { React ??= getReactRuntime() as unknown as WideLayoutReactRuntime; }
function useLearningBlockWideLayout({ disabled = false, minWidth = 448 }: WideLayoutOptions = {}): { isWideLayout: boolean; visualizationRef(element: HTMLElement | null): void } {
  initializeLearningBlockWideLayout();
  const [element, setElement] = React.useState<HTMLElement | null>(null);
  const [isWideLayout, setWideLayout] = React.useState(false);
  const visualizationRef = React.useCallback((nextElement: HTMLElement | null): void => setElement(nextElement), []);
  React.useEffect(() => {
    if (disabled || element == null) { setWideLayout(false); return; }
    const update = (width: number): void => { if (width > 0) setWideLayout(width >= minWidth); };
    update(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => { if (entry != null) update(entry.contentRect.width); });
    observer.observe(element);
    return () => observer.disconnect();
  }, [disabled, minWidth, element]);
  return { isWideLayout, visualizationRef };
}

export { useLearningBlockWideLayout as n, initializeLearningBlockWideLayout as t };
