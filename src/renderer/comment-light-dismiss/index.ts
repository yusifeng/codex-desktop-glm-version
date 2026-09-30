// Light-dismiss shake feedback hook. Release chunk: comment-light-dismiss-4ad7bc38388a.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

interface StyleTarget {
  style: { animation: string; removeProperty(name: string): void };
}
interface MutableRef<T> {
  current: T;
}
interface FrameWindow {
  requestAnimationFrame(callback: () => void): number;
  cancelAnimationFrame(handle: number): void;
}
interface ReactRuntime {
  useRef<T>(initial: T): MutableRef<T>;
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
}
let React: ReactRuntime;
function useShakeFeedback(
  target: MutableRef<StyleTarget | null>,
  frameWindow: FrameWindow | undefined = typeof window === "undefined"
    ? undefined
    : window,
) {
  const frame = React.useRef<number | null>(null);
  const stopShake = () => {
    if (frame.current != null) {
      frameWindow?.cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    target.current?.style.removeProperty("animation");
  };
  const shake = () => {
    stopShake();
    if (frameWindow && target.current) {
      frame.current = frameWindow.requestAnimationFrame(() => {
        frame.current = null;
        if (target.current)
          target.current.style.animation = "shake 900ms linear both";
      });
    }
  };
  React.useEffect(() => stopShake, [stopShake]);
  return { shake, stopShake };
}
function initializeShakeFeedback(): void {
  React = (appSharedChunk as unknown as { e6(): ReactRuntime }).e6();
}
function lightDismissAction({
  isLightDismissible,
  isLightDismissArmed,
}: {
  isLightDismissible: boolean;
  isLightDismissArmed: boolean;
}): "dismiss" | "shake" {
  return isLightDismissible || isLightDismissArmed ? "dismiss" : "shake";
}
function initializeLightDismissAction(): void {}

export {
  useShakeFeedback as i,
  initializeLightDismissAction as n,
  initializeShakeFeedback as r,
  lightDismissAction as t,
};
